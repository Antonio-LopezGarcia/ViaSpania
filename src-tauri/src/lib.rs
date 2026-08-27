use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    cmp::Ordering as CmpOrdering,
    collections::BinaryHeap,
    io::Write,
    path::{Path, PathBuf},
    process::{Command, Stdio},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex, OnceLock,
    },
    time::UNIX_EPOCH,
};
use tauri::{Emitter, Manager, State};
use tokio::io::AsyncWriteExt;
use url::Url;

const MAX_DOWNLOAD_BYTES: u64 = 1_500_000_000;
const MAX_ROUTE_CELLS: usize = 5_000_000;
const ALLOWED_HOSTS: &[&str] = &[
    "servicios.idee.es",
    "wcs-mds.idee.es",
    "www.ign.es",
    "ign.es",
    "vt-poblaciones.ign.es",
    "copernicus-dem-30m.s3.amazonaws.com",
];

#[derive(Default)]
struct DownloadState(Arc<AtomicBool>);

#[derive(Clone, Default)]
struct SurfaceCache(Arc<Mutex<Option<CachedSurface>>>);

#[derive(Default)]
struct IsochroneState(Arc<AtomicBool>);

struct CachedSurface {
    key: String,
    surface: Arc<PreparedSurface>,
}

struct PreparedSurface {
    raster_crs: String,
    width: usize,
    height: usize,
    origin_x: f64,
    origin_y: f64,
    pixel_x: f64,
    pixel_y: f64,
    nodata: Option<f32>,
    elevations: Vec<f32>,
    blocked: Vec<bool>,
    penalties: Vec<f64>,
    discounts: Vec<f64>,
}

#[derive(Debug, thiserror::Error)]
enum NativeError {
    #[error("URL no permitida: {0}")]
    InvalidUrl(String),
    #[error("Error de red: {0}")]
    Network(String),
    #[error("Error de archivo: {0}")]
    Io(String),
    #[error("GDAL no pudo procesar el archivo: {0}")]
    Gdal(String),
    #[error("La descarga fue cancelada")]
    Cancelled,
    #[error("La respuesta supera el límite de 1,5 GB")]
    TooLarge,
    #[error("El servicio devolvió XML en lugar de un GeoTIFF: {0}")]
    ServiceException(String),
}

impl serde::Serialize for NativeError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeStatus {
    rust_version: String,
    gdal_version: String,
    proj_version: String,
    gdal_available: bool,
    total_memory_bytes: Option<u64>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadProgress {
    received_bytes: u64,
    total_bytes: Option<u64>,
    percent: Option<f64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RasterResult {
    path: String,
    bytes: u64,
    metadata: Value,
    preview_data_url: String,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct RouteRequest {
    raster_path: String,
    start: [f64; 2],
    end: [f64; 2],
    model: String,
    #[serde(default)]
    barriers: Vec<BarrierRequest>,
    #[serde(default)]
    corridors: Vec<CorridorRequest>,
    #[serde(default)]
    crossings: Vec<CrossingRequest>,
    #[serde(default)]
    points_of_interest: Vec<PointOfInterestRequest>,
    #[serde(default = "default_connectivity")]
    connectivity: u8,
    #[serde(default = "default_critical_slope")]
    critical_slope_percent: f64,
    #[serde(default = "default_ardigo_speed")]
    ardigo_speed_ms: f64,
    #[serde(default = "default_route_cells")]
    max_cells: usize,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct BarrierRequest {
    coordinates: Vec<[f64; 2]>,
    kind: String,
    value: f64,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct CorridorRequest {
    coordinates: Vec<[f64; 2]>,
    width_m: f64,
    cost_multiplier: f64,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct CrossingRequest {
    coordinates: Vec<[f64; 2]>,
    crossing_cost_multiplier: f64,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct PointOfInterestRequest {
    coordinate: [f64; 2],
    influence_radius_m: f64,
    attraction: f64,
    mode: String,
}

fn default_connectivity() -> u8 {
    8
}
fn default_critical_slope() -> f64 {
    10.0
}
fn default_ardigo_speed() -> f64 {
    1.2
}
fn default_route_cells() -> usize {
    MAX_ROUTE_CELLS
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeRouteResult {
    model: String,
    direction: String,
    path: Vec<usize>,
    coordinates: Vec<[f64; 2]>,
    elevations_m: Vec<f64>,
    slopes_percent: Vec<f64>,
    cost: f64,
    unit: String,
    distance_m: f64,
    ascent_m: f64,
    descent_m: f64,
    source: String,
    surface_reused: bool,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct IsochroneRequest {
    raster_path: String,
    origins: Vec<[f64; 2]>,
    model: String,
    #[serde(default)]
    barriers: Vec<BarrierRequest>,
    #[serde(default)]
    corridors: Vec<CorridorRequest>,
    #[serde(default)]
    crossings: Vec<CrossingRequest>,
    #[serde(default)]
    points_of_interest: Vec<PointOfInterestRequest>,
    #[serde(default = "default_connectivity")]
    connectivity: u8,
    #[serde(default = "default_critical_slope")]
    critical_slope_percent: f64,
    #[serde(default = "default_ardigo_speed")]
    ardigo_speed_ms: f64,
    #[serde(default = "default_route_cells")]
    max_cells: usize,
    interval: f64,
    #[serde(default = "default_isochrone_levels")]
    max_levels: usize,
}

fn default_isochrone_levels() -> usize {
    12
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct IsochroneLine {
    level: f64,
    coordinates: Vec<[f64; 2]>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct IsochroneResult {
    model: String,
    unit: String,
    interval: f64,
    max_cost: f64,
    reachable_cells: usize,
    lines: Vec<IsochroneLine>,
    surface_width: usize,
    surface_height: usize,
    surface_values: Vec<f32>,
    surface_reused: bool,
    source: String,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LcpCorridorRequest {
    #[serde(flatten)]
    route: RouteRequest,
    threshold_percent: f64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LcpCorridorResult {
    model: String,
    unit: String,
    optimal_cost: f64,
    threshold_percent: f64,
    corridor_cells: usize,
    surface_width: usize,
    surface_height: usize,
    surface_values: Vec<f32>,
    surface_reused: bool,
    source: String,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ContourRequest {
    raster_path: String,
    interval_m: f64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ContourResult {
    interval_m: f64,
    lines: Vec<IsochroneLine>,
    min_elevation_m: f64,
    max_elevation_m: f64,
    raster_crs: String,
    resolution_m: f64,
    nodata_cells: usize,
    source: String,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ViewshedObserver {
    id: String,
    name: String,
    coordinate: [f64; 2],
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ViewshedRequest {
    raster_path: String,
    observers: Vec<ViewshedObserver>,
    observer_height_m: f64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ViewshedObserverResult {
    observer_id: String,
    observer_name: String,
    coordinate: [f64; 2],
    ground_elevation_m: f64,
    observer_height_m: f64,
    surface_width: usize,
    surface_height: usize,
    surface_values: Vec<f32>,
    visible_cells: usize,
    valid_cells: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ViewshedResult {
    observers: Vec<ViewshedObserverResult>,
    raster_crs: String,
    resolution_m: f64,
    source: String,
    limitation: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct IsochroneProgress {
    phase: String,
    percent: f64,
    processed_cells: usize,
    total_cells: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RasterSample {
    lon: f64,
    lat: f64,
    elevation_m: Option<f64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct TerrainMesh {
    width: usize,
    height: usize,
    width_m: f64,
    height_m: f64,
    min_elevation_m: f32,
    max_elevation_m: f32,
    elevations: Vec<f32>,
    wgs84_extent: [f64; 4],
}

#[derive(Copy, Clone)]
struct QueueState {
    cost: f64,
    position: usize,
}

impl PartialEq for QueueState {
    fn eq(&self, other: &Self) -> bool {
        self.position == other.position && self.cost == other.cost
    }
}
impl Eq for QueueState {}
impl Ord for QueueState {
    fn cmp(&self, other: &Self) -> CmpOrdering {
        other
            .cost
            .total_cmp(&self.cost)
            .then_with(|| self.position.cmp(&other.position))
    }
}
impl PartialOrd for QueueState {
    fn partial_cmp(&self, other: &Self) -> Option<CmpOrdering> {
        Some(self.cmp(other))
    }
}

static BUNDLED_GEOSPATIAL_DIR: OnceLock<PathBuf> = OnceLock::new();

fn platform_executable_name(name: &str, windows: bool) -> String {
    if windows {
        format!("{name}.exe")
    } else {
        name.to_owned()
    }
}

fn platform_external_path(path: &Path, windows: bool) -> PathBuf {
    if !windows {
        return path.to_path_buf();
    }
    let raw = path.to_string_lossy();
    if let Some(network_path) = raw.strip_prefix(r"\\?\UNC\") {
        return PathBuf::from(format!(r"\\{network_path}"));
    }
    raw.strip_prefix(r"\\?\")
        .map(PathBuf::from)
        .unwrap_or_else(|| path.to_path_buf())
}

fn command_path(name: &str) -> Option<PathBuf> {
    let executable_name = platform_executable_name(name, cfg!(windows));
    let mut candidates = vec![
        BUNDLED_GEOSPATIAL_DIR
            .get()
            .map(|root| root.join("bin").join(&executable_name)),
        Some(PathBuf::from(format!(
            "/opt/homebrew/bin/{executable_name}"
        ))),
        Some(PathBuf::from(format!("/usr/local/bin/{executable_name}"))),
        Some(PathBuf::from(format!("/usr/bin/{executable_name}"))),
    ];
    if let Some(paths) = std::env::var_os("PATH") {
        candidates.extend(
            std::env::split_paths(&paths).map(|directory| Some(directory.join(&executable_name))),
        );
    }
    candidates.into_iter().flatten().find(|path| path.is_file())
}

fn command_version(name: &str, argument: &str) -> Option<String> {
    let executable = command_path(name)?;
    let output = Command::new(executable).arg(argument).output().ok()?;
    if !output.status.success() {
        return None;
    }
    Some(String::from_utf8_lossy(&output.stdout).trim().to_owned())
}

fn total_memory_bytes() -> Option<u64> {
    #[cfg(target_os = "macos")]
    {
        return Command::new("/usr/sbin/sysctl")
            .args(["-n", "hw.memsize"])
            .output()
            .ok()
            .filter(|output| output.status.success())
            .and_then(|output| String::from_utf8(output.stdout).ok())
            .and_then(|value| value.trim().parse().ok());
    }
    #[cfg(target_os = "linux")]
    {
        return std::fs::read_to_string("/proc/meminfo")
            .ok()?
            .lines()
            .find(|line| line.starts_with("MemTotal:"))?
            .split_whitespace()
            .nth(1)?
            .parse::<u64>()
            .ok()
            .map(|kb| kb * 1024);
    }
    #[cfg(target_os = "windows")]
    {
        return Command::new("powershell.exe")
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                "(Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory",
            ])
            .output()
            .ok()
            .filter(|output| output.status.success())
            .and_then(|output| String::from_utf8(output.stdout).ok())
            .and_then(|value| value.trim().parse().ok());
    }
    #[allow(unreachable_code)]
    None
}

fn validate_remote_url(raw: &str) -> Result<Url, NativeError> {
    let url = Url::parse(raw).map_err(|_| NativeError::InvalidUrl(raw.to_owned()))?;
    let host = url.host_str().unwrap_or_default();
    if url.scheme() != "https" || !ALLOWED_HOSTS.contains(&host) {
        return Err(NativeError::InvalidUrl(raw.to_owned()));
    }
    Ok(url)
}

fn safe_filename(name: &str) -> String {
    let stem: String = name
        .chars()
        .filter(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
        .take(80)
        .collect();
    format!("{}.tif", if stem.is_empty() { "mdt" } else { &stem })
}

fn gdal_json(path: &Path) -> Result<Value, NativeError> {
    let executable = command_path("gdalinfo")
        .ok_or_else(|| NativeError::Gdal("gdalinfo no está instalado".to_owned()))?;
    let output = Command::new(executable)
        .args(["-json", "-stats"])
        .arg(path)
        .output()
        .map_err(|error| NativeError::Gdal(error.to_string()))?;
    if !output.status.success() {
        return Err(NativeError::Gdal(
            String::from_utf8_lossy(&output.stderr).trim().to_owned(),
        ));
    }
    serde_json::from_slice(&output.stdout).map_err(|error| NativeError::Gdal(error.to_string()))
}

fn gdal_json_basic(path: &Path) -> Result<Value, NativeError> {
    let executable = command_path("gdalinfo")
        .ok_or_else(|| NativeError::Gdal("gdalinfo no está instalado".to_owned()))?;
    let output = Command::new(executable)
        .arg("-json")
        .arg(path)
        .output()
        .map_err(|error| NativeError::Gdal(error.to_string()))?;
    if !output.status.success() {
        return Err(NativeError::Gdal(
            String::from_utf8_lossy(&output.stderr).trim().to_owned(),
        ));
    }
    serde_json::from_slice(&output.stdout).map_err(|error| NativeError::Gdal(error.to_string()))
}

fn auxiliary_metadata_path(path: &Path) -> PathBuf {
    PathBuf::from(format!("{}.aux.xml", path.to_string_lossy()))
}

fn raster_preview_data_url(path: &Path) -> Result<String, NativeError> {
    let executable = command_path("gdal_translate")
        .ok_or_else(|| NativeError::Gdal("gdal_translate no está instalado".to_owned()))?;
    let preview_path = path.with_extension(format!("preview-{}.png", uuid::Uuid::new_v4()));
    let output = Command::new(executable)
        .args([
            "-of", "PNG", "-ot", "Byte", "-outsize", "1400", "0", "-scale",
        ])
        .arg(path)
        .arg(&preview_path)
        .output()
        .map_err(|error| NativeError::Gdal(error.to_string()))?;
    if !output.status.success() {
        return Err(NativeError::Gdal(
            String::from_utf8_lossy(&output.stderr).trim().to_owned(),
        ));
    }
    let bytes = std::fs::read(&preview_path).map_err(|error| NativeError::Io(error.to_string()))?;
    let _ = std::fs::remove_file(&preview_path);
    let _ = std::fs::remove_file(auxiliary_metadata_path(&preview_path));
    Ok(format!("data:image/png;base64,{}", BASE64.encode(bytes)))
}

fn colored_preview_data_url(path: &Path) -> Result<String, NativeError> {
    let executable = command_path("gdal_translate")
        .ok_or_else(|| NativeError::Gdal("gdal_translate no está instalado".to_owned()))?;
    let preview_path = path.with_extension(format!("preview-{}.png", uuid::Uuid::new_v4()));
    let output = Command::new(executable)
        .args(["-of", "PNG", "-outsize", "1400", "0"])
        .arg(path)
        .arg(&preview_path)
        .output()
        .map_err(|error| NativeError::Gdal(error.to_string()))?;
    if !output.status.success() {
        return Err(NativeError::Gdal(
            String::from_utf8_lossy(&output.stderr).trim().to_owned(),
        ));
    }
    let bytes = std::fs::read(&preview_path).map_err(|error| NativeError::Io(error.to_string()))?;
    let _ = std::fs::remove_file(&preview_path);
    let _ = std::fs::remove_file(auxiliary_metadata_path(&preview_path));
    Ok(format!("data:image/png;base64,{}", BASE64.encode(bytes)))
}

fn palette_definition(palette: &str) -> Result<&'static str, NativeError> {
    match palette {
        "terrain" => Ok("nv 0 0 0 0\n-50 15 60 125\n0 35 105 170\n1 55 145 75\n300 140 185 80\n700 215 190 115\n1300 165 115 75\n2200 205 205 195\n3500 255 255 255\n"),
        "hypsometric" => Ok("nv 0 0 0 0\n-50 35 75 160\n0 50 130 210\n1 45 150 80\n250 130 195 70\n600 235 220 85\n1000 220 145 65\n1600 155 90 65\n2400 205 205 205\n3500 255 255 255\n"),
        "viridis" => Ok("nv 0 0 0 0\n-50 68 1 84\n0 68 1 84\n500 59 82 139\n1000 33 145 140\n1500 94 201 98\n2200 253 231 37\n3500 253 231 37\n"),
        "alpine" => Ok("nv 0 0 0 0\n-50 8 48 107\n0 20 95 160\n250 50 145 95\n700 145 190 110\n1200 185 150 100\n1800 135 115 105\n2400 210 220 225\n3500 255 255 255\n"),
        _ => Err(NativeError::Gdal("Paleta de color no reconocida".to_owned())),
    }
}

fn ensure_app_raster(app: &tauri::AppHandle, raw: &str) -> Result<PathBuf, NativeError> {
    let raster = PathBuf::from(raw)
        .canonicalize()
        .map_err(|error| NativeError::Io(error.to_string()))?;
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| NativeError::Io(error.to_string()))?
        .join("rasters")
        .canonicalize()
        .map_err(|error| NativeError::Io(error.to_string()))?;
    if !raster.starts_with(directory) || !raster.is_file() {
        return Err(NativeError::Io(
            "El MDT no pertenece al proyecto actual".to_owned(),
        ));
    }
    // `canonicalize` uses Windows' verbatim `\\?\` paths. Keep that form for the
    // containment check above, but pass a regular drive/UNC path to GDAL because
    // some GDAL utilities interpret the verbatim prefix as part of the filename.
    Ok(platform_external_path(&raster, cfg!(windows)))
}

fn metadata_number(metadata: &Value, key: &str, index: usize) -> Result<f64, NativeError> {
    metadata
        .get(key)
        .and_then(Value::as_array)
        .and_then(|values| values.get(index))
        .and_then(Value::as_f64)
        .ok_or_else(|| NativeError::Gdal(format!("El GeoTIFF no contiene {key}[{index}]")))
}

fn raster_epsg(path: &Path) -> Result<String, NativeError> {
    let executable = command_path("gdalsrsinfo")
        .ok_or_else(|| NativeError::Gdal("gdalsrsinfo no está instalado".to_owned()))?;
    let output = Command::new(executable)
        .args(["-o", "epsg"])
        .arg(path)
        .output()
        .map_err(|error| NativeError::Gdal(error.to_string()))?;
    if !output.status.success() {
        return Err(NativeError::Gdal(
            String::from_utf8_lossy(&output.stderr).trim().to_owned(),
        ));
    }
    let text = String::from_utf8_lossy(&output.stdout);
    text.lines()
        .find_map(|line| {
            line.trim()
                .strip_prefix("EPSG:")
                .map(|code| format!("EPSG:{}", code.trim()))
        })
        .ok_or_else(|| NativeError::Gdal("No se pudo identificar el CRS del MDT".to_owned()))
}

fn transform_points(
    points: &[[f64; 2]],
    source: &str,
    target: &str,
) -> Result<Vec<[f64; 2]>, NativeError> {
    if source == target {
        return Ok(points.to_vec());
    }
    let executable = command_path("gdaltransform")
        .ok_or_else(|| NativeError::Gdal("gdaltransform no está instalado".to_owned()))?;
    let mut child = Command::new(executable)
        .args(["-s_srs", source, "-t_srs", target])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| NativeError::Gdal(error.to_string()))?;
    let mut stdin = child.stdin.take().ok_or_else(|| {
        NativeError::Gdal("No se pudo iniciar la transformación de coordenadas".to_owned())
    })?;
    let input = points.to_vec();
    // gdaltransform can fill stdout while a large coordinate set is still being written.
    // Write on a separate thread so wait_with_output drains stdout concurrently.
    let writer = std::thread::spawn(move || -> std::io::Result<()> {
        for [x, y] in input {
            writeln!(stdin, "{x} {y}")?;
        }
        Ok(())
    });
    let output = child
        .wait_with_output()
        .map_err(|error| NativeError::Gdal(error.to_string()))?;
    writer
        .join()
        .map_err(|_| NativeError::Gdal("Falló el envío de coordenadas a PROJ".to_owned()))?
        .map_err(|error| NativeError::Gdal(error.to_string()))?;
    if !output.status.success() {
        return Err(NativeError::Gdal(
            String::from_utf8_lossy(&output.stderr).trim().to_owned(),
        ));
    }
    let transformed: Result<Vec<_>, _> = String::from_utf8_lossy(&output.stdout)
        .lines()
        .map(|line| {
            let mut values = line.split_whitespace();
            let x = values.next().ok_or(())?.parse::<f64>().map_err(|_| ())?;
            let y = values.next().ok_or(())?.parse::<f64>().map_err(|_| ())?;
            if x.is_finite() && y.is_finite() {
                Ok([x, y])
            } else {
                Err(())
            }
        })
        .collect();
    let transformed = transformed
        .map_err(|_| NativeError::Gdal("PROJ devolvió coordenadas no válidas".to_owned()))?;
    if transformed.len() != points.len() {
        return Err(NativeError::Gdal(
            "La transformación devolvió un número inesperado de puntos".to_owned(),
        ));
    }
    Ok(transformed)
}

fn nearest_valid_cell(
    elevations: &[f32],
    width: usize,
    height: usize,
    column: isize,
    row: isize,
    nodata: Option<f32>,
    blocked: &[bool],
) -> Option<usize> {
    let valid = |index: usize| {
        !blocked[index]
            && elevations[index].is_finite()
            && nodata.is_none_or(|value| (elevations[index] - value).abs() > 0.001)
    };
    for radius in 0..=30_isize {
        for dy in -radius..=radius {
            for dx in -radius..=radius {
                if radius > 0 && dx.abs() != radius && dy.abs() != radius {
                    continue;
                }
                let x = column + dx;
                let y = row + dy;
                if x >= 0 && y >= 0 && x < width as isize && y < height as isize {
                    let index = y as usize * width + x as usize;
                    if valid(index) {
                        return Some(index);
                    }
                }
            }
        }
    }
    None
}

fn raster_cell_for_point(
    point: [f64; 2],
    width: usize,
    height: usize,
    origin_x: f64,
    origin_y: f64,
    pixel_x: f64,
    pixel_y: f64,
) -> Option<(isize, isize)> {
    if width == 0
        || height == 0
        || !pixel_x.is_finite()
        || !pixel_y.is_finite()
        || pixel_x == 0.0
        || pixel_y == 0.0
    {
        return None;
    }
    let column = (point[0] - origin_x) / pixel_x;
    let row = (point[1] - origin_y) / pixel_y;
    // WCS recortes can end exactly on a pixel edge. Accept up to half a cell of
    // alignment/reprojection tolerance, but continue rejecting genuinely external points.
    if column < -0.5 || row < -0.5 || column > width as f64 + 0.5 || row > height as f64 + 0.5 {
        return None;
    }
    Some((
        (column.floor() as isize).clamp(0, width as isize - 1),
        (row.floor() as isize).clamp(0, height as isize - 1),
    ))
}

fn rasterize_barriers(
    barriers: &[BarrierRequest],
    width: usize,
    height: usize,
    origin_x: f64,
    origin_y: f64,
    pixel_x: f64,
    pixel_y: f64,
) -> (Vec<bool>, Vec<f64>) {
    let mut blocked = vec![false; width * height];
    let mut penalties = vec![1.0_f64; width * height];
    let to_pixel = |point: [f64; 2]| {
        (
            ((point[0] - origin_x) / pixel_x).floor() as isize,
            ((point[1] - origin_y) / pixel_y).floor() as isize,
        )
    };
    for barrier in barriers {
        for segment in barrier.coordinates.windows(2) {
            let (mut x0, mut y0) = to_pixel(segment[0]);
            let (mut x1, mut y1) = to_pixel(segment[1]);
            x0 = x0.clamp(0, width as isize - 1);
            x1 = x1.clamp(0, width as isize - 1);
            y0 = y0.clamp(0, height as isize - 1);
            y1 = y1.clamp(0, height as isize - 1);
            let dx = (x1 - x0).abs();
            let sx = if x0 < x1 { 1 } else { -1 };
            let dy = -(y1 - y0).abs();
            let sy = if y0 < y1 { 1 } else { -1 };
            let mut error = dx + dy;
            loop {
                for oy in -1..=1 {
                    for ox in -1..=1 {
                        let x = x0 + ox;
                        let y = y0 + oy;
                        if x >= 0 && y >= 0 && x < width as isize && y < height as isize {
                            let index = y as usize * width + x as usize;
                            if barrier.kind == "absolute" {
                                blocked[index] = true;
                            } else {
                                penalties[index] = penalties[index].max(barrier.value.max(1.0));
                            }
                        }
                    }
                }
                if x0 == x1 && y0 == y1 {
                    break;
                }
                let twice = 2 * error;
                if twice >= dy {
                    error += dy;
                    x0 += sx
                }
                if twice <= dx {
                    error += dx;
                    y0 += sy
                }
            }
        }
    }
    (blocked, penalties)
}

fn rasterize_facilitators(
    corridors: &[CorridorRequest],
    crossings: &[CrossingRequest],
    points: &[PointOfInterestRequest],
    blocked: &mut [bool],
    width: usize,
    height: usize,
    origin_x: f64,
    origin_y: f64,
    pixel_x: f64,
    pixel_y: f64,
) -> Vec<f64> {
    let mut discounts = vec![1.0_f64; width * height];
    let to_pixel = |p: [f64; 2]| {
        (
            ((p[0] - origin_x) / pixel_x).floor() as isize,
            ((p[1] - origin_y) / pixel_y).floor() as isize,
        )
    };
    let mut paint = |coordinates: &[[f64; 2]], radius: isize, multiplier: f64, reopen: bool| {
        for segment in coordinates.windows(2) {
            let (mut x0, mut y0) = to_pixel(segment[0]);
            let (x1, y1) = to_pixel(segment[1]);
            let dx = (x1 - x0).abs();
            let sx = if x0 < x1 { 1 } else { -1 };
            let dy = -(y1 - y0).abs();
            let sy = if y0 < y1 { 1 } else { -1 };
            let mut error = dx + dy;
            loop {
                for oy in -radius..=radius {
                    for ox in -radius..=radius {
                        let x = x0 + ox;
                        let y = y0 + oy;
                        if x >= 0 && y >= 0 && x < width as isize && y < height as isize {
                            let index = y as usize * width + x as usize;
                            discounts[index] = discounts[index].min(multiplier);
                            if reopen {
                                blocked[index] = false
                            }
                        }
                    }
                }
                if x0 == x1 && y0 == y1 {
                    break;
                }
                let twice = 2 * error;
                if twice >= dy {
                    error += dy;
                    x0 += sx
                }
                if twice <= dx {
                    error += dx;
                    y0 += sy
                }
            }
        }
    };
    for corridor in corridors {
        let radius = (corridor.width_m / (2.0 * pixel_x.abs().max(pixel_y.abs())))
            .ceil()
            .max(0.0) as isize;
        paint(
            &corridor.coordinates,
            radius,
            corridor.cost_multiplier,
            false,
        );
    }
    for crossing in crossings {
        paint(
            &crossing.coordinates,
            0,
            crossing.crossing_cost_multiplier,
            true,
        );
    }
    for point in points.iter().filter(|point| point.mode == "influence") {
        let (cx, cy) = to_pixel(point.coordinate);
        let rx = (point.influence_radius_m / pixel_x.abs()).ceil() as isize;
        let ry = (point.influence_radius_m / pixel_y.abs()).ceil() as isize;
        for y in (cy - ry)..=(cy + ry) {
            for x in (cx - rx)..=(cx + rx) {
                if x < 0 || y < 0 || x >= width as isize || y >= height as isize {
                    continue;
                }
                let distance =
                    ((x - cx) as f64 * pixel_x.abs()).hypot((y - cy) as f64 * pixel_y.abs());
                if distance <= point.influence_radius_m {
                    let multiplier =
                        1.0 - point.attraction * (1.0 - distance / point.influence_radius_m);
                    let index = y as usize * width + x as usize;
                    discounts[index] = discounts[index].min(multiplier);
                }
            }
        }
    }
    discounts
}

fn transition_cost(
    model: &str,
    horizontal: f64,
    rise: f64,
    terrain_multiplier: f64,
    critical_slope_percent: f64,
    ardigo_speed_ms: f64,
) -> Result<(f64, &'static str), NativeError> {
    // Tobler (1993): walking velocity in km/h; converted to m/s and seconds per edge.
    // Pandolf et al. (1977): metabolic power in watts; integrated over traversal seconds to joules.
    // Remaining formulae and units are audited in docs/model-audit.md.
    let surface = horizontal.hypot(rise);
    let slope = rise / horizontal.max(1e-9);
    let degrees = slope.abs().atan().to_degrees();
    let seconds = |speed_kmh: f64| surface / (speed_kmh / 3.6).max(1e-9);
    match model {
        "tobler" | "tobler-off" => {
            let base = if model == "tobler" { 6.0 } else { 3.6 };
            let speed_ms = base * (-3.5 * (slope + 0.05).abs()).exp() / 3.6;
            Ok((surface / speed_ms.max(1e-9) * terrain_multiplier, "s"))
        }
        "marquez-perez" => Ok((
            seconds(4.8 * (-5.3 * (slope * 0.7 + 0.03).abs()).exp()) * terrain_multiplier,
            "s",
        )),
        "kondo-seino" => {
            let decay = if slope >= -0.07 { -2.25 } else { -1.5 };
            Ok((
                seconds(5.1 * (decay * (slope + 0.07).abs()).exp()) * terrain_multiplier,
                "s",
            ))
        }
        "rees" => Ok((
            seconds((1.0 / (0.75 + 0.09 * slope.abs() + 14.6 * slope.abs().powi(2))) * 3.6)
                * terrain_multiplier,
            "s",
        )),
        "gkrs" => Ok((
            seconds(4.0 * (-0.008 * degrees.powi(2)).exp()) * terrain_multiplier,
            "s",
        )),
        "tripcevich" => Ok((
            seconds((4.028 * 46_f64.powi(2)) / ((degrees + 4.127).powi(2) + 46_f64.powi(2)))
                * terrain_multiplier,
            "s",
        )),
        "alberti" => Ok((
            seconds(6.0 * (-3.5 * (slope + 0.05).abs()).exp() * 0.25) * terrain_multiplier,
            "s",
        )),
        "pandolf" => {
            let watts =
                1.5 * 70.0 + 70.0 * (1.5 * 1.2_f64.powi(2) + 0.35 * 1.2 * slope.abs() * 100.0);
            Ok((watts * (surface / 1.2) * terrain_multiplier, "J"))
        }
        "pandolf-corrected" => {
            let g = slope.abs() * 100.0;
            let m = 1.5 * 70.0 + 70.0 * (1.5 * 1.2_f64.powi(2) + 0.35 * 1.2 * g);
            let cf = (g * 70.0 * 1.2 / 3.5) - (g + 6.0).powi(2) + (25.0 - 1.2_f64.powi(2));
            let watts = if slope >= 0.0 { m } else { (m - cf).max(1.0) };
            Ok((watts * surface / 1.2 * terrain_multiplier, "J"))
        }
        "minetti" => {
            let x = slope.abs();
            let rate = (280.5 * x.powi(5) - 58.7 * x.powi(4) - 76.8 * x.powi(3)
                + 51.9 * x.powi(2)
                + 19.6 * x
                + 2.5)
                * terrain_multiplier;
            Ok((rate.max(0.0) * surface, "J/kg"))
        }
        "herzog" => {
            let x = slope.abs();
            let rate =
                (1337.8 * x.powi(6) + 278.19 * x.powi(5) - 517.39 * x.powi(4) - 78.199 * x.powi(3)
                    + 93.419 * x.powi(2)
                    + 19.825 * x
                    + 1.64)
                    * terrain_multiplier;
            Ok((rate.max(0.0) * surface, "J/kg"))
        }
        "ardigo" => {
            let x = slope.abs();
            let v = ardigo_speed_ms.clamp(0.2, 15.0);
            let rate = (1.866 * (4.911 * x).exp() * v * v - 3.773 * (3.416 * x).exp() * v
                + 45.71 * x * x
                + 18.9 * x
                + 4.456)
                * terrain_multiplier;
            Ok((rate.max(0.0) * surface, "J/kg"))
        }
        "wheeled" => Ok((
            surface
                * (1.0 + (slope.abs() * 100.0 / critical_slope_percent.max(0.1)).powi(2))
                * terrain_multiplier,
            "coste relativo",
        )),
        "eastman" => Ok((
            surface * (0.031 * degrees.powi(2) - 0.025 * degrees + 1.0) * terrain_multiplier,
            "coste relativo",
        )),
        _ => Err(NativeError::Gdal(
            "Modelo de coste no reconocido".to_owned(),
        )),
    }
}

#[tauri::command]
fn calculate_raster_route(
    app: tauri::AppHandle,
    cache: State<'_, SurfaceCache>,
    request: RouteRequest,
) -> Result<NativeRouteResult, NativeError> {
    let raster = ensure_app_raster(&app, &request.raster_path)?;
    calculate_route_from_path(raster, request, &cache)
}

fn lcp_distances(
    surface: &PreparedSurface,
    start: usize,
    request: &RouteRequest,
    reverse: bool,
) -> Result<(Vec<f64>, String), NativeError> {
    let directions: &[(isize, isize)] = match request.connectivity {
        4 => &[(0, -1), (-1, 0), (1, 0), (0, 1)],
        8 => &[
            (-1, -1),
            (0, -1),
            (1, -1),
            (-1, 0),
            (1, 0),
            (-1, 1),
            (0, 1),
            (1, 1),
        ],
        16 => &[
            (-1, -1),
            (0, -1),
            (1, -1),
            (-1, 0),
            (1, 0),
            (-1, 1),
            (0, 1),
            (1, 1),
            (-2, -1),
            (-1, -2),
            (1, -2),
            (2, -1),
            (-2, 1),
            (-1, 2),
            (1, 2),
            (2, 1),
        ],
        _ => {
            return Err(NativeError::Gdal(
                "La conectividad debe ser 4, 8 o 16".to_owned(),
            ))
        }
    };
    let cells = surface.width * surface.height;
    let mut distance = vec![f64::INFINITY; cells];
    let mut queue = BinaryHeap::new();
    let mut unit = "s";
    distance[start] = 0.0;
    queue.push(QueueState {
        cost: 0.0,
        position: start,
    });
    while let Some(QueueState { cost, position }) = queue.pop() {
        if cost > distance[position] {
            continue;
        }
        let x = (position % surface.width) as isize;
        let y = (position / surface.width) as isize;
        for &(dx, dy) in directions {
            let nx = x + dx;
            let ny = y + dy;
            if nx < 0 || ny < 0 || nx >= surface.width as isize || ny >= surface.height as isize {
                continue;
            }
            let next = ny as usize * surface.width + nx as usize;
            if surface.blocked[next] {
                continue;
            }
            if dx != 0 && dy != 0 {
                let horizontal = y as usize * surface.width + nx as usize;
                let vertical = ny as usize * surface.width + x as usize;
                if surface.blocked[horizontal] || surface.blocked[vertical] {
                    continue;
                }
            }
            let next_elevation = surface.elevations[next];
            if !next_elevation.is_finite()
                || surface
                    .nodata
                    .is_some_and(|value| (next_elevation - value).abs() <= 0.001)
            {
                continue;
            }
            let horizontal =
                (surface.pixel_x.abs() * dx as f64).hypot(surface.pixel_y.abs() * dy as f64);
            let rise = if reverse {
                (surface.elevations[position] - next_elevation) as f64
            } else {
                (next_elevation - surface.elevations[position]) as f64
            };
            let (edge, edge_unit) = transition_cost(
                &request.model,
                horizontal,
                rise,
                surface.penalties[position].max(surface.penalties[next]),
                request.critical_slope_percent,
                request.ardigo_speed_ms,
            )?;
            unit = edge_unit;
            let candidate = cost + edge * surface.discounts[position].min(surface.discounts[next]);
            if candidate < distance[next] {
                distance[next] = candidate;
                queue.push(QueueState {
                    cost: candidate,
                    position: next,
                })
            }
        }
    }
    Ok((distance, unit.to_owned()))
}

fn calculate_lcp_corridor_from_path(
    raster: PathBuf,
    request: LcpCorridorRequest,
    cache: &SurfaceCache,
) -> Result<LcpCorridorResult, NativeError> {
    if !request.threshold_percent.is_finite()
        || request.threshold_percent < 0.0
        || request.threshold_percent > 500.0
    {
        return Err(NativeError::Gdal(
            "El umbral del pasillo LCP debe estar entre 0 y 500 %".to_owned(),
        ));
    }
    let (surface, reused) = prepared_surface(&raster, &request.route, cache)?;
    let projected = transform_points(
        &[request.route.start, request.route.end],
        "EPSG:4326",
        &surface.raster_crs,
    )?;
    let mut endpoints = Vec::new();
    for (index, point) in projected.into_iter().enumerate() {
        let (column, row) = raster_cell_for_point(
            point,
            surface.width,
            surface.height,
            surface.origin_x,
            surface.origin_y,
            surface.pixel_x,
            surface.pixel_y,
        )
        .ok_or_else(|| {
            NativeError::Gdal(
                "Los puntos de inicio y final deben estar dentro del modelo descargado".to_owned(),
            )
        })?;
        endpoints.push(
            nearest_valid_cell(
                &surface.elevations,
                surface.width,
                surface.height,
                column,
                row,
                surface.nodata,
                &surface.blocked,
            )
            .ok_or_else(|| {
                NativeError::Gdal(format!(
                    "No hay elevaciones válidas cerca del punto {}",
                    if index == 0 { "inicial" } else { "final" }
                ))
            })?,
        );
    }
    let (forward, unit) = lcp_distances(&surface, endpoints[0], &request.route, false)?;
    let optimal = forward[endpoints[1]];
    if !optimal.is_finite() {
        return Err(NativeError::Gdal(
            "No existe una ruta transitable entre los puntos con el modelo seleccionado".to_owned(),
        ));
    }
    let (backward, _) = lcp_distances(&surface, endpoints[1], &request.route, true)?;
    let limit = optimal * (1.0 + request.threshold_percent / 100.0);
    let sample_step = surface.width.max(surface.height).div_ceil(500).max(1);
    let surface_width = surface.width.div_ceil(sample_step);
    let surface_height = surface.height.div_ceil(sample_step);
    let corridor_cells = forward
        .iter()
        .zip(&backward)
        .filter(|(from_start, to_end)| {
            let combined = **from_start + **to_end;
            combined.is_finite() && combined <= limit
        })
        .count();
    let mut values = Vec::with_capacity(surface_width * surface_height);
    for y in (0..surface.height).step_by(sample_step) {
        for x in (0..surface.width).step_by(sample_step) {
            let index = y * surface.width + x;
            let combined = forward[index] + backward[index];
            let inside = combined.is_finite() && combined <= limit;
            values.push(if inside {
                ((combined - optimal) / optimal.max(1e-12)) as f32
            } else {
                -1.0
            });
        }
    }
    Ok(LcpCorridorResult {
        model: request.route.model,
        unit,
        optimal_cost: optimal,
        threshold_percent: request.threshold_percent,
        corridor_cells,
        surface_width,
        surface_height,
        surface_values: values,
        surface_reused: reused,
        source: format!(
            "GeoTIFF real · pasillo LCP direccional {}",
            surface.raster_crs
        ),
    })
}

#[tauri::command]
fn calculate_raster_lcp_corridor(
    app: tauri::AppHandle,
    cache: State<'_, SurfaceCache>,
    request: LcpCorridorRequest,
) -> Result<LcpCorridorResult, NativeError> {
    let raster = ensure_app_raster(&app, &request.route.raster_path)?;
    calculate_lcp_corridor_from_path(raster, request, &cache)
}

#[tauri::command]
async fn calculate_raster_isochrones(
    app: tauri::AppHandle,
    cache: State<'_, SurfaceCache>,
    state: State<'_, IsochroneState>,
    request: IsochroneRequest,
) -> Result<IsochroneResult, NativeError> {
    let raster = ensure_app_raster(&app, &request.raster_path)?;
    state.0.store(false, Ordering::Relaxed);
    let cache = cache.inner().clone();
    let cancelled = Arc::clone(&state.0);
    tauri::async_runtime::spawn_blocking(move || {
        calculate_isochrones_from_path(raster, request, &cache, Some((&app, &cancelled)))
    })
    .await
    .map_err(|error| {
        NativeError::Gdal(format!(
            "La tarea de isócronas terminó inesperadamente: {error}"
        ))
    })?
}

#[tauri::command]
fn cancel_raster_isochrones(state: State<'_, IsochroneState>) {
    state.0.store(true, Ordering::Relaxed);
}

#[tauri::command]
fn sample_raster_elevation(
    app: tauri::AppHandle,
    raster_path: String,
    x_ratio: f64,
    y_ratio: f64,
) -> Result<RasterSample, NativeError> {
    if !x_ratio.is_finite()
        || !y_ratio.is_finite()
        || !(0.0..=1.0).contains(&x_ratio)
        || !(0.0..=1.0).contains(&y_ratio)
    {
        return Err(NativeError::Gdal(
            "La posición consultada no está dentro del MDT".to_owned(),
        ));
    }
    let raster = ensure_app_raster(&app, &raster_path)?;
    let metadata = gdal_json_basic(&raster)?;
    let width = metadata_number(&metadata, "size", 0)? as usize;
    let height = metadata_number(&metadata, "size", 1)? as usize;
    let column = ((x_ratio * width as f64).floor() as usize).min(width.saturating_sub(1));
    let row = ((y_ratio * height as f64).floor() as usize).min(height.saturating_sub(1));
    let origin_x = metadata_number(&metadata, "geoTransform", 0)?;
    let pixel_x = metadata_number(&metadata, "geoTransform", 1)?;
    let origin_y = metadata_number(&metadata, "geoTransform", 3)?;
    let pixel_y = metadata_number(&metadata, "geoTransform", 5)?;
    let raster_crs = raster_epsg(&raster)?;
    let centre = [
        origin_x + (column as f64 + 0.5) * pixel_x,
        origin_y + (row as f64 + 0.5) * pixel_y,
    ];
    let lon_lat = transform_points(&[centre], &raster_crs, "EPSG:4326")?[0];
    let executable = command_path("gdallocationinfo")
        .ok_or_else(|| NativeError::Gdal("gdallocationinfo no está instalado".to_owned()))?;
    let output = Command::new(executable)
        .arg("-valonly")
        .arg(&raster)
        .args([column.to_string(), row.to_string()])
        .output()
        .map_err(|error| NativeError::Gdal(error.to_string()))?;
    if !output.status.success() {
        return Err(NativeError::Gdal(
            String::from_utf8_lossy(&output.stderr).trim().to_owned(),
        ));
    }
    let elevation_m = String::from_utf8_lossy(&output.stdout)
        .trim()
        .lines()
        .next()
        .and_then(|value| value.parse::<f64>().ok())
        .filter(|value| value.is_finite() && *value > -9_000.0);
    Ok(RasterSample {
        lon: lon_lat[0],
        lat: lon_lat[1],
        elevation_m,
    })
}

#[tauri::command]
fn sample_raster_elevation_at(
    app: tauri::AppHandle,
    raster_path: String,
    lon: f64,
    lat: f64,
) -> Result<RasterSample, NativeError> {
    if !lon.is_finite()
        || !lat.is_finite()
        || !(-180.0..=180.0).contains(&lon)
        || !(-90.0..=90.0).contains(&lat)
    {
        return Err(NativeError::Gdal(
            "Las coordenadas geográficas del punto no son válidas".to_owned(),
        ));
    }
    let raster = ensure_app_raster(&app, &raster_path)?;
    let executable = command_path("gdallocationinfo")
        .ok_or_else(|| NativeError::Gdal("gdallocationinfo no está instalado".to_owned()))?;
    let output = Command::new(executable)
        .args(["-valonly", "-wgs84"])
        .arg(&raster)
        .args([lon.to_string(), lat.to_string()])
        .output()
        .map_err(|error| NativeError::Gdal(error.to_string()))?;
    if !output.status.success() {
        return Err(NativeError::Gdal(
            String::from_utf8_lossy(&output.stderr).trim().to_owned(),
        ));
    }
    let elevation_m = String::from_utf8_lossy(&output.stdout)
        .trim()
        .lines()
        .next()
        .and_then(|value| value.parse::<f64>().ok())
        .filter(|value| value.is_finite() && *value > -9_000.0);
    Ok(RasterSample {
        lon,
        lat,
        elevation_m,
    })
}

#[tauri::command]
fn generate_terrain_mesh(
    app: tauri::AppHandle,
    raster_path: String,
    max_size: Option<usize>,
) -> Result<TerrainMesh, NativeError> {
    let raster = ensure_app_raster(&app, &raster_path)?;
    let metadata = gdal_json_basic(&raster)?;
    let source_width = metadata_number(&metadata, "size", 0)? as usize;
    let source_height = metadata_number(&metadata, "size", 1)? as usize;
    let limit = max_size.unwrap_or(450).clamp(100, 700);
    let scale = (limit as f64 / source_width.max(source_height) as f64).min(1.0);
    let width = ((source_width as f64 * scale).round() as usize).max(2);
    let height = ((source_height as f64 * scale).round() as usize).max(2);
    let origin_x = metadata_number(&metadata, "geoTransform", 0)?;
    let pixel_x = metadata_number(&metadata, "geoTransform", 1)?;
    let origin_y = metadata_number(&metadata, "geoTransform", 3)?;
    let pixel_y = metadata_number(&metadata, "geoTransform", 5)?;
    let width_m = pixel_x.abs() * source_width as f64;
    let height_m = pixel_y.abs() * source_height as f64;
    let raster_crs = raster_epsg(&raster)?;
    let corners = transform_points(
        &[
            [origin_x, origin_y + pixel_y * source_height as f64],
            [origin_x + pixel_x * source_width as f64, origin_y],
        ],
        &raster_crs,
        "EPSG:4326",
    )?;
    let identifier = uuid::Uuid::new_v4();
    let binary = raster.with_extension(format!("mesh-{identifier}.bin"));
    let header = binary.with_extension("hdr");
    let executable = command_path("gdal_translate")
        .ok_or_else(|| NativeError::Gdal("gdal_translate no está instalado".to_owned()))?;
    let output = Command::new(executable)
        .args([
            "-of", "ENVI", "-ot", "Float32", "-r", "bilinear", "-outsize",
        ])
        .args([width.to_string(), height.to_string()])
        .arg(&raster)
        .arg(&binary)
        .output()
        .map_err(|error| NativeError::Gdal(error.to_string()))?;
    if !output.status.success() {
        return Err(NativeError::Gdal(
            String::from_utf8_lossy(&output.stderr).trim().to_owned(),
        ));
    }
    let bytes = std::fs::read(&binary).map_err(|error| NativeError::Io(error.to_string()))?;
    let _ = std::fs::remove_file(&binary);
    let _ = std::fs::remove_file(&header);
    let _ = std::fs::remove_file(auxiliary_metadata_path(&binary));
    if bytes.len() != width * height * 4 {
        return Err(NativeError::Gdal(
            "La malla 3D tiene un tamaño inesperado".to_owned(),
        ));
    }
    let mut elevations: Vec<f32> = bytes
        .chunks_exact(4)
        .map(|chunk| f32::from_le_bytes(chunk.try_into().expect("cuatro bytes")))
        .collect();
    let valid: Vec<f32> = elevations
        .iter()
        .copied()
        .filter(|value| value.is_finite() && *value > -9_000.0)
        .collect();
    let min_elevation_m = valid.iter().copied().reduce(f32::min).ok_or_else(|| {
        NativeError::Gdal("El MDT no contiene elevaciones válidas para la vista 3D".to_owned())
    })?;
    let max_elevation_m = valid
        .iter()
        .copied()
        .reduce(f32::max)
        .unwrap_or(min_elevation_m);
    for value in &mut elevations {
        if !value.is_finite() || *value <= -9_000.0 {
            *value = min_elevation_m;
        }
    }
    Ok(TerrainMesh {
        width,
        height,
        width_m,
        height_m,
        min_elevation_m,
        max_elevation_m,
        elevations,
        wgs84_extent: [corners[0][0], corners[0][1], corners[1][0], corners[1][1]],
    })
}

fn surface_cache_key(raster: &Path, request: &RouteRequest) -> Result<String, NativeError> {
    let metadata = std::fs::metadata(raster).map_err(|error| NativeError::Io(error.to_string()))?;
    let modified = metadata
        .modified()
        .ok()
        .and_then(|value| value.duration_since(UNIX_EPOCH).ok())
        .map(|value| value.as_nanos())
        .unwrap_or_default();
    let barriers = serde_json::to_string(&(
        &request.barriers,
        &request.corridors,
        &request.crossings,
        &request.points_of_interest,
    ))
    .map_err(|error| NativeError::Gdal(error.to_string()))?;
    Ok(format!(
        "{}|{}|{}|{}",
        raster.display(),
        metadata.len(),
        modified,
        barriers
    ))
}

fn build_prepared_surface(
    raster: &Path,
    request: &RouteRequest,
) -> Result<PreparedSurface, NativeError> {
    let metadata = gdal_json(&raster)?;
    if request.barriers.iter().any(|barrier| {
        !matches!(barrier.kind.as_str(), "absolute" | "penalty")
            || !barrier.value.is_finite()
            || barrier.value < 1.0
            || barrier.value > 1_000.0
            || barrier.coordinates.len() < 2
    }) {
        return Err(NativeError::Gdal(
            "Hay una barrera con tipo, valor o geometría no válidos".to_owned(),
        ));
    }
    if request.corridors.iter().any(|item| {
        item.coordinates.len() < 2
            || !item.width_m.is_finite()
            || item.width_m <= 0.0
            || !item.cost_multiplier.is_finite()
            || item.cost_multiplier <= 0.0
            || item.cost_multiplier > 1.0
    }) {
        return Err(NativeError::Gdal(
            "Hay un corredor con anchura, multiplicador o geometría no válidos".to_owned(),
        ));
    }
    if request.crossings.iter().any(|item| {
        item.coordinates.len() < 2
            || !item.crossing_cost_multiplier.is_finite()
            || item.crossing_cost_multiplier <= 0.0
    }) {
        return Err(NativeError::Gdal(
            "Hay un paso habilitado con coste o geometría no válidos".to_owned(),
        ));
    }
    if request.points_of_interest.iter().any(|item| {
        !matches!(item.mode.as_str(), "influence" | "waypoint")
            || !item.influence_radius_m.is_finite()
            || item.influence_radius_m <= 0.0
            || !item.attraction.is_finite()
            || item.attraction < 0.0
            || item.attraction >= 1.0
    }) {
        return Err(NativeError::Gdal(
            "Hay un punto de interés con modalidad, radio o atracción no válidos".to_owned(),
        ));
    }
    let raster_crs = raster_epsg(&raster)?;
    if raster_crs == "EPSG:4326" {
        return Err(NativeError::Gdal("Este MDT antiguo está en coordenadas geográficas. Descárguelo de nuevo para reproyectarlo automáticamente y calcular en metros".to_owned()));
    }
    let projected_barriers: Result<Vec<_>, _> = request
        .barriers
        .iter()
        .map(|barrier| {
            Ok(BarrierRequest {
                coordinates: transform_points(&barrier.coordinates, "EPSG:4326", &raster_crs)?,
                kind: barrier.kind.clone(),
                value: barrier.value,
            })
        })
        .collect();
    let projected_barriers = projected_barriers?;
    let projected_corridors: Result<Vec<_>, _> = request
        .corridors
        .iter()
        .map(|item| {
            Ok(CorridorRequest {
                coordinates: transform_points(&item.coordinates, "EPSG:4326", &raster_crs)?,
                width_m: item.width_m,
                cost_multiplier: item.cost_multiplier,
            })
        })
        .collect();
    let projected_crossings: Result<Vec<_>, _> = request
        .crossings
        .iter()
        .map(|item| {
            Ok(CrossingRequest {
                coordinates: transform_points(&item.coordinates, "EPSG:4326", &raster_crs)?,
                crossing_cost_multiplier: item.crossing_cost_multiplier,
            })
        })
        .collect();
    let projected_points: Result<Vec<_>, _> = request
        .points_of_interest
        .iter()
        .map(|item| {
            Ok(PointOfInterestRequest {
                coordinate: transform_points(&[item.coordinate], "EPSG:4326", &raster_crs)?[0],
                influence_radius_m: item.influence_radius_m,
                attraction: item.attraction,
                mode: item.mode.clone(),
            })
        })
        .collect();
    let width = metadata_number(&metadata, "size", 0)? as usize;
    let height = metadata_number(&metadata, "size", 1)? as usize;
    let cells = width
        .checked_mul(height)
        .ok_or_else(|| NativeError::Gdal("Dimensiones de MDT no válidas".to_owned()))?;
    let configured_limit = request.max_cells.clamp(100_000, MAX_ROUTE_CELLS);
    if cells > configured_limit {
        return Err(NativeError::Gdal(format!(
            "El MDT contiene {cells} celdas; el límite de procesado configurado es {configured_limit}. Reduzca el área, utilice MDT25/MDT200 o cambie las Opciones de procesado."
        )));
    }
    let origin_x = metadata_number(&metadata, "geoTransform", 0)?;
    let pixel_x = metadata_number(&metadata, "geoTransform", 1)?;
    let origin_y = metadata_number(&metadata, "geoTransform", 3)?;
    let pixel_y = metadata_number(&metadata, "geoTransform", 5)?;
    if pixel_x == 0.0 || pixel_y == 0.0 {
        return Err(NativeError::Gdal(
            "La georreferenciación del MDT no es válida".to_owned(),
        ));
    }
    let nodata = metadata
        .get("bands")
        .and_then(Value::as_array)
        .and_then(|bands| bands.first())
        .and_then(|band| band.get("noDataValue"))
        .and_then(Value::as_f64)
        .map(|value| value as f32);
    let identifier = uuid::Uuid::new_v4();
    let binary = raster.with_extension(format!("route-{identifier}.bin"));
    let header = binary.with_extension("hdr");
    let executable = command_path("gdal_translate")
        .ok_or_else(|| NativeError::Gdal("gdal_translate no está instalado".to_owned()))?;
    let output = Command::new(executable)
        .args(["-of", "ENVI", "-ot", "Float32"])
        .arg(&raster)
        .arg(&binary)
        .output()
        .map_err(|error| NativeError::Gdal(error.to_string()))?;
    if !output.status.success() {
        return Err(NativeError::Gdal(
            String::from_utf8_lossy(&output.stderr).trim().to_owned(),
        ));
    }
    let bytes = std::fs::read(&binary).map_err(|error| NativeError::Io(error.to_string()))?;
    let _ = std::fs::remove_file(&binary);
    let _ = std::fs::remove_file(&header);
    let _ = std::fs::remove_file(auxiliary_metadata_path(&binary));
    if bytes.len() != cells * 4 {
        return Err(NativeError::Gdal(
            "GDAL produjo una matriz de elevaciones con tamaño inesperado".to_owned(),
        ));
    }
    let elevations: Vec<f32> = bytes
        .chunks_exact(4)
        .map(|chunk| f32::from_le_bytes(chunk.try_into().expect("cuatro bytes")))
        .collect();
    let (mut blocked, penalties) = rasterize_barriers(
        &projected_barriers,
        width,
        height,
        origin_x,
        origin_y,
        pixel_x,
        pixel_y,
    );
    let discounts = rasterize_facilitators(
        &projected_corridors?,
        &projected_crossings?,
        &projected_points?,
        &mut blocked,
        width,
        height,
        origin_x,
        origin_y,
        pixel_x,
        pixel_y,
    );
    Ok(PreparedSurface {
        raster_crs,
        width,
        height,
        origin_x,
        origin_y,
        pixel_x,
        pixel_y,
        nodata,
        elevations,
        blocked,
        penalties,
        discounts,
    })
}

fn prepared_surface(
    raster: &Path,
    request: &RouteRequest,
    cache: &SurfaceCache,
) -> Result<(Arc<PreparedSurface>, bool), NativeError> {
    let key = surface_cache_key(raster, request)?;
    if let Some(surface) = cache
        .0
        .lock()
        .map_err(|_| NativeError::Gdal("La caché de superficies está bloqueada".to_owned()))?
        .as_ref()
        .filter(|cached| cached.key == key)
        .map(|cached| Arc::clone(&cached.surface))
    {
        return Ok((surface, true));
    }
    let surface = Arc::new(build_prepared_surface(raster, request)?);
    let mut guard = cache
        .0
        .lock()
        .map_err(|_| NativeError::Gdal("La caché de superficies está bloqueada".to_owned()))?;
    *guard = Some(CachedSurface {
        key,
        surface: Arc::clone(&surface),
    });
    Ok((surface, false))
}

fn calculate_route_from_path(
    raster: PathBuf,
    request: RouteRequest,
    cache: &SurfaceCache,
) -> Result<NativeRouteResult, NativeError> {
    let (surface, reused) = prepared_surface(&raster, &request, cache)?;
    let raster_crs = &surface.raster_crs;
    let width = surface.width;
    let height = surface.height;
    let origin_x = surface.origin_x;
    let origin_y = surface.origin_y;
    let pixel_x = surface.pixel_x;
    let pixel_y = surface.pixel_y;
    let nodata = surface.nodata;
    let elevations = &surface.elevations;
    let blocked = &surface.blocked;
    let penalties = &surface.penalties;
    let discounts = &surface.discounts;
    let cells = width * height;
    let configured_limit = request.max_cells.clamp(100_000, MAX_ROUTE_CELLS);
    if cells > configured_limit {
        return Err(NativeError::Gdal(format!("El MDT contiene {cells} celdas; el límite de procesado configurado es {configured_limit}. Reduzca el área, utilice MDT25/MDT200 o cambie las Opciones de procesado.")));
    }
    let endpoints = transform_points(&[request.start, request.end], "EPSG:4326", raster_crs)?;
    let projected_start = endpoints[0];
    let projected_end = endpoints[1];
    let (start_x, start_y) = raster_cell_for_point(
        projected_start,
        width,
        height,
        origin_x,
        origin_y,
        pixel_x,
        pixel_y,
    )
    .ok_or_else(|| {
        NativeError::Gdal(
            "Los puntos de inicio y final deben estar dentro del modelo descargado".to_owned(),
        )
    })?;
    let (end_x, end_y) = raster_cell_for_point(
        projected_end,
        width,
        height,
        origin_x,
        origin_y,
        pixel_x,
        pixel_y,
    )
    .ok_or_else(|| {
        NativeError::Gdal(
            "Los puntos de inicio y final deben estar dentro del modelo descargado".to_owned(),
        )
    })?;
    let start = nearest_valid_cell(
        &elevations,
        width,
        height,
        start_x,
        start_y,
        nodata,
        &blocked,
    )
    .ok_or_else(|| {
        NativeError::Gdal("No hay elevaciones válidas cerca del punto inicial".to_owned())
    })?;
    let end = nearest_valid_cell(&elevations, width, height, end_x, end_y, nodata, &blocked)
        .ok_or_else(|| {
            NativeError::Gdal("No hay elevaciones válidas cerca del punto final".to_owned())
        })?;
    let step_x_m = pixel_x.abs();
    let step_y_m = pixel_y.abs();
    let mut distance = vec![f64::INFINITY; cells];
    let mut previous = vec![usize::MAX; cells];
    let mut queue = BinaryHeap::new();
    distance[start] = 0.0;
    queue.push(QueueState {
        cost: 0.0,
        position: start,
    });
    let directions: &[(isize, isize)] = match request.connectivity {
        4 => &[(0, -1), (-1, 0), (1, 0), (0, 1)],
        8 => &[
            (-1_isize, -1_isize),
            (0, -1),
            (1, -1),
            (-1, 0),
            (1, 0),
            (-1, 1),
            (0, 1),
            (1, 1),
        ],
        16 => &[
            (-1, -1),
            (0, -1),
            (1, -1),
            (-1, 0),
            (1, 0),
            (-1, 1),
            (0, 1),
            (1, 1),
            (-2, -1),
            (-1, -2),
            (1, -2),
            (2, -1),
            (-2, 1),
            (-1, 2),
            (1, 2),
            (2, 1),
        ],
        _ => {
            return Err(NativeError::Gdal(
                "La conectividad debe ser 4, 8 o 16".to_owned(),
            ))
        }
    };
    let mut unit = "s";
    while let Some(QueueState { cost, position }) = queue.pop() {
        if position == end {
            break;
        }
        if cost > distance[position] {
            continue;
        }
        let x = (position % width) as isize;
        let y = (position / width) as isize;
        for &(dx, dy) in directions {
            let nx = x + dx;
            let ny = y + dy;
            if nx < 0 || ny < 0 || nx >= width as isize || ny >= height as isize {
                continue;
            }
            let next = ny as usize * width + nx as usize;
            if blocked[next] {
                continue;
            }
            if dx != 0 && dy != 0 {
                let horizontal_neighbor = y as usize * width + nx as usize;
                let vertical_neighbor = ny as usize * width + x as usize;
                if blocked[horizontal_neighbor] || blocked[vertical_neighbor] {
                    continue;
                }
            }
            let elevation = elevations[next];
            if !elevation.is_finite()
                || nodata.is_some_and(|value| (elevation - value).abs() <= 0.001)
            {
                continue;
            }
            let horizontal = (step_x_m * dx as f64).hypot(step_y_m * dy as f64);
            let (edge_cost, edge_unit) = transition_cost(
                &request.model,
                horizontal,
                (elevation - elevations[position]) as f64,
                penalties[position].max(penalties[next]),
                request.critical_slope_percent,
                request.ardigo_speed_ms,
            )?;
            unit = edge_unit;
            let candidate = cost + edge_cost * discounts[position].min(discounts[next]);
            if candidate < distance[next] {
                distance[next] = candidate;
                previous[next] = position;
                queue.push(QueueState {
                    cost: candidate,
                    position: next,
                });
            }
        }
    }
    if !distance[end].is_finite() {
        return Err(NativeError::Gdal(
            "No existe una ruta transitable entre los puntos con el modelo seleccionado".to_owned(),
        ));
    }
    let mut path = Vec::new();
    let mut cursor = end;
    loop {
        path.push(cursor);
        if cursor == start {
            break;
        }
        cursor = previous[cursor];
        if cursor == usize::MAX {
            return Err(NativeError::Gdal(
                "No se pudo reconstruir la ruta".to_owned(),
            ));
        }
    }
    path.reverse();
    let mut distance_m = 0.0;
    let mut ascent_m = 0.0;
    let mut descent_m = 0.0;
    for pair in path.windows(2) {
        let a = pair[0];
        let b = pair[1];
        let dx = (b % width) as f64 - (a % width) as f64;
        let dy = (b / width) as f64 - (a / width) as f64;
        distance_m += (step_x_m * dx).hypot(step_y_m * dy);
        let rise = (elevations[b] - elevations[a]) as f64;
        if rise > 0.0 {
            ascent_m += rise;
        } else {
            descent_m -= rise;
        }
    }
    let stride = (path.len() / 5000).max(1);
    let mut sampled_path: Vec<usize> = path.iter().step_by(stride).copied().collect();
    if sampled_path.last() != Some(&end) {
        sampled_path.push(end);
    }
    let projected_coordinates: Vec<[f64; 2]> = sampled_path
        .iter()
        .map(|index| {
            let column = index % width;
            let row = index / width;
            [
                origin_x + (column as f64 + 0.5) * pixel_x,
                origin_y + (row as f64 + 0.5) * pixel_y,
            ]
        })
        .collect();
    let coordinates = transform_points(&projected_coordinates, &raster_crs, "EPSG:4326")?;
    let elevations_m = sampled_path
        .iter()
        .map(|index| elevations[*index] as f64)
        .collect();
    let mut slopes_percent = vec![0.0];
    for pair in sampled_path.windows(2) {
        let a = pair[0];
        let b = pair[1];
        let dx = (b % width) as f64 - (a % width) as f64;
        let dy = (b / width) as f64 - (a / width) as f64;
        let horizontal = (step_x_m * dx).hypot(step_y_m * dy).max(1e-9);
        slopes_percent.push((elevations[b] - elevations[a]) as f64 / horizontal * 100.0);
    }
    Ok(NativeRouteResult {
        model: request.model,
        direction: "inicio→final".to_owned(),
        path: Vec::new(),
        coordinates,
        elevations_m,
        slopes_percent,
        cost: distance[end],
        unit: unit.to_owned(),
        distance_m,
        ascent_m,
        descent_m,
        source: format!(
            "GeoTIFF real · cálculo métrico {raster_crs} · superficie {}",
            if reused { "reutilizada" } else { "preparada" }
        ),
        surface_reused: reused,
    })
}

fn report_isochrone_progress(
    context: Option<(&tauri::AppHandle, &AtomicBool)>,
    phase: &str,
    percent: f64,
    processed_cells: usize,
    total_cells: usize,
) -> Result<(), NativeError> {
    if let Some((app, cancelled)) = context {
        if cancelled.load(Ordering::Relaxed) {
            return Err(NativeError::Gdal(
                "Cálculo de isócronas cancelado".to_owned(),
            ));
        }
        let _ = app.emit(
            "isochrone-progress",
            IsochroneProgress {
                phase: phase.to_owned(),
                percent: percent.clamp(0.0, 100.0),
                processed_cells,
                total_cells,
            },
        );
    }
    Ok(())
}

fn calculate_isochrones_from_path(
    raster: PathBuf,
    request: IsochroneRequest,
    cache: &SurfaceCache,
    progress: Option<(&tauri::AppHandle, &AtomicBool)>,
) -> Result<IsochroneResult, NativeError> {
    if request.origins.is_empty() || request.origins.len() > 50 {
        return Err(NativeError::Gdal(
            "Seleccione entre uno y cincuenta orígenes para las isócronas".to_owned(),
        ));
    }
    if !request.interval.is_finite() || request.interval <= 0.0 {
        return Err(NativeError::Gdal(
            "El intervalo de las isócronas debe ser mayor que cero".to_owned(),
        ));
    }
    report_isochrone_progress(progress, "Preparando superficie", 2.0, 0, 0)?;
    let route_request = RouteRequest {
        raster_path: request.raster_path.clone(),
        start: request.origins[0],
        end: request.origins[0],
        model: request.model.clone(),
        barriers: request.barriers.clone(),
        corridors: request.corridors.clone(),
        crossings: request.crossings.clone(),
        points_of_interest: request.points_of_interest.clone(),
        connectivity: request.connectivity,
        critical_slope_percent: request.critical_slope_percent,
        ardigo_speed_ms: request.ardigo_speed_ms,
        max_cells: request.max_cells,
    };
    let (surface, reused) = prepared_surface(&raster, &route_request, cache)?;
    let cells = surface.width * surface.height;
    report_isochrone_progress(progress, "Superficie preparada", 8.0, 0, cells)?;
    let configured_limit = request.max_cells.clamp(100_000, MAX_ROUTE_CELLS);
    if cells > configured_limit {
        return Err(NativeError::Gdal(format!(
            "El MDT contiene {cells} celdas; el límite de procesado configurado es {configured_limit}."
        )));
    }
    let projected = transform_points(&request.origins, "EPSG:4326", &surface.raster_crs)?;
    let mut starts = Vec::with_capacity(projected.len());
    for point in projected {
        let (column, row) = raster_cell_for_point(
            point,
            surface.width,
            surface.height,
            surface.origin_x,
            surface.origin_y,
            surface.pixel_x,
            surface.pixel_y,
        )
        .ok_or_else(|| {
            NativeError::Gdal(
                "Todos los orígenes deben estar dentro del modelo descargado".to_owned(),
            )
        })?;
        let start = nearest_valid_cell(
            &surface.elevations,
            surface.width,
            surface.height,
            column,
            row,
            surface.nodata,
            &surface.blocked,
        )
        .ok_or_else(|| {
            NativeError::Gdal("No hay elevaciones válidas cerca de un origen".to_owned())
        })?;
        if !starts.contains(&start) {
            starts.push(start);
        }
    }
    let directions: &[(isize, isize)] = match request.connectivity {
        4 => &[(0, -1), (-1, 0), (1, 0), (0, 1)],
        8 => &[
            (-1, -1),
            (0, -1),
            (1, -1),
            (-1, 0),
            (1, 0),
            (-1, 1),
            (0, 1),
            (1, 1),
        ],
        16 => &[
            (-1, -1),
            (0, -1),
            (1, -1),
            (-1, 0),
            (1, 0),
            (-1, 1),
            (0, 1),
            (1, 1),
            (-2, -1),
            (-1, -2),
            (1, -2),
            (2, -1),
            (-2, 1),
            (-1, 2),
            (1, 2),
            (2, 1),
        ],
        _ => {
            return Err(NativeError::Gdal(
                "La conectividad debe ser 4, 8 o 16".to_owned(),
            ))
        }
    };
    let mut distance = vec![f64::INFINITY; cells];
    let mut queue = BinaryHeap::new();
    for start in starts {
        distance[start] = 0.0;
        queue.push(QueueState {
            cost: 0.0,
            position: start,
        });
    }
    let mut unit = "s";
    let mut settled = 0_usize;
    while let Some(QueueState { cost, position }) = queue.pop() {
        if cost > distance[position] {
            continue;
        }
        settled += 1;
        if settled % 20_000 == 0 {
            report_isochrone_progress(
                progress,
                "Calculando coste acumulado",
                8.0 + 67.0 * settled.min(cells) as f64 / cells as f64,
                settled,
                cells,
            )?;
        }
        let x = (position % surface.width) as isize;
        let y = (position / surface.width) as isize;
        for &(dx, dy) in directions {
            let nx = x + dx;
            let ny = y + dy;
            if nx < 0 || ny < 0 || nx >= surface.width as isize || ny >= surface.height as isize {
                continue;
            }
            let next = ny as usize * surface.width + nx as usize;
            if surface.blocked[next] {
                continue;
            }
            if dx != 0 && dy != 0 {
                let horizontal_neighbor = y as usize * surface.width + nx as usize;
                let vertical_neighbor = ny as usize * surface.width + x as usize;
                if surface.blocked[horizontal_neighbor] || surface.blocked[vertical_neighbor] {
                    continue;
                }
            }
            let elevation = surface.elevations[next];
            if !elevation.is_finite()
                || surface
                    .nodata
                    .is_some_and(|value| (elevation - value).abs() <= 0.001)
            {
                continue;
            }
            let horizontal =
                (surface.pixel_x.abs() * dx as f64).hypot(surface.pixel_y.abs() * dy as f64);
            let (edge, edge_unit) = transition_cost(
                &request.model,
                horizontal,
                (elevation - surface.elevations[position]) as f64,
                surface.penalties[position].max(surface.penalties[next]),
                request.critical_slope_percent,
                request.ardigo_speed_ms,
            )?;
            unit = edge_unit;
            let candidate = cost + edge * surface.discounts[position].min(surface.discounts[next]);
            if candidate < distance[next] {
                distance[next] = candidate;
                queue.push(QueueState {
                    cost: candidate,
                    position: next,
                });
            }
        }
    }
    let reachable_cells = distance.iter().filter(|value| value.is_finite()).count();
    report_isochrone_progress(progress, "Extrayendo contornos", 76.0, 0, surface.height)?;
    let max_cost = distance
        .iter()
        .copied()
        .filter(|value| value.is_finite())
        .reduce(f64::max)
        .unwrap_or(0.0);
    let level_count =
        ((max_cost / request.interval).floor() as usize).min(request.max_levels.clamp(1, 30));
    if level_count == 0 {
        return Err(NativeError::Gdal(
            "El intervalo supera el coste acumulado accesible".to_owned(),
        ));
    }
    let mut raw_lines: Vec<(f64, [[f64; 2]; 2])> = Vec::new();
    for y in 0..surface.height.saturating_sub(1) {
        if y % 100 == 0 {
            report_isochrone_progress(
                progress,
                "Extrayendo contornos",
                76.0 + 17.0 * y as f64 / surface.height as f64,
                y,
                surface.height,
            )?;
        }
        for x in 0..surface.width.saturating_sub(1) {
            let values = [
                distance[y * surface.width + x],
                distance[y * surface.width + x + 1],
                distance[(y + 1) * surface.width + x + 1],
                distance[(y + 1) * surface.width + x],
            ];
            if values.iter().any(|value| !value.is_finite()) {
                continue;
            }
            let minimum = values.iter().copied().reduce(f64::min).unwrap_or(0.0);
            let maximum = values.iter().copied().reduce(f64::max).unwrap_or(0.0);
            let first_level = ((minimum / request.interval).ceil() as usize).max(1);
            let last_level = ((maximum / request.interval).floor() as usize).min(level_count);
            if first_level > last_level {
                continue;
            }
            let edges = [(0, 1), (1, 2), (2, 3), (3, 0)];
            for level_index in first_level..=last_level {
                let level = request.interval * level_index as f64;
                let points = [
                    [x as f64 + 0.5, y as f64 + 0.5],
                    [x as f64 + 1.5, y as f64 + 0.5],
                    [x as f64 + 1.5, y as f64 + 1.5],
                    [x as f64 + 0.5, y as f64 + 1.5],
                ];
                let mut crossings = Vec::new();
                for (a, b) in edges {
                    if (values[a] < level) != (values[b] < level) {
                        let ratio = ((level - values[a]) / (values[b] - values[a])).clamp(0.0, 1.0);
                        crossings.push([
                            points[a][0] + (points[b][0] - points[a][0]) * ratio,
                            points[a][1] + (points[b][1] - points[a][1]) * ratio,
                        ]);
                    }
                }
                for pair in crossings.chunks_exact(2) {
                    let project = |point: [f64; 2]| {
                        [
                            surface.origin_x + point[0] * surface.pixel_x,
                            surface.origin_y + point[1] * surface.pixel_y,
                        ]
                    };
                    raw_lines.push((level, [project(pair[0]), project(pair[1])]));
                    if raw_lines.len() > 250_000 {
                        return Err(NativeError::Gdal("Las isócronas generan demasiados segmentos; aumente el intervalo o reduzca el número de líneas".to_owned()));
                    }
                }
            }
        }
    }
    let total_lines = raw_lines.len();
    let mut lines = Vec::with_capacity(total_lines);
    for (chunk_index, chunk) in raw_lines.chunks(10_000).enumerate() {
        let processed = (chunk_index * 10_000).min(total_lines);
        report_isochrone_progress(
            progress,
            "Transformando geometrías",
            94.0 + 3.0 * processed as f64 / total_lines.max(1) as f64,
            processed,
            total_lines,
        )?;
        let flat: Vec<[f64; 2]> = chunk
            .iter()
            .flat_map(|(_, line)| line.iter().copied())
            .collect();
        let geographic = transform_points(&flat, &surface.raster_crs, "EPSG:4326")?;
        lines.extend(
            chunk
                .iter()
                .enumerate()
                .map(|(index, (level, _))| IsochroneLine {
                    level: *level,
                    coordinates: vec![geographic[index * 2], geographic[index * 2 + 1]],
                }),
        );
    }
    let sample_step = surface.width.max(surface.height).div_ceil(300).max(1);
    let surface_width = surface.width.div_ceil(sample_step);
    let surface_height = surface.height.div_ceil(sample_step);
    let mut surface_values = Vec::with_capacity(surface_width * surface_height);
    for y in (0..surface.height).step_by(sample_step) {
        if y % (sample_step * 50) == 0 {
            report_isochrone_progress(
                progress,
                "Preparando visualización",
                97.0,
                y,
                surface.height,
            )?;
        }
        for x in (0..surface.width).step_by(sample_step) {
            let value = distance[y * surface.width + x];
            surface_values.push(if value.is_finite() {
                value as f32
            } else {
                -1.0
            });
        }
    }
    report_isochrone_progress(progress, "Completado", 100.0, cells, cells)?;
    Ok(IsochroneResult {
        model: request.model,
        unit: unit.to_owned(),
        interval: request.interval,
        max_cost,
        reachable_cells,
        lines,
        surface_width,
        surface_height,
        surface_values,
        surface_reused: reused,
        source: format!(
            "GeoTIFF real · cálculo acumulado multi-origen {}",
            surface.raster_crs
        ),
    })
}

#[tauri::command]
fn raster_color_preview(
    app: tauri::AppHandle,
    path: String,
    palette: String,
) -> Result<String, NativeError> {
    let raster = ensure_app_raster(&app, &path)?;
    if palette == "grayscale" {
        return raster_preview_data_url(&raster);
    }
    let gdaldem = command_path("gdaldem")
        .ok_or_else(|| NativeError::Gdal("gdaldem no está instalado".to_owned()))?;
    let identifier = uuid::Uuid::new_v4();
    let colors = raster.with_extension(format!("colors-{identifier}.txt"));
    let colored = raster.with_extension(format!("color-{identifier}.tif"));
    std::fs::write(&colors, palette_definition(&palette)?)
        .map_err(|error| NativeError::Io(error.to_string()))?;
    let result = Command::new(gdaldem)
        .args(["color-relief"])
        .arg(&raster)
        .arg(&colors)
        .arg(&colored)
        .args(["-alpha"])
        .output()
        .map_err(|error| NativeError::Gdal(error.to_string()))?;
    let _ = std::fs::remove_file(&colors);
    if !result.status.success() {
        let _ = std::fs::remove_file(&colored);
        return Err(NativeError::Gdal(
            String::from_utf8_lossy(&result.stderr).trim().to_owned(),
        ));
    }
    let preview = colored_preview_data_url(&colored);
    let _ = std::fs::remove_file(&colored);
    let _ = std::fs::remove_file(auxiliary_metadata_path(&colored));
    preview
}

#[tauri::command]
async fn fetch_map_image(url: String) -> Result<String, NativeError> {
    let url = validate_remote_url(&url)?;
    let response = reqwest::Client::builder()
        .user_agent("ViaSpania/0.1 (report image)")
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|error| NativeError::Network(error.to_string()))?
        .get(url)
        .send()
        .await
        .map_err(|error| NativeError::Network(error.to_string()))?;
    if !response.status().is_success() {
        return Err(NativeError::Network(format!(
            "La imagen PNOA devolvió HTTP {}",
            response.status()
        )));
    }
    let content_type = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or("image/jpeg")
        .to_owned();
    if !content_type.starts_with("image/") {
        return Err(NativeError::Network(
            "El servicio PNOA no devolvió una imagen".to_owned(),
        ));
    }
    let bytes = response
        .bytes()
        .await
        .map_err(|error| NativeError::Network(error.to_string()))?;
    if bytes.len() > 20_000_000 {
        return Err(NativeError::TooLarge);
    }
    Ok(format!(
        "data:{content_type};base64,{}",
        BASE64.encode(bytes)
    ))
}

#[tauri::command]
async fn fetch_vector_tile(url: String) -> Result<String, NativeError> {
    let url = validate_remote_url(&url)?;
    if url.host_str() != Some("vt-poblaciones.ign.es") {
        return Err(NativeError::InvalidUrl(url.to_string()));
    }
    let response = reqwest::Client::builder()
        .user_agent("ViaSpania/0.1 (IGN population tiles)")
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|error| NativeError::Network(error.to_string()))?
        .get(url)
        .send()
        .await
        .map_err(|error| NativeError::Network(error.to_string()))?;
    if !response.status().is_success() {
        return Err(NativeError::Network(format!(
            "La tesela de poblaciones devolvió HTTP {}",
            response.status()
        )));
    }
    let bytes = response
        .bytes()
        .await
        .map_err(|error| NativeError::Network(error.to_string()))?;
    if bytes.len() > 2_000_000 {
        return Err(NativeError::TooLarge);
    }
    Ok(BASE64.encode(bytes))
}

#[tauri::command]
fn save_export_file(
    path: String,
    text: Option<String>,
    base64: Option<String>,
) -> Result<String, NativeError> {
    let output = PathBuf::from(&path);
    let extension = output
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();
    if !matches!(
        extension.as_str(),
        "json" | "geojson" | "pdf" | "png" | "csv" | "gif" | "webm" | "mp4"
    ) {
        return Err(NativeError::Io(
            "El formato seleccionado no está permitido para la exportación".to_owned(),
        ));
    }
    let parent = output
        .parent()
        .ok_or_else(|| NativeError::Io("La ubicación seleccionada no es válida".to_owned()))?;
    if !parent.is_dir() {
        return Err(NativeError::Io(
            "La carpeta seleccionada no existe".to_owned(),
        ));
    }
    if std::fs::symlink_metadata(&output).is_ok_and(|metadata| metadata.file_type().is_symlink()) {
        return Err(NativeError::Io(
            "No se permite sobrescribir un enlace simbólico".to_owned(),
        ));
    }
    let bytes = match (text, base64) {
        (Some(value), None) if extension != "pdf" => value.into_bytes(),
        (None, Some(value))
            if matches!(extension.as_str(), "pdf" | "png" | "gif" | "webm" | "mp4") =>
        {
            BASE64
                .decode(value)
                .map_err(|error| NativeError::Io(error.to_string()))?
        }
        _ => {
            return Err(NativeError::Io(
                "El contenido no corresponde al tipo de archivo".to_owned(),
            ))
        }
    };
    if bytes.len() > 100_000_000 {
        return Err(NativeError::Io(
            "El archivo de exportación supera 100 MB".to_owned(),
        ));
    }
    std::fs::write(&output, bytes).map_err(|error| NativeError::Io(error.to_string()))?;
    Ok(output.to_string_lossy().into_owned())
}

#[tauri::command]
fn export_raster_geotiff(source_path: String, path: String) -> Result<String, NativeError> {
    let source = PathBuf::from(&source_path);
    let output = PathBuf::from(&path);
    let is_tiff = |candidate: &Path| {
        candidate
            .extension()
            .and_then(|value| value.to_str())
            .is_some_and(|value| matches!(value.to_ascii_lowercase().as_str(), "tif" | "tiff"))
    };
    if !is_tiff(&source) || !source.is_file() {
        return Err(NativeError::Io(
            "El modelo de elevación seleccionado no es un GeoTIFF válido".to_owned(),
        ));
    }
    if !is_tiff(&output) {
        return Err(NativeError::Io(
            "La exportación del modelo de elevación requiere la extensión .tif o .tiff".to_owned(),
        ));
    }
    let parent = output
        .parent()
        .ok_or_else(|| NativeError::Io("La ubicación seleccionada no es válida".to_owned()))?;
    if !parent.is_dir() {
        return Err(NativeError::Io(
            "La carpeta seleccionada no existe".to_owned(),
        ));
    }
    if std::fs::symlink_metadata(&output).is_ok_and(|metadata| metadata.file_type().is_symlink()) {
        return Err(NativeError::Io(
            "No se permite sobrescribir un enlace simbólico".to_owned(),
        ));
    }
    std::fs::copy(&source, &output).map_err(|error| NativeError::Io(error.to_string()))?;
    Ok(output.to_string_lossy().into_owned())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct GeoPackageLayerRequest {
    name: String,
    geo_json: String,
}

#[tauri::command]
fn export_geopackage(
    path: String,
    layers: Vec<GeoPackageLayerRequest>,
) -> Result<String, NativeError> {
    let output = PathBuf::from(&path);
    if output
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.eq_ignore_ascii_case("gpkg"))
        != Some(true)
    {
        return Err(NativeError::Io(
            "La exportación GeoPackage requiere la extensión .gpkg".to_owned(),
        ));
    }
    let parent = output
        .parent()
        .ok_or_else(|| NativeError::Io("La ubicación seleccionada no es válida".to_owned()))?;
    if !parent.is_dir() {
        return Err(NativeError::Io(
            "La carpeta seleccionada no existe".to_owned(),
        ));
    }
    if std::fs::symlink_metadata(&output).is_ok_and(|metadata| metadata.file_type().is_symlink()) {
        return Err(NativeError::Io(
            "No se permite sobrescribir un enlace simbólico".to_owned(),
        ));
    }
    if layers.is_empty() {
        return Err(NativeError::Io(
            "No hay elementos para crear el GeoPackage".to_owned(),
        ));
    }
    let ogr2ogr = command_path("ogr2ogr")
        .ok_or_else(|| NativeError::Gdal("ogr2ogr no está instalado".to_owned()))?;
    let temporary = std::env::temp_dir().join(format!("viaspania-gpkg-{}", uuid::Uuid::new_v4()));
    std::fs::create_dir_all(&temporary).map_err(|error| NativeError::Io(error.to_string()))?;
    let result = (|| {
        for (index, layer) in layers.iter().enumerate() {
            if layer.name.is_empty()
                || !layer
                    .name
                    .chars()
                    .all(|value| value.is_ascii_alphanumeric() || value == '_')
            {
                return Err(NativeError::Io(format!(
                    "Nombre de capa no válido: {}",
                    layer.name
                )));
            }
            serde_json::from_str::<Value>(&layer.geo_json).map_err(|error| {
                NativeError::Io(format!("GeoJSON no válido para {}: {error}", layer.name))
            })?;
            let source = temporary.join(format!("{index}.geojson"));
            std::fs::write(&source, &layer.geo_json)
                .map_err(|error| NativeError::Io(error.to_string()))?;
            let mut command = Command::new(&ogr2ogr);
            command.args(["-f", "GPKG"]);
            if index == 0 {
                command.arg("-overwrite");
            } else {
                command.args(["-update", "-append"]);
            }
            command
                .arg(&output)
                .arg(&source)
                .args(["-nln", &layer.name]);
            let result = command
                .output()
                .map_err(|error| NativeError::Gdal(error.to_string()))?;
            if !result.status.success() {
                return Err(NativeError::Gdal(
                    String::from_utf8_lossy(&result.stderr).trim().to_owned(),
                ));
            }
        }
        Ok(path.clone())
    })();
    let _ = std::fs::remove_dir_all(&temporary);
    if result.is_err() {
        let _ = std::fs::remove_file(&output);
    }
    result
}

#[tauri::command]
fn read_project_file(path: String) -> Result<String, NativeError> {
    let input = PathBuf::from(path);
    if input
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.eq_ignore_ascii_case("json"))
        != Some(true)
    {
        return Err(NativeError::Io(
            "Seleccione un proyecto ViaSpania con extensión JSON".to_owned(),
        ));
    }
    let metadata =
        std::fs::symlink_metadata(&input).map_err(|error| NativeError::Io(error.to_string()))?;
    if !metadata.is_file() || metadata.file_type().is_symlink() {
        return Err(NativeError::Io(
            "El proyecto seleccionado no es un archivo JSON válido".to_owned(),
        ));
    }
    if metadata.len() > 10_000_000 {
        return Err(NativeError::TooLarge);
    }
    std::fs::read_to_string(input).map_err(|error| NativeError::Io(error.to_string()))
}

#[tauri::command]
fn native_status() -> NativeStatus {
    let gdal = command_version("gdalinfo", "--version");
    NativeStatus {
        rust_version: command_version("rustc", "--version")
            .unwrap_or_else(|| "Rust no disponible en PATH".to_owned()),
        gdal_version: gdal.clone().unwrap_or_else(|| "No disponible".to_owned()),
        proj_version: command_version("proj", "--version")
            .unwrap_or_else(|| "PROJ instalado; consulte `proj` para detalles".to_owned()),
        gdal_available: gdal.is_some(),
        total_memory_bytes: total_memory_bytes(),
    }
}

#[tauri::command]
async fn fetch_capabilities(url: String) -> Result<String, NativeError> {
    let url = validate_remote_url(&url)?;
    let response = reqwest::Client::builder()
        .user_agent("ViaSpania/0.1 (desktop; contact: local-user)")
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|error| NativeError::Network(error.to_string()))?
        .get(url)
        .send()
        .await
        .map_err(|error| NativeError::Network(error.to_string()))?;
    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(NativeError::ServiceException(format!(
            "HTTP {status}: {}",
            body.chars().take(1000).collect::<String>()
        )));
    }
    let text = response
        .text()
        .await
        .map_err(|error| NativeError::Network(error.to_string()))?;
    if !text.trim_start().starts_with("<?xml") && !text.contains("Capabilities") {
        return Err(NativeError::Network(
            "La respuesta no contiene Capabilities XML".to_owned(),
        ));
    }
    Ok(text)
}

#[tauri::command]
async fn download_wcs(
    app: tauri::AppHandle,
    state: State<'_, DownloadState>,
    request_url: String,
    filename: String,
) -> Result<RasterResult, NativeError> {
    let url = validate_remote_url(&request_url)?;
    state.0.store(false, Ordering::SeqCst);
    let response = reqwest::Client::builder()
        .user_agent("ViaSpania/0.1 (desktop; explicit WCS request)")
        .timeout(std::time::Duration::from_secs(600))
        .build()
        .map_err(|error| NativeError::Network(error.to_string()))?
        .get(url)
        .send()
        .await
        .map_err(|error| NativeError::Network(error.to_string()))?;
    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(NativeError::ServiceException(format!(
            "HTTP {status}: {}",
            body.chars().take(1000).collect::<String>()
        )));
    }
    let total = response.content_length();
    if total.is_some_and(|bytes| bytes > MAX_DOWNLOAD_BYTES) {
        return Err(NativeError::TooLarge);
    }
    let content_type = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or_default()
        .to_owned();
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| NativeError::Io(error.to_string()))?
        .join("rasters");
    tokio::fs::create_dir_all(&directory)
        .await
        .map_err(|error| NativeError::Io(error.to_string()))?;
    let output_path = directory.join(safe_filename(&filename));
    let temporary_path = directory.join(format!("{}.part", uuid::Uuid::new_v4()));
    let mut file = tokio::fs::File::create(&temporary_path)
        .await
        .map_err(|error| NativeError::Io(error.to_string()))?;
    let mut received = 0_u64;
    let mut prefix = Vec::new();
    let mut stream = response.bytes_stream();
    while let Some(chunk) = stream.next().await {
        if state.0.load(Ordering::SeqCst) {
            drop(file);
            let _ = tokio::fs::remove_file(&temporary_path).await;
            return Err(NativeError::Cancelled);
        }
        let chunk = chunk.map_err(|error| NativeError::Network(error.to_string()))?;
        received += chunk.len() as u64;
        if received > MAX_DOWNLOAD_BYTES {
            drop(file);
            let _ = tokio::fs::remove_file(&temporary_path).await;
            return Err(NativeError::TooLarge);
        }
        if prefix.len() < 512 {
            prefix.extend_from_slice(&chunk[..chunk.len().min(512 - prefix.len())]);
        }
        file.write_all(&chunk)
            .await
            .map_err(|error| NativeError::Io(error.to_string()))?;
        let _ = app.emit(
            "wcs-progress",
            DownloadProgress {
                received_bytes: received,
                total_bytes: total,
                percent: total.map(|value| received as f64 / value as f64 * 100.0),
            },
        );
    }
    file.flush()
        .await
        .map_err(|error| NativeError::Io(error.to_string()))?;
    drop(file);
    let prefix_text = String::from_utf8_lossy(&prefix);
    if content_type.contains("xml") || prefix_text.contains("ExceptionReport") {
        let _ = tokio::fs::remove_file(&temporary_path).await;
        return Err(NativeError::ServiceException(prefix_text.into_owned()));
    }
    let metadata = gdal_json(&temporary_path)?;
    let preview_data_url = raster_preview_data_url(&temporary_path)?;
    let _ = tokio::fs::remove_file(auxiliary_metadata_path(&temporary_path)).await;
    tokio::fs::rename(&temporary_path, &output_path)
        .await
        .map_err(|error| NativeError::Io(error.to_string()))?;
    Ok(RasterResult {
        path: output_path.to_string_lossy().into_owned(),
        bytes: received,
        metadata,
        preview_data_url,
    })
}

#[tauri::command]
fn cancel_wcs(state: State<'_, DownloadState>) {
    state.0.store(true, Ordering::SeqCst);
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RasterProcessRequest {
    input_path: String,
    output_name: String,
    target_crs: String,
    resolution_m: Option<f64>,
    cutline_path: Option<String>,
}

#[tauri::command]
fn process_raster(
    app: tauri::AppHandle,
    request: RasterProcessRequest,
) -> Result<RasterResult, NativeError> {
    let input = PathBuf::from(&request.input_path);
    if !input.is_file() || !request.target_crs.starts_with("EPSG:") {
        return Err(NativeError::Io("Entrada o CRS no válidos".to_owned()));
    }
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| NativeError::Io(error.to_string()))?
        .join("rasters");
    std::fs::create_dir_all(&directory).map_err(|error| NativeError::Io(error.to_string()))?;
    let output = directory.join(safe_filename(&request.output_name));
    let executable = command_path("gdalwarp")
        .ok_or_else(|| NativeError::Gdal("gdalwarp no está instalado".to_owned()))?;
    let mut command = Command::new(executable);
    command.args(["-overwrite", "-of", "COG", "-t_srs", &request.target_crs]);
    if let Some(resolution) = request.resolution_m {
        if !resolution.is_finite() || resolution <= 0.0 || resolution > 10_000.0 {
            return Err(NativeError::Gdal(
                "La resolución métrica no es válida".to_owned(),
            ));
        }
        let value = resolution.to_string();
        command.args(["-tr", &value, &value, "-tap", "-r", "bilinear"]);
    }
    if let Some(cutline) = request.cutline_path {
        let path = PathBuf::from(&cutline);
        if !path.is_file() {
            return Err(NativeError::Io("La máscara vectorial no existe".to_owned()));
        }
        command.args([
            "-cutline",
            &cutline,
            "-crop_to_cutline",
            "-dstnodata",
            "-9999",
        ]);
    }
    let result = command
        .arg(&input)
        .arg(&output)
        .output()
        .map_err(|error| NativeError::Gdal(error.to_string()))?;
    if !result.status.success() {
        return Err(NativeError::Gdal(
            String::from_utf8_lossy(&result.stderr).trim().to_owned(),
        ));
    }
    let metadata = gdal_json(&output)?;
    let preview_data_url = raster_preview_data_url(&output)?;
    let bytes = std::fs::metadata(&output)
        .map_err(|error| NativeError::Io(error.to_string()))?
        .len();
    Ok(RasterResult {
        path: output.to_string_lossy().into_owned(),
        bytes,
        metadata,
        preview_data_url,
    })
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RemoteCogProcessRequest {
    urls: Vec<String>,
    output_name: String,
    target_crs: String,
    resolution_m: f64,
    bounds_wgs84: [f64; 4],
}

#[tauri::command]
async fn process_remote_cogs(
    app: tauri::AppHandle,
    state: State<'_, DownloadState>,
    request: RemoteCogProcessRequest,
) -> Result<RasterResult, NativeError> {
    if request.urls.is_empty() || request.urls.len() > 16 {
        return Err(NativeError::Network(
            "El área requiere un número de teselas no válido".to_owned(),
        ));
    }
    if !request.target_crs.starts_with("EPSG:")
        || !request.resolution_m.is_finite()
        || request.resolution_m <= 0.0
        || request.bounds_wgs84.iter().any(|value| !value.is_finite())
        || request.bounds_wgs84[0] >= request.bounds_wgs84[2]
        || request.bounds_wgs84[1] >= request.bounds_wgs84[3]
    {
        return Err(NativeError::Gdal(
            "Parámetros de Copernicus GLO-30 no válidos".to_owned(),
        ));
    }
    let urls = request
        .urls
        .iter()
        .map(|raw| {
            let url = validate_remote_url(raw)?;
            if url.host_str() != Some("copernicus-dem-30m.s3.amazonaws.com")
                || !url.path().starts_with("/Copernicus_DSM_COG_10_")
                || !url.path().ends_with("_DEM.tif")
            {
                return Err(NativeError::InvalidUrl(raw.clone()));
            }
            Ok(url)
        })
        .collect::<Result<Vec<_>, NativeError>>()?;
    state.0.store(false, Ordering::SeqCst);
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| NativeError::Io(error.to_string()))?
        .join("rasters");
    std::fs::create_dir_all(&directory).map_err(|error| NativeError::Io(error.to_string()))?;
    let temporary = directory.join(format!("copernicus-{}", uuid::Uuid::new_v4()));
    std::fs::create_dir_all(&temporary).map_err(|error| NativeError::Io(error.to_string()))?;
    let output = directory.join(safe_filename(&request.output_name));
    let result: Result<RasterResult, NativeError> = async {
        let client = reqwest::Client::builder()
            .user_agent("ViaSpania/0.1 (Copernicus GLO-30 public COG)")
            .timeout(std::time::Duration::from_secs(600))
            .build().map_err(|error| NativeError::Network(error.to_string()))?;
        let mut inputs = Vec::with_capacity(urls.len());
        let mut received_total = 0_u64;
        for (index, url) in urls.into_iter().enumerate() {
            if state.0.load(Ordering::SeqCst) { return Err(NativeError::Cancelled); }
            let response = client.get(url).send().await.map_err(|error| NativeError::Network(error.to_string()))?;
            if response.status() == reqwest::StatusCode::NOT_FOUND {
                return Err(NativeError::Network("Copernicus GLO-30 no dispone de una tesela necesaria para el área seleccionada".to_owned()));
            }
            if !response.status().is_success() {
                return Err(NativeError::Network(format!("Copernicus respondió HTTP {}", response.status())));
            }
            let path = temporary.join(format!("tile-{index}.tif"));
            let mut file = tokio::fs::File::create(&path).await.map_err(|error| NativeError::Io(error.to_string()))?;
            let mut stream = response.bytes_stream();
            while let Some(chunk) = stream.next().await {
                if state.0.load(Ordering::SeqCst) { return Err(NativeError::Cancelled); }
                let chunk = chunk.map_err(|error| NativeError::Network(error.to_string()))?;
                received_total += chunk.len() as u64;
                if received_total > MAX_DOWNLOAD_BYTES { return Err(NativeError::TooLarge); }
                file.write_all(&chunk).await.map_err(|error| NativeError::Io(error.to_string()))?;
                let _ = app.emit("wcs-progress", DownloadProgress{received_bytes:received_total,total_bytes:None,percent:None});
            }
            file.flush().await.map_err(|error| NativeError::Io(error.to_string()))?;
            gdal_json_basic(&path)?;
            inputs.push(path);
        }
        let executable = command_path("gdalwarp").ok_or_else(|| NativeError::Gdal("gdalwarp no está instalado".to_owned()))?;
        let [west, south, east, north] = request.bounds_wgs84;
        let resolution = request.resolution_m.to_string();
        let mut command = Command::new(executable);
        command.args(["-overwrite","-of","COG","-t_srs",&request.target_crs,"-te_srs","EPSG:4326","-te",&west.to_string(),&south.to_string(),&east.to_string(),&north.to_string(),"-tr",&resolution,&resolution,"-tap","-r","bilinear"]);
        for input in &inputs { command.arg(input); }
        let executed = command.arg(&output).output().map_err(|error| NativeError::Gdal(error.to_string()))?;
        if !executed.status.success() { return Err(NativeError::Gdal(String::from_utf8_lossy(&executed.stderr).trim().to_owned())); }
        let metadata = gdal_json(&output)?;
        let preview_data_url = raster_preview_data_url(&output)?;
        let bytes = std::fs::metadata(&output).map_err(|error| NativeError::Io(error.to_string()))?.len();
        Ok(RasterResult{path:output.to_string_lossy().into_owned(),bytes,metadata,preview_data_url})
    }.await;
    let _ = std::fs::remove_dir_all(&temporary);
    if result.is_err() {
        let _ = std::fs::remove_file(&output);
    }
    result
}

#[tauri::command]
fn inspect_geospatial_file(path: String) -> Result<Value, NativeError> {
    let path = PathBuf::from(path);
    if !path.is_file() {
        return Err(NativeError::Io("El archivo no existe".to_owned()));
    }
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default();
    let (tool, arguments) = if matches!(extension.to_ascii_lowercase().as_str(), "tif" | "tiff") {
        ("gdalinfo", vec!["-json"])
    } else {
        ("ogrinfo", vec!["-json", "-so", "-al"])
    };
    let executable =
        command_path(tool).ok_or_else(|| NativeError::Gdal(format!("{tool} no está instalado")))?;
    let output = Command::new(executable)
        .args(arguments)
        .arg(path)
        .output()
        .map_err(|error| NativeError::Gdal(error.to_string()))?;
    if !output.status.success() {
        return Err(NativeError::Gdal(
            String::from_utf8_lossy(&output.stderr).into_owned(),
        ));
    }
    serde_json::from_slice(&output.stdout).map_err(|error| NativeError::Gdal(error.to_string()))
}

fn topographic_surface(
    raster: &Path,
    cache: &SurfaceCache,
) -> Result<(Arc<PreparedSurface>, bool), NativeError> {
    let request = RouteRequest {
        raster_path: raster.to_string_lossy().into_owned(),
        start: [0.0, 0.0],
        end: [0.0, 0.0],
        model: "tobler".into(),
        barriers: vec![],
        corridors: vec![],
        crossings: vec![],
        points_of_interest: vec![],
        connectivity: 8,
        critical_slope_percent: 10.0,
        ardigo_speed_ms: 1.2,
        max_cells: MAX_ROUTE_CELLS,
    };
    prepared_surface(raster, &request, cache)
}

fn valid_elevation(surface: &PreparedSurface, value: f32) -> bool {
    value.is_finite()
        && surface
            .nodata
            .map(|n| (value - n).abs() > f32::EPSILON)
            .unwrap_or(true)
}

fn contour_segments(
    surface: &PreparedSurface,
    interval: f64,
) -> Result<(Vec<IsochroneLine>, f64, f64, usize), NativeError> {
    if !interval.is_finite() || interval < 0.1 || interval > 10_000.0 {
        return Err(NativeError::Gdal(
            "El intervalo de curvas debe estar entre 0,1 y 10.000 m".into(),
        ));
    }
    let valid: Vec<f64> = surface
        .elevations
        .iter()
        .copied()
        .filter(|v| valid_elevation(surface, *v))
        .map(f64::from)
        .collect();
    if valid.is_empty() {
        return Err(NativeError::Gdal(
            "El MDT no contiene elevaciones válidas".into(),
        ));
    }
    let min = valid.iter().copied().fold(f64::INFINITY, f64::min);
    let max = valid.iter().copied().fold(f64::NEG_INFINITY, f64::max);
    let mut projected: Vec<(f64, [[f64; 2]; 2])> = vec![];
    let first = (min / interval).ceil() * interval;
    let mut level = first;
    while level <= max {
        for row in 0..surface.height.saturating_sub(1) {
            for col in 0..surface.width.saturating_sub(1) {
                let ids = [
                    row * surface.width + col,
                    row * surface.width + col + 1,
                    (row + 1) * surface.width + col + 1,
                    (row + 1) * surface.width + col,
                ];
                let z = ids.map(|i| surface.elevations[i]);
                if z.iter().any(|v| !valid_elevation(surface, *v)) {
                    continue;
                }
                let xy = [
                    [col as f64 + 0.5, row as f64 + 0.5],
                    [col as f64 + 1.5, row as f64 + 0.5],
                    [col as f64 + 1.5, row as f64 + 1.5],
                    [col as f64 + 0.5, row as f64 + 1.5],
                ];
                let mut hits = vec![];
                for (a, b) in [(0, 1), (1, 2), (2, 3), (3, 0)] {
                    let za = z[a] as f64;
                    let zb = z[b] as f64;
                    if (za <= level && zb > level) || (zb <= level && za > level) {
                        let t = (level - za) / (zb - za);
                        hits.push([
                            xy[a][0] + t * (xy[b][0] - xy[a][0]),
                            xy[a][1] + t * (xy[b][1] - xy[a][1]),
                        ]);
                    }
                }
                for pair in hits.chunks_exact(2) {
                    let map = |p: [f64; 2]| {
                        [
                            surface.origin_x + p[0] * surface.pixel_x,
                            surface.origin_y + p[1] * surface.pixel_y,
                        ]
                    };
                    projected.push((level, [map(pair[0]), map(pair[1])]));
                }
            }
        }
        level += interval;
    }
    let flat: Vec<[f64; 2]> = projected
        .iter()
        .flat_map(|(_, s)| s.iter().copied())
        .collect();
    let geographic = transform_points(&flat, &surface.raster_crs, "EPSG:4326")?;
    let lines = projected
        .into_iter()
        .enumerate()
        .map(|(i, (level, _))| IsochroneLine {
            level,
            coordinates: vec![geographic[i * 2], geographic[i * 2 + 1]],
        })
        .collect();
    Ok((lines, min, max, surface.elevations.len() - valid.len()))
}

#[tauri::command]
fn calculate_contours(
    app: tauri::AppHandle,
    cache: State<'_, SurfaceCache>,
    request: ContourRequest,
) -> Result<ContourResult, NativeError> {
    let raster = ensure_app_raster(&app, &request.raster_path)?;
    let (surface, _) = topographic_surface(&raster, &cache)?;
    let (lines, min, max, nodata) = contour_segments(&surface, request.interval_m)?;
    Ok(ContourResult {
        interval_m: request.interval_m,
        lines,
        min_elevation_m: min,
        max_elevation_m: max,
        raster_crs: surface.raster_crs.clone(),
        resolution_m: surface.pixel_x.abs().max(surface.pixel_y.abs()),
        nodata_cells: nodata,
        source: "GeoTIFF/MDT cargado · marching squares".into(),
    })
}

fn viewshed_for(
    surface: &PreparedSurface,
    observer: &ViewshedObserver,
    observer_height: f64,
) -> Result<ViewshedObserverResult, NativeError> {
    if !observer_height.is_finite() || observer_height < 0.0 || observer_height > 1000.0 {
        return Err(NativeError::Gdal(
            "La altura del observador debe estar entre 0 y 1.000 m".into(),
        ));
    }
    let projected = transform_points(&[observer.coordinate], "EPSG:4326", &surface.raster_crs)?[0];
    let ox = ((projected[0] - surface.origin_x) / surface.pixel_x - 0.5).round() as isize;
    let oy = ((projected[1] - surface.origin_y) / surface.pixel_y - 0.5).round() as isize;
    if ox < 0 || oy < 0 || ox >= surface.width as isize || oy >= surface.height as isize {
        return Err(NativeError::Gdal(format!(
            "El observador «{}» está fuera del MDT",
            observer.name
        )));
    }
    let oi = oy as usize * surface.width + ox as usize;
    let ground = surface.elevations[oi];
    if !valid_elevation(surface, ground) {
        return Err(NativeError::Gdal(format!(
            "El observador «{}» cae sobre una celda sin datos",
            observer.name
        )));
    }
    let max_side = 500usize;
    let step = ((surface.width.max(surface.height) + max_side - 1) / max_side).max(1);
    let width = (surface.width + step - 1) / step;
    let height = (surface.height + step - 1) / step;
    let sx = (ox as usize / step).min(width - 1);
    let sy = (oy as usize / step).min(height - 1);
    let bins = 7200usize;
    let mut cells = Vec::with_capacity(width * height);
    for y in 0..height {
        for x in 0..width {
            let dx = x as f64 - sx as f64;
            let dy = y as f64 - sy as f64;
            cells.push((dx * dx + dy * dy, x, y));
        }
    }
    cells.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap_or(CmpOrdering::Equal));
    let mut horizon = vec![f64::NEG_INFINITY; bins];
    let mut values = vec![0f32; width * height];
    let mut visible = 0;
    let mut valid_cells = 0;
    for (d2, x, y) in cells {
        let rx = (x * step).min(surface.width - 1);
        let ry = (y * step).min(surface.height - 1);
        let z = surface.elevations[ry * surface.width + rx];
        let out = y * width + x;
        if !valid_elevation(surface, z) {
            values[out] = -1.0;
            continue;
        }
        valid_cells += 1;
        if d2 == 0.0 {
            values[out] = 1.0;
            visible += 1;
            continue;
        }
        let angle = (y as f64 - sy as f64).atan2(x as f64 - sx as f64);
        let bin = (((angle + std::f64::consts::PI) / (2.0 * std::f64::consts::PI) * bins as f64)
            .floor() as usize)
            .min(bins - 1);
        let distance = ((x as f64 - sx as f64) * surface.pixel_x * step as f64)
            .hypot((y as f64 - sy as f64) * surface.pixel_y * step as f64);
        let vertical = ((z as f64) - (ground as f64 + observer_height)) / distance;
        if vertical >= horizon[bin] - 1e-9 {
            values[out] = 1.0;
            visible += 1;
            horizon[bin] = horizon[bin].max(vertical)
        }
    }
    Ok(ViewshedObserverResult {
        observer_id: observer.id.clone(),
        observer_name: observer.name.clone(),
        coordinate: observer.coordinate,
        ground_elevation_m: ground as f64,
        observer_height_m: observer_height,
        surface_width: width,
        surface_height: height,
        surface_values: values,
        visible_cells: visible,
        valid_cells,
    })
}

#[tauri::command]
fn calculate_viewshed(
    app: tauri::AppHandle,
    cache: State<'_, SurfaceCache>,
    request: ViewshedRequest,
) -> Result<ViewshedResult, NativeError> {
    if request.observers.is_empty() {
        return Err(NativeError::Gdal(
            "Seleccione al menos un punto de observación".into(),
        ));
    }
    let raster = ensure_app_raster(&app, &request.raster_path)?;
    let (surface, _) = topographic_surface(&raster, &cache)?;
    let observers = request
        .observers
        .iter()
        .map(|o| viewshed_for(&surface, o, request.observer_height_m))
        .collect::<Result<Vec<_>, _>>()?;
    Ok(ViewshedResult{observers,raster_crs:surface.raster_crs.clone(),resolution_m:surface.pixel_x.abs().max(surface.pixel_y.abs()),source:"GeoTIFF/MDT cargado · horizonte angular sobre la extensión requerida".into(),limitation:"Resultado topográfico condicionado por la resolución y calidad del MDT. No incorpora vegetación, edificios ni otros obstáculos ausentes del modelo; la visibilidad real puede variar considerablemente.".into()})
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let geospatial = app.path().resource_dir()?.join("geospatial");
            let gdalinfo = if cfg!(windows) {
                "gdalinfo.exe"
            } else {
                "gdalinfo"
            };
            if geospatial.join("bin").join(gdalinfo).is_file() {
                let _ = BUNDLED_GEOSPATIAL_DIR.set(geospatial.clone());
                std::env::set_var("GDAL_DATA", geospatial.join("share/gdal"));
                std::env::set_var("PROJ_DATA", geospatial.join("share/proj"));
                std::env::set_var("PROJ_LIB", geospatial.join("share/proj"));
                let library_variable = if cfg!(target_os = "windows") {
                    "PATH"
                } else if cfg!(target_os = "macos") {
                    "DYLD_LIBRARY_PATH"
                } else {
                    "LD_LIBRARY_PATH"
                };
                let mut library_paths = vec![geospatial.join("lib"), geospatial.join("bin")];
                if let Some(existing) = std::env::var_os(library_variable) {
                    library_paths.extend(std::env::split_paths(&existing));
                }
                if let Ok(value) = std::env::join_paths(library_paths) {
                    std::env::set_var(library_variable, value);
                }
            }
            Ok(())
        })
        .manage(DownloadState::default())
        .manage(SurfaceCache::default())
        .manage(IsochroneState::default())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            native_status,
            fetch_capabilities,
            download_wcs,
            cancel_wcs,
            process_raster,
            process_remote_cogs,
            inspect_geospatial_file,
            raster_color_preview,
            fetch_map_image,
            fetch_vector_tile,
            calculate_raster_route,
            calculate_raster_lcp_corridor,
            calculate_raster_isochrones,
            calculate_contours,
            calculate_viewshed,
            cancel_raster_isochrones,
            sample_raster_elevation,
            sample_raster_elevation_at,
            generate_terrain_mesh,
            save_export_file,
            export_raster_geotiff,
            export_geopackage,
            read_project_file
        ])
        .run(tauri::generate_context!())
        .expect("error al ejecutar ViaSpania");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolves_platform_executable_names() {
        assert_eq!(platform_executable_name("gdalinfo", false), "gdalinfo");
        assert_eq!(platform_executable_name("gdalinfo", true), "gdalinfo.exe");
    }

    #[test]
    fn removes_windows_verbatim_prefix_for_external_tools() {
        let path =
            Path::new(r"\\?\C:\Users\anton\AppData\Roaming\es.viaspania.desktop\rasters\mdt5.tif");
        assert_eq!(
            platform_external_path(path, true).to_string_lossy(),
            r"C:\Users\anton\AppData\Roaming\es.viaspania.desktop\rasters\mdt5.tif"
        );
    }

    #[test]
    fn converts_windows_verbatim_unc_path_for_external_tools() {
        let path = Path::new(r"\\?\UNC\servidor\datos\mdt5.tif");
        assert_eq!(
            platform_external_path(path, true).to_string_lossy(),
            r"\\servidor\datos\mdt5.tif"
        );
    }

    #[test]
    fn preserves_regular_and_non_windows_paths_for_external_tools() {
        let windows_path = Path::new(r"C:\datos\mdt5.tif");
        let unix_path = Path::new("/tmp/mdt5.tif");
        assert_eq!(platform_external_path(windows_path, true), windows_path);
        assert_eq!(platform_external_path(unix_path, false), unix_path);
    }

    #[test]
    fn rejects_non_https_and_unknown_hosts() {
        assert!(validate_remote_url("http://servicios.idee.es/wcs").is_err());
        assert!(validate_remote_url("https://example.com/wcs").is_err());
        assert!(validate_remote_url("https://servicios.idee.es/wcs").is_ok());
        assert!(validate_remote_url("https://wcs-mds.idee.es/mds").is_ok());
    }

    #[test]
    fn accepts_points_on_raster_edges_but_rejects_external_points() {
        let cell = |point| raster_cell_for_point(point, 10, 8, 100.0, 200.0, 5.0, -5.0);
        assert_eq!(cell([100.0, 200.0]), Some((0, 0)));
        assert_eq!(cell([150.0, 160.0]), Some((9, 7)));
        assert_eq!(cell([152.4, 157.6]), Some((9, 7)));
        assert_eq!(cell([153.0, 160.0]), None);
        assert_eq!(cell([100.0, 157.0]), None);
    }

    #[test]
    fn exposes_complete_color_palettes() {
        for palette in ["terrain", "hypsometric", "viridis", "alpine"] {
            let definition = palette_definition(palette).expect("paleta disponible");
            assert!(definition.contains("nv 0 0 0 0"));
            assert!(definition.lines().count() >= 7);
        }
        assert!(palette_definition("desconocida").is_err());
    }

    #[test]
    fn calculates_route_on_real_raster_when_fixture_is_available() {
        let Ok(path) = std::env::var("VIASPANIA_TEST_RASTER") else {
            return;
        };
        let raster_path = PathBuf::from(&path);
        let metadata = gdal_json(&raster_path).expect("metadatos del ráster de prueba");
        let raster_crs = raster_epsg(&raster_path).expect("CRS del ráster de prueba");
        let width = metadata_number(&metadata, "size", 0).expect("ancho");
        let height = metadata_number(&metadata, "size", 1).expect("alto");
        let origin_x = metadata_number(&metadata, "geoTransform", 0).expect("origen x");
        let pixel_x = metadata_number(&metadata, "geoTransform", 1).expect("píxel x");
        let origin_y = metadata_number(&metadata, "geoTransform", 3).expect("origen y");
        let pixel_y = metadata_number(&metadata, "geoTransform", 5).expect("píxel y");
        let endpoints = transform_points(
            &[
                [
                    origin_x + width * pixel_x * 0.25,
                    origin_y + height * pixel_y * 0.25,
                ],
                [
                    origin_x + width * pixel_x * 0.75,
                    origin_y + height * pixel_y * 0.75,
                ],
            ],
            &raster_crs,
            "EPSG:4326",
        )
        .expect("extremos WGS84");
        let cache = SurfaceCache::default();
        let request = RouteRequest {
            raster_path: String::new(),
            start: endpoints[0],
            end: endpoints[1],
            model: "tobler".to_owned(),
            barriers: Vec::new(),
            corridors: Vec::new(),
            crossings: Vec::new(),
            points_of_interest: Vec::new(),
            connectivity: 8,
            critical_slope_percent: 10.0,
            ardigo_speed_ms: 1.2,
            max_cells: MAX_ROUTE_CELLS,
        };
        let result = calculate_route_from_path(PathBuf::from(&path), request.clone(), &cache)
            .expect("ruta sobre el GeoTIFF real");
        assert!(result.coordinates.len() >= 2);
        assert_eq!(result.elevations_m.len(), result.coordinates.len());
        assert_eq!(result.slopes_percent.len(), result.coordinates.len());
        assert!(result.distance_m > 0.0);
        assert!(result
            .source
            .starts_with("GeoTIFF real · cálculo métrico EPSG:"));
        assert!(!result.surface_reused);

        let repeated = calculate_route_from_path(PathBuf::from(path), request, &cache)
            .expect("ruta repetida sobre la superficie preparada");
        assert!(repeated.surface_reused);
        assert_eq!(result.coordinates, repeated.coordinates);
        assert_eq!(result.cost, repeated.cost);

        let accumulated = calculate_isochrones_from_path(
            PathBuf::from(std::env::var("VIASPANIA_TEST_RASTER").expect("ruta de prueba")),
            IsochroneRequest {
                raster_path: String::new(),
                origins: vec![endpoints[0]],
                model: "tobler".to_owned(),
                barriers: Vec::new(),
                corridors: Vec::new(),
                crossings: Vec::new(),
                points_of_interest: Vec::new(),
                connectivity: 8,
                critical_slope_percent: 10.0,
                ardigo_speed_ms: 1.2,
                max_cells: MAX_ROUTE_CELLS,
                interval: 300.0,
                max_levels: 5,
            },
            &cache,
            None,
        )
        .expect("isócronas sobre el GeoTIFF real");
        assert!(accumulated.surface_reused);
        assert!(accumulated.reachable_cells > 0);
        assert!(accumulated.surface_width <= 300);
        assert!(accumulated.surface_height <= 300);
        assert_eq!(
            accumulated.surface_values.len(),
            accumulated.surface_width * accumulated.surface_height
        );
    }

    #[test]
    fn surface_key_only_changes_with_terrain_inputs() {
        let path = std::env::temp_dir().join(format!(
            "viaspania-surface-key-{}.tif",
            uuid::Uuid::new_v4()
        ));
        std::fs::write(&path, b"fixture").expect("crear archivo temporal");
        let request = RouteRequest {
            raster_path: String::new(),
            start: [-3.713, 40.423],
            end: [-3.702, 40.412],
            model: "tobler".to_owned(),
            barriers: Vec::new(),
            corridors: Vec::new(),
            crossings: Vec::new(),
            points_of_interest: Vec::new(),
            connectivity: 8,
            critical_slope_percent: 10.0,
            ardigo_speed_ms: 1.2,
            max_cells: MAX_ROUTE_CELLS,
        };
        let key = surface_cache_key(&path, &request).expect("clave base");
        let mut changed = request.clone();
        changed.start = [-4.0, 41.0];
        changed.end = [-4.1, 41.1];
        changed.max_cells = 100_000;
        changed.connectivity = 16;
        changed.model = "ardigo".to_owned();
        changed.critical_slope_percent = 25.0;
        changed.ardigo_speed_ms = 3.0;
        assert_eq!(
            key,
            surface_cache_key(&path, &changed).expect("misma clave")
        );

        changed.barriers.push(BarrierRequest {
            coordinates: vec![[-3.71, 40.42], [-3.70, 40.41]],
            kind: "absolute".to_owned(),
            value: 1.0,
        });
        assert_ne!(
            key,
            surface_cache_key(&path, &changed).expect("clave distinta")
        );
        std::fs::remove_file(path).expect("eliminar archivo temporal");
    }

    #[test]
    fn rasterizes_barriers_with_protective_width() {
        let (blocked, penalties) = rasterize_barriers(
            &[BarrierRequest {
                coordinates: vec![[1.0, 9.0], [8.0, 2.0]],
                kind: "absolute".to_owned(),
                value: 1.0,
            }],
            10,
            10,
            0.0,
            10.0,
            1.0,
            -1.0,
        );
        assert!(blocked[1 * 10 + 1]);
        assert!(blocked[5 * 10 + 5]);
        assert!(blocked[5 * 10 + 4]);
        assert!(!blocked[9 * 10]);
        assert_eq!(penalties[5 * 10 + 5], 1.0);
    }

    #[test]
    fn rasterizes_every_segment_of_a_polyline_barrier() {
        let (blocked, _) = rasterize_barriers(
            &[BarrierRequest {
                coordinates: vec![[1.0, 9.0], [1.0, 5.0], [7.0, 5.0]],
                kind: "absolute".to_owned(),
                value: 1.0,
            }],
            10,
            10,
            0.0,
            10.0,
            1.0,
            -1.0,
        );
        assert!(blocked[3 * 10 + 1], "primer tramo vertical");
        assert!(blocked[5 * 10 + 6], "segundo tramo horizontal");
        assert!(!blocked[8 * 10 + 8], "celda ajena a la polilínea");
    }

    #[test]
    fn applies_soft_barrier_penalties() {
        let (blocked, penalties) = rasterize_barriers(
            &[BarrierRequest {
                coordinates: vec![[1.0, 9.0], [8.0, 2.0]],
                kind: "penalty".to_owned(),
                value: 4.0,
            }],
            10,
            10,
            0.0,
            10.0,
            1.0,
            -1.0,
        );
        assert!(!blocked[5 * 10 + 5]);
        assert_eq!(penalties[5 * 10 + 5], 4.0);
    }

    #[test]
    fn corridors_discount_and_crossings_reopen_only_local_cells() {
        let mut blocked = vec![false; 25];
        blocked[12] = true;
        blocked[13] = true;
        let discounts = rasterize_facilitators(
            &[CorridorRequest {
                coordinates: vec![[0.0, -1.0], [4.0, -1.0]],
                width_m: 1.0,
                cost_multiplier: 0.4,
            }],
            &[CrossingRequest {
                coordinates: vec![[2.0, -2.0], [2.0, -2.1]],
                crossing_cost_multiplier: 0.8,
            }],
            &[],
            &mut blocked,
            5,
            5,
            0.0,
            0.0,
            1.0,
            -1.0,
        );
        assert_eq!(discounts[7], 0.4);
        assert_eq!(discounts[12], 0.4);
        assert!(!blocked[12]);
        assert!(blocked[13]);
    }

    #[test]
    fn point_influence_decays_and_remains_positive() {
        let mut blocked = vec![false; 25];
        let discounts = rasterize_facilitators(
            &[],
            &[],
            &[PointOfInterestRequest {
                coordinate: [2.0, -2.0],
                influence_radius_m: 2.0,
                attraction: 0.5,
                mode: "influence".to_owned(),
            }],
            &mut blocked,
            5,
            5,
            0.0,
            0.0,
            1.0,
            -1.0,
        );
        assert!((discounts[12] - 0.5).abs() < 1e-9);
        assert!((discounts[11] - 0.75).abs() < 1e-9);
        assert_eq!(discounts[10], 1.0);
        assert!(discounts.iter().all(|value| *value > 0.0));
    }

    #[test]
    fn audited_models_produce_finite_positive_costs() {
        for model in [
            "tobler",
            "tobler-off",
            "marquez-perez",
            "kondo-seino",
            "rees",
            "gkrs",
            "tripcevich",
            "alberti",
            "pandolf",
            "pandolf-corrected",
            "minetti",
            "herzog",
            "ardigo",
            "wheeled",
            "eastman",
        ] {
            let (cost, _) =
                transition_cost(model, 5.0, 0.5, 1.0, 10.0, 1.2).expect("modelo registrado");
            assert!(
                cost.is_finite() && cost > 0.0,
                "coste inválido para {model}"
            );
        }
    }

    #[test]
    fn kondo_and_corrected_pandolf_are_directional() {
        let uphill = transition_cost("kondo-seino", 10.0, 1.0, 1.0, 10.0, 1.2)
            .unwrap()
            .0;
        let downhill = transition_cost("kondo-seino", 10.0, -1.0, 1.0, 10.0, 1.2)
            .unwrap()
            .0;
        assert_ne!(uphill, downhill);
        let pandolf_up = transition_cost("pandolf-corrected", 10.0, 1.0, 1.0, 10.0, 1.2)
            .unwrap()
            .0;
        let pandolf_down = transition_cost("pandolf-corrected", 10.0, -1.0, 1.0, 10.0, 1.2)
            .unwrap()
            .0;
        assert_ne!(pandolf_up, pandolf_down);
    }

    #[test]
    fn sanitizes_output_names() {
        assert_eq!(safe_filename("../../Mi MDT"), "MiMDT.tif");
        assert_eq!(safe_filename(""), "mdt.tif");
    }

    #[test]
    fn exports_selected_geotiff_without_altering_its_bytes() {
        let directory =
            std::env::temp_dir().join(format!("viaspania-geotiff-test-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&directory).unwrap();
        let source = directory.join("modelo.tif");
        let output = directory.join("exportado.tiff");
        std::fs::write(&source, b"GeoTIFF de prueba").unwrap();
        export_raster_geotiff(
            source.to_string_lossy().into_owned(),
            output.to_string_lossy().into_owned(),
        )
        .unwrap();
        assert_eq!(std::fs::read(&output).unwrap(), b"GeoTIFF de prueba");
        let _ = std::fs::remove_dir_all(directory);
    }

    #[test]
    fn leaves_coordinates_unchanged_when_crs_matches() {
        let points = [[500_000.0, 4_400_000.0], [500_005.0, 4_400_005.0]];
        assert_eq!(
            transform_points(&points, "EPSG:25830", "EPSG:25830").unwrap(),
            points
        );
    }

    fn tiny_topographic_surface() -> PreparedSurface {
        PreparedSurface {
            raster_crs: "EPSG:4326".into(),
            width: 2,
            height: 2,
            origin_x: -3.0,
            origin_y: 40.0,
            pixel_x: 0.001,
            pixel_y: -0.001,
            nodata: Some(-9999.0),
            elevations: vec![0.0, 20.0, 20.0, 0.0],
            blocked: vec![false; 4],
            penalties: vec![1.0; 4],
            discounts: vec![1.0; 4],
        }
    }

    #[test]
    fn extracts_contours_from_a_small_dem() {
        let (lines, min, max, nodata) =
            contour_segments(&tiny_topographic_surface(), 10.0).unwrap();
        assert!(!lines.is_empty());
        assert_eq!((min, max, nodata), (0.0, 20.0, 0));
        assert!(lines.iter().all(|line| line.coordinates.len() == 2));
    }

    #[test]
    fn viewshed_rejects_invalid_observer_height_before_processing() {
        let observer = ViewshedObserver {
            id: "1".into(),
            name: "Observador".into(),
            coordinate: [-2.9995, 39.9995],
        };
        let error = match viewshed_for(&tiny_topographic_surface(), &observer, -1.0) {
            Err(error) => error,
            Ok(_) => panic!("debía rechazar la altura"),
        };
        assert!(error.to_string().contains("altura"));
    }
}
