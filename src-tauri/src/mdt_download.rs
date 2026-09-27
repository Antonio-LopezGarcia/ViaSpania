//! Native-resolution WCS block download. The intermediate GeoTIFF stays on disk;
//! GDAL's block cache is explicitly bounded, including the subsequent warp.
use super::*;

// WCS 2.0 DescribeCoverage rounds MDT05 offsets and yields 1023×1023
// responses to GDAL's 1024×1024 reads. WCS 1.0 supplies more precise offsets
// and explicit block dimensions. OriginAtBoundary matches its published origin.
// https://gdal.org/en/stable/drivers/raster/wcs.html
#[derive(Clone, Copy, Debug, Default, Deserialize)]
pub(crate) enum WcsSource {
    #[default]
    #[serde(rename = "mdt5")]
    Mdt5,
    #[serde(rename = "mdt25")]
    Mdt25,
    #[serde(rename = "mdt200")]
    Mdt200,
    #[serde(rename = "mds05")]
    Mds5,
}
impl WcsSource {
    fn specification(self) -> (&'static str, &'static str, f64) {
        match self {
            Self::Mdt5 => (
                "https://servicios.idee.es/wcs-inspire/mdt?",
                "Elevacion4258_5",
                5.0,
            ),
            Self::Mdt25 => (
                "https://servicios.idee.es/wcs-inspire/mdt?",
                "Elevacion4258_25",
                25.0,
            ),
            Self::Mdt200 => (
                "https://servicios.idee.es/wcs-inspire/mdt?",
                "Elevacion4258_200",
                200.0,
            ),
            Self::Mds5 => ("https://wcs-mds.idee.es/mds?", "mds05", 5.0),
        }
    }
    fn service_xml(self) -> String {
        let (url, coverage, _) = self.specification();
        format!("<WCS_GDAL><ServiceURL>{url}</ServiceURL><Version>1.0.0</Version><CoverageName>{coverage}</CoverageName><PreferredFormat>GEOTIFFINT16</PreferredFormat><BlockXSize>1024</BlockXSize><BlockYSize>1024</BlockYSize><OverviewCount>0</OverviewCount><OriginAtBoundary>true</OriginAtBoundary><Timeout>120</Timeout></WCS_GDAL>")
    }
}
const MAX_SOURCE_CELLS: u64 = 100_000_000;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct MdtDownloadRequest {
    #[serde(default)]
    source_id: WcsSource,
    bounds_wgs84: [f64; 4],
    target_crs: String,
    output_name: String,
}

fn validate_request(request: &MdtDownloadRequest) -> Result<(), NativeError> {
    let [west, south, east, north] = request.bounds_wgs84;
    if request.bounds_wgs84.iter().any(|v| !v.is_finite())
        || west < -180.0
        || east > 180.0
        || south < -90.0
        || north > 90.0
        || west >= east
        || south >= north
        || !matches!(
            request.target_crs.as_str(),
            "EPSG:25828" | "EPSG:25829" | "EPSG:25830" | "EPSG:25831"
        )
    {
        return Err(NativeError::Gdal(
            "Área o CRS de descarga del modelo no válidos".into(),
        ));
    }
    Ok(())
}

fn check_size(metadata: &Value, limit: u64, max_axis: u64) -> Result<(), NativeError> {
    let width = metadata["size"][0].as_u64().unwrap_or(0);
    let height = metadata["size"][1].as_u64().unwrap_or(0);
    if width == 0
        || height == 0
        || width > max_axis
        || height > max_axis
        || width.checked_mul(height).is_none_or(|cells| cells > limit)
    {
        return Err(NativeError::Gdal(format!(
            "La ventana nativa genera {width} × {height} celdas; reduzca el área de descarga"
        )));
    }
    Ok(())
}

fn translate() -> Result<Command, NativeError> {
    let executable = command_path("gdal_translate").ok_or_else(|| {
        NativeError::Gdal("gdal_translate con soporte WCS no está instalado".into())
    })?;
    let mut command = Command::new(executable);
    // WCS otherwise optimizes a large RasterIO into one oversized GetCoverage.
    // https://gdal.org/en/stable/user/configoptions.html#config-GDAL_FORCE_CACHING
    command
        .env("GDAL_FORCE_CACHING", "YES")
        .env("GDAL_CACHEMAX", "64");
    Ok(command)
}

/// Keep stderr on disk to avoid pipe deadlocks; bound reads in failure messages.
/// Kill and reap the child before cleanup so cancellation leaves no open raster.
fn run(command: &mut Command, cancel: &AtomicBool, directory: &Path) -> Result<(), NativeError> {
    if cancel.load(Ordering::SeqCst) {
        return Err(NativeError::Cancelled);
    }
    let log = directory.join("gdal-errors.txt");
    let stderr = std::fs::File::create(&log).map_err(|e| NativeError::Io(e.to_string()))?;
    let mut child = command
        .stdout(Stdio::null())
        .stderr(stderr)
        .spawn()
        .map_err(|e| NativeError::Gdal(e.to_string()))?;
    loop {
        if cancel.load(Ordering::SeqCst) {
            let _ = child.kill();
            let _ = child.wait();
            return Err(NativeError::Cancelled);
        }
        match child.try_wait() {
            Ok(Some(status)) => {
                if status.success() {
                    return Ok(());
                }
                use std::io::Read;
                let mut message = String::new();
                if let Ok(file) = std::fs::File::open(&log) {
                    let _ = file.take(4096).read_to_string(&mut message);
                }
                return Err(NativeError::Gdal(format!(
                    "No se pudo descargar/procesar el modelo por bloques: {}",
                    message.trim()
                )));
            }
            Ok(None) => std::thread::sleep(std::time::Duration::from_millis(100)),
            Err(error) => {
                let _ = child.kill();
                let _ = child.wait();
                return Err(NativeError::Gdal(error.to_string()));
            }
        }
    }
}

fn download(
    directory: &Path,
    request: &MdtDownloadRequest,
    cancel: &AtomicBool,
) -> Result<RasterResult, NativeError> {
    validate_request(request)?;
    let temporary = directory.join(format!("mdt-blocks-{}", uuid::Uuid::new_v4()));
    std::fs::create_dir_all(&temporary).map_err(|e| NativeError::Io(e.to_string()))?;
    let result = (|| {
        let service = temporary.join("service.xml");
        let window = temporary.join("window.vrt");
        let source = temporary.join("source.tif");
        let output = temporary.join("result.tif");
        std::fs::write(&service, request.source_id.service_xml())
            .map_err(|e| NativeError::Io(e.to_string()))?;
        let [west, south, east, north] = request.bounds_wgs84;
        // VRT creation only describes the selected native grid. No -tr, -outsize,
        // or overview selection: source cells retain their published coordinates.
        run(
            translate()?
                .args([
                    "-of",
                    "VRT",
                    "-epo",
                    "-projwin_srs",
                    "EPSG:4326",
                    "-projwin",
                    &west.to_string(),
                    &north.to_string(),
                    &east.to_string(),
                    &south.to_string(),
                ])
                .arg(&service)
                .arg(&window),
            cancel,
            &temporary,
        )?;
        check_size(
            &gdal_json_basic(&window)?,
            MAX_SOURCE_CELLS,
            MAX_SOURCE_CELLS,
        )?;
        let process = RasterProcessRequest {
            input_path: source.to_string_lossy().into_owned(),
            output_name: request.output_name.clone(),
            target_crs: request.target_crs.clone(),
            resolution_m: Some(request.source_id.specification().2),
            cutline_path: None,
        };
        // A virtual warp checks the exact projected dimensions before downloading.
        let projected = temporary.join("projected.vrt");
        let mut preflight = elevation_warp_command(&window, &projected, &process, "VRT")?;
        run(&mut preflight, cancel, &temporary)?;
        raster_limits::check(&gdal_json_basic(&projected)?)?;
        run(
            translate()?
                .args([
                    "-of",
                    "GTiff",
                    "-co",
                    "TILED=YES",
                    "-co",
                    "COMPRESS=DEFLATE",
                    "-co",
                    "NUM_THREADS=1",
                ])
                .arg(&window)
                .arg(&source),
            cancel,
            &temporary,
        )?;
        run(
            &mut elevation_warp_command(&source, &output, &process, "COG")?,
            cancel,
            &temporary,
        )?;
        if cancel.load(Ordering::SeqCst) {
            return Err(NativeError::Cancelled);
        }
        let metadata = gdal_json(&output)?;
        raster_limits::check(&metadata)?;
        let preview_data_url = raster_preview_data_url(&output)?;
        if cancel.load(Ordering::SeqCst) {
            return Err(NativeError::Cancelled);
        }
        let bytes = std::fs::metadata(&output)
            .map_err(|e| NativeError::Io(e.to_string()))?
            .len();
        // Publish only the complete, independently readable COG, never a VRT
        // pointing at temporary tiles. Unique name avoids overwriting imports.
        let destination = directory.join(safe_filename(&format!(
            "{}-{}",
            request.output_name,
            uuid::Uuid::new_v4()
        )));
        std::fs::rename(&output, &destination).map_err(|e| NativeError::Io(e.to_string()))?;
        Ok(RasterResult {
            path: destination.to_string_lossy().into_owned(),
            bytes,
            metadata,
            preview_data_url,
        })
    })();
    let _ = std::fs::remove_dir_all(&temporary);
    result
}

#[tauri::command]
pub(crate) async fn download_mdt_tiles(
    app: tauri::AppHandle,
    state: State<'_, DownloadState>,
    request: MdtDownloadRequest,
) -> Result<RasterResult, NativeError> {
    validate_request(&request)?;
    state.0.store(false, Ordering::SeqCst);
    let cancel = state.0.clone();
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|e| NativeError::Io(e.to_string()))?
        .join("rasters");
    std::fs::create_dir_all(&directory).map_err(|e| NativeError::Io(e.to_string()))?;
    tauri::async_runtime::spawn_blocking(move || download(&directory, &request, &cancel))
        .await
        .map_err(|e| NativeError::Gdal(e.to_string()))?
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn selects_official_service_and_resolution_for_each_model() {
        for (source, coverage, resolution) in [
            (WcsSource::Mdt5, "Elevacion4258_5", 5.0),
            (WcsSource::Mdt25, "Elevacion4258_25", 25.0),
            (WcsSource::Mdt200, "Elevacion4258_200", 200.0),
            (WcsSource::Mds5, "mds05", 5.0),
        ] {
            let xml = source.service_xml();
            assert!(xml.contains(&format!("<CoverageName>{coverage}</CoverageName>")));
            assert!(xml.contains("<BlockXSize>1024</BlockXSize>"));
            assert_eq!(source.specification().2, resolution);
        }
    }

    #[test]
    fn validates_bounds_and_sizes_before_allocating() {
        let mut request = MdtDownloadRequest {
            source_id: WcsSource::Mdt5,
            bounds_wgs84: [-3.3, 40.0, -3.02, 40.23],
            target_crs: "EPSG:25830".into(),
            output_name: "test".into(),
        };
        assert!(validate_request(&request).is_ok());
        request.bounds_wgs84[0] = f64::NAN;
        assert!(validate_request(&request).is_err());
        for (width, height, valid) in [
            (5000, 6000, true),
            (8192, 8192, true),
            (8193, 8192, false),
            (0, 100, false),
        ] {
            assert_eq!(
                check_size(
                    &serde_json::json!({"size":[width,height]}),
                    8192 * 8192,
                    8192
                )
                .is_ok(),
                valid
            );
        }
        assert!(check_size(
            &serde_json::json!({"size":[16384,16384]}),
            MAX_SOURCE_CELLS,
            16384
        )
        .is_err());
    }

    #[test]
    fn cancelled_download_cleans_temporary_files() {
        let directory =
            std::env::temp_dir().join(format!("mdt-cancel-test-{}", uuid::Uuid::new_v4()));
        let request = MdtDownloadRequest {
            source_id: WcsSource::Mdt5,
            bounds_wgs84: [-3.3, 40.0, -3.02, 40.23],
            target_crs: "EPSG:25830".into(),
            output_name: "test".into(),
        };
        let result = download(&directory, &request, &AtomicBool::new(true));
        assert!(matches!(result, Err(NativeError::Cancelled)));
        assert_eq!(std::fs::read_dir(&directory).unwrap().count(), 0);
        std::fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn large_local_grid_preserves_resolution_georeferencing_and_block_edges() {
        use std::io::{Seek, SeekFrom};
        let directory =
            std::env::temp_dir().join(format!("mdt-grid-test-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&directory).unwrap();
        let width = 8192_u64;
        let height = 8292_u64;
        let mut raw = std::fs::File::create(directory.join("grid.raw")).unwrap();
        raw.set_len(width * height * 2).unwrap();
        let samples = [
            (1023_u64, 1023_u64, 123_i16),
            (1024, 1024, 456),
            (4095, 4095, 789),
            (4096, 4096, 1234),
            (8191, 8291, 2345),
        ];
        for &(x, y, value) in &samples {
            raw.seek(SeekFrom::Start((y * width + x) * 2)).unwrap();
            raw.write_all(&value.to_le_bytes()).unwrap();
        }
        drop(raw);
        let input = directory.join("grid.vrt");
        std::fs::write(&input, format!(r#"<VRTDataset rasterXSize="{width}" rasterYSize="{height}"><SRS>EPSG:25830</SRS><GeoTransform>500000,5,0,4500000,0,-5</GeoTransform><VRTRasterBand dataType="Int16" band="1" subClass="VRTRawRasterBand"><SourceFilename relativeToVRT="1">grid.raw</SourceFilename><ImageOffset>0</ImageOffset><PixelOffset>2</PixelOffset><LineOffset>{}</LineOffset><ByteOrder>LSB</ByteOrder></VRTRasterBand></VRTDataset>"#,width*2)).unwrap();
        let copy = directory.join("copy.tif");
        let cancel = AtomicBool::new(false);
        run(
            translate()
                .unwrap()
                .args([
                    "-of",
                    "GTiff",
                    "-co",
                    "TILED=YES",
                    "-co",
                    "COMPRESS=DEFLATE",
                ])
                .arg(&input)
                .arg(&copy),
            &cancel,
            &directory,
        )
        .unwrap();
        let output = directory.join("output.tif");
        let request = RasterProcessRequest {
            input_path: copy.to_string_lossy().into_owned(),
            output_name: "test".into(),
            target_crs: "EPSG:25830".into(),
            resolution_m: None,
            cutline_path: None,
        };
        reproject_elevation_raster(&copy, &output, &request).unwrap();
        let metadata = gdal_json(&output).unwrap();
        assert_eq!(metadata["size"], serde_json::json!([width, height]));
        assert_eq!(
            metadata["geoTransform"],
            serde_json::json!([500000.0, 5.0, 0.0, 4500000.0, 0.0, -5.0])
        );
        assert_eq!(metadata["bands"][0]["noDataValue"], -9999.0);
        for &(x, y, value) in &samples {
            let result = Command::new(command_path("gdallocationinfo").unwrap())
                .args(["-valonly"])
                .arg(&output)
                .args([x.to_string(), y.to_string()])
                .output()
                .unwrap();
            assert!(result.status.success());
            assert_eq!(
                String::from_utf8(result.stdout)
                    .unwrap()
                    .trim()
                    .parse::<f64>()
                    .unwrap(),
                value as f64
            );
        }
        assert!(raster_preview_data_url(&output)
            .unwrap()
            .starts_with("data:image/png;base64,"));
        std::fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    #[ignore = "Descarga WCS real: definir VIASPANIA_WCS_SOURCE=mdt25, mdt200 o mds05"]
    fn live_other_elevation_sources() {
        let source = std::env::var("VIASPANIA_WCS_SOURCE").unwrap();
        let (source_id, bounds_wgs84, large) = match source.as_str() {
            "mdt25" => (WcsSource::Mdt25, [-4.0, 39.5, -2.7, 40.55], true),
            "mdt200" => (WcsSource::Mdt200, [-9.5, 35.9, 4.5, 43.8], true),
            "mds05" => (WcsSource::Mds5, [-3.3, 40.0, -3.02, 40.23], true),
            _ => panic!("fuente de prueba no válida"),
        };
        let directory =
            std::env::temp_dir().join(format!("wcs-model-test-{}", uuid::Uuid::new_v4()));
        let request = MdtDownloadRequest {
            source_id,
            bounds_wgs84,
            target_crs: "EPSG:25830".into(),
            output_name: "model".into(),
        };
        let result = download(&directory, &request, &AtomicBool::new(false)).unwrap();
        let size = &result.metadata["size"];
        if large {
            assert!(size[0].as_u64().unwrap() > 4096);
            assert!(size[1].as_u64().unwrap() > 4096);
        }
        assert_eq!(
            result.metadata["geoTransform"][1],
            source_id.specification().2
        );
        assert_eq!(
            result.metadata["geoTransform"][5],
            -source_id.specification().2
        );
        println!(
            "{source}: {size} · resolución {} m",
            source_id.specification().2
        );
        std::fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    #[ignore = "Descarga real WCS: ejecutar manualmente con red y GDAL/PROJ"]
    fn live_mdt_larger_than_4096() {
        let directory =
            std::env::temp_dir().join(format!("mdt-live-test-{}", uuid::Uuid::new_v4()));
        let request = MdtDownloadRequest {
            source_id: WcsSource::Mdt5,
            bounds_wgs84: [-3.3, 40.0, -3.02, 40.23],
            target_crs: "EPSG:25830".into(),
            output_name: "test".into(),
        };
        let result = download(&directory, &request, &AtomicBool::new(false)).unwrap();
        assert!(result.metadata["size"][0].as_u64().unwrap() > 4096);
        assert!(result.metadata["size"][1].as_u64().unwrap() > 4096);
        assert_eq!(result.metadata["geoTransform"][1], 5.0);
        assert_eq!(result.metadata["geoTransform"][5], -5.0);
        assert!(result
            .preview_data_url
            .starts_with("data:image/png;base64,"));
        println!("MDT05 real: {}", result.metadata["size"]);
        std::fs::remove_dir_all(directory).unwrap();
    }
}
