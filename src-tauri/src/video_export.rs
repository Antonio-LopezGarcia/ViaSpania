use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use std::{
    collections::HashMap,
    fs::{File, OpenOptions},
    io::{Seek, SeekFrom, Write},
    path::{Path, PathBuf},
    process::{Command, Stdio},
    sync::Mutex,
};
use tauri::{Manager, State};

const LIMIT: u64 = 1_500_000_000;
struct Pending {
    file: Option<File>,
    path: PathBuf,
    preserve: bool,
}
impl Drop for Pending {
    fn drop(&mut self) {
        // Close before deleting (also required on Windows).
        drop(self.file.take());
        if !self.preserve {
            let _ = std::fs::remove_file(&self.path);
        }
    }
}
impl Pending {
    fn file(&mut self) -> &mut File {
        self.file.as_mut().expect("active video file")
    }
}
#[derive(Default)]
pub struct VideoExports(Mutex<HashMap<String, Pending>>);
fn error(e: impl std::fmt::Display) -> String {
    format!("No se pudo escribir el vídeo: {e}")
}

fn start(state: &VideoExports) -> Result<String, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let path = std::env::temp_dir().join(format!("viaspania-video-{id}.avi"));
    let file = OpenOptions::new()
        .read(true)
        .write(true)
        .create_new(true)
        .open(&path)
        .map_err(error)?;
    let mut pending = Pending {
        file: Some(file),
        path,
        preserve: false,
    };
    pending.file().write_all(&[0; 224]).map_err(error)?;
    state.0.lock().map_err(error)?.insert(id.clone(), pending);
    Ok(id)
}
fn append(state: &VideoExports, id: String, base64: String) -> Result<(), String> {
    if base64.len() > 24_000_000 {
        return Err("El fotograma supera el tamaño permitido".into());
    }
    let bytes = BASE64.decode(base64).map_err(error)?;
    let mut sessions = state.0.lock().map_err(error)?;
    let session = sessions
        .get_mut(&id)
        .ok_or("La exportación ya no está activa")?;
    if session.file().metadata().map_err(error)?.len() + bytes.len() as u64 > LIMIT {
        return Err("El vídeo supera 1,5 GB. Reduzca duración o resolución.".into());
    }
    session.file().write_all(&bytes).map_err(error)
}
fn cancel(state: &VideoExports, id: String) -> Result<(), String> {
    if let Some(session) = state.0.lock().map_err(error)?.remove(&id) {
        let path = session.path.clone();
        drop(session);
        let _ = std::fs::remove_file(path);
    }
    Ok(())
}
fn finish_with(
    state: &VideoExports,
    id: String,
    path: String,
    header: Vec<u8>,
    index: Vec<u8>,
    convert: impl FnOnce(&Path, &Path) -> Result<(), String>,
) -> Result<String, String> {
    if header.len() != 224
        || !header.starts_with(b"RIFF")
        || index.len() > 100_000
        || !index.starts_with(b"idx1")
    {
        return Err("Cabecera de vídeo no válida".into());
    }
    let mut session = state
        .0
        .lock()
        .map_err(error)?
        .remove(&id)
        .ok_or("La exportación ya no está activa")?;
    let result = (|| {
        session.file().write_all(&index).map_err(error)?;
        session.file().seek(SeekFrom::Start(0)).map_err(error)?;
        session.file().write_all(&header).map_err(error)?;
        session.file().sync_all().map_err(error)?;
        let destination = PathBuf::from(&path);
        let mp4 = destination
            .extension()
            .is_some_and(|e| e.eq_ignore_ascii_case("mp4"));
        // Retain the finalized AVI for every MP4 failure, including publication errors.
        session.preserve = mp4;
        if destination
            .extension()
            .and_then(|e| e.to_str())
            .is_none_or(|e| !e.eq_ignore_ascii_case("avi") && !e.eq_ignore_ascii_case("mp4"))
        {
            return Err("Seleccione un archivo AVI o MP4".into());
        }
        if std::fs::symlink_metadata(&destination).is_ok_and(|m| m.file_type().is_symlink()) {
            return Err("No se permite sobrescribir un enlace simbólico".into());
        }
        let temporary =
            destination.with_file_name(format!(".viaspania-video-{}.tmp", uuid::Uuid::new_v4()));
        let copy_result = (|| {
            let mut output = OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&temporary)
                .map_err(error)?;
            if mp4 {
                drop(output);
                // FFmpeg opens the completed AVI itself; release the writer first.
                drop(session.file.take());
                convert(&session.path, &temporary)?;
                output = OpenOptions::new()
                    .write(true)
                    .open(&temporary)
                    .map_err(error)?;
                if output.metadata().map_err(error)?.len() == 0 {
                    return Err("El conversor produjo un archivo MP4 vacío".into());
                }
            } else {
                session.file().seek(SeekFrom::Start(0)).map_err(error)?;
                std::io::copy(session.file(), &mut output).map_err(error)?;
            }
            output.sync_all().map_err(error)?;
            drop(output);
            std::fs::rename(&temporary, &destination).map_err(error)?;
            session.preserve = false;
            Ok(path)
        })();
        let _ = std::fs::remove_file(temporary);
        copy_result
    })();
    match result {
        Err(detail) if session.preserve => Err(format!(
            "No se pudo guardar el MP4. El AVI se conserva en {}. Detalle: {detail}",
            session.path.display()
        )),
        other => other,
    }
}

const MP4_OPTIONS: &[&str] = &[
    "-map",
    "0:v:0",
    "-an",
    "-c:v",
    "libx264",
    "-crf",
    "20",
    "-preset",
    "medium",
    // MJPEG carries full-range colour. Convert (do not merely relabel) to TV range
    // so H.264 decoders report yuv420p rather than the legacy yuvj420p format.
    "-vf",
    "scale=out_range=tv",
    "-color_range",
    "tv",
    "-pix_fmt",
    "yuv420p",
    "-fps_mode",
    "passthrough",
    "-f",
    "mp4",
];

fn convert_mp4(binary: &Path, input: &Path, output: &Path) -> Result<(), String> {
    let result = Command::new(binary)
        .args(["-hide_banner", "-loglevel", "error", "-nostdin", "-y", "-i"])
        .arg(input)
        .args(MP4_OPTIONS)
        .arg(output)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .output()
        .map_err(|e| format!("No se pudo iniciar el conversor MP4: {e}"))?;
    if !result.status.success() {
        let detail = String::from_utf8_lossy(&result.stderr);
        return Err(format!(
            "Falló la conversión MP4: {}",
            detail.chars().take(2000).collect::<String>()
        ));
    }
    Ok(())
}

fn converter_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let name = if cfg!(windows) {
        "ffmpeg.exe"
    } else {
        "ffmpeg"
    };
    let bundled = app
        .path()
        .resolve(
            format!("video/{name}"),
            tauri::path::BaseDirectory::Resource,
        )
        .map_err(error)?;
    if bundled.is_file() {
        return Ok(bundled);
    }
    #[cfg(debug_assertions)]
    {
        let development = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("resources/video")
            .join(name);
        if development.is_file() {
            return Ok(development);
        }
    }
    Err(
        "Falta el conversor MP4 de ViaSpania. Reinstale la aplicación con sus recursos de vídeo."
            .into(),
    )
}

#[tauri::command]
pub fn video_export_start(state: State<'_, VideoExports>) -> Result<String, String> {
    start(&state)
}
#[tauri::command]
pub fn video_export_append(
    state: State<'_, VideoExports>,
    id: String,
    base64: String,
) -> Result<(), String> {
    append(&state, id, base64)
}
#[tauri::command]
pub fn video_export_cancel(state: State<'_, VideoExports>, id: String) -> Result<(), String> {
    cancel(&state, id)
}
#[tauri::command]
pub async fn video_export_finish(
    app: tauri::AppHandle,
    id: String,
    path: String,
    header: Vec<u8>,
    index: Vec<u8>,
) -> Result<String, String> {
    // Run the potentially long encode off Tauri's event loop.
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<VideoExports>();
        finish_with(&state, id, path, header, index, |input, output| {
            convert_mp4(&converter_path(&app)?, input, output)
        })
    })
    .await
    .map_err(error)?
}

#[cfg(test)]
mod tests {
    use super::*;
    fn finish(
        state: &VideoExports,
        id: String,
        path: String,
        header: Vec<u8>,
        index: Vec<u8>,
    ) -> Result<String, String> {
        finish_with(state, id, path, header, index, |_, _| {
            panic!("AVI must not invoke FFmpeg")
        })
    }
    #[test]
    fn streams_more_than_old_limit_and_removes_temporary() {
        let state = VideoExports::default();
        let id = start(&state).unwrap();
        let temporary = {
            let mut map = state.0.lock().unwrap();
            let entry = map.get_mut(&id).unwrap();
            entry.file().set_len(100_000_001).unwrap();
            entry.file().seek(SeekFrom::End(0)).unwrap();
            entry.path.clone()
        };
        append(&state, id.clone(), BASE64.encode([1, 2, 3])).unwrap();
        let destination =
            std::env::temp_dir().join(format!("viaspania-video-test-{}.avi", uuid::Uuid::new_v4()));
        let mut header = vec![0; 224];
        header[..4].copy_from_slice(b"RIFF");
        finish(
            &state,
            id,
            destination.to_string_lossy().into_owned(),
            header,
            b"idx1".to_vec(),
        )
        .unwrap();
        assert_eq!(std::fs::metadata(&destination).unwrap().len(), 100_000_008);
        assert!(!temporary.exists());
        assert!(state.0.lock().unwrap().is_empty());
        std::fs::remove_file(destination).unwrap();
    }
    #[test]
    fn cancellation_is_idempotent_and_does_not_accept_paths() {
        let state = VideoExports::default();
        let id = start(&state).unwrap();
        let path = state.0.lock().unwrap()[&id].path.clone();
        cancel(&state, id.clone()).unwrap();
        cancel(&state, id.clone()).unwrap();
        assert!(!path.exists());
        assert!(append(&state, "../../file".into(), BASE64.encode([1])).is_err());
    }
    #[test]
    fn invalid_destination_cleans_session() {
        let state = VideoExports::default();
        let id = start(&state).unwrap();
        let path = state.0.lock().unwrap()[&id].path.clone();
        let mut header = vec![0; 224];
        header[..4].copy_from_slice(b"RIFF");
        assert!(finish(&state, id, "invalid.txt".into(), header, b"idx1".to_vec()).is_err());
        assert!(!path.exists());
        assert!(state.0.lock().unwrap().is_empty());
    }

    #[test]
    fn avi_is_saved_byte_for_byte_without_a_converter() {
        let bytes = include_bytes!("../tests/fixtures/video-32x24-24fps.avi");
        let index = bytes.windows(4).rposition(|v| v == b"idx1").unwrap();
        let state = VideoExports::default();
        let id = start(&state).unwrap();
        let source = state.0.lock().unwrap()[&id].path.clone();
        append(&state, id.clone(), BASE64.encode(&bytes[224..index])).unwrap();
        let destination = source.with_file_name(format!("{}-saved.avi", id));
        finish(
            &state,
            id,
            destination.to_string_lossy().into(),
            bytes[..224].to_vec(),
            bytes[index..].to_vec(),
        )
        .unwrap();
        assert_eq!(std::fs::read(&destination).unwrap(), bytes);
        assert!(!source.exists());
        std::fs::remove_file(destination).unwrap();
    }

    fn pending_fixture() -> (VideoExports, String, PathBuf, Vec<u8>) {
        let state = VideoExports::default();
        let id = start(&state).unwrap();
        append(&state, id.clone(), BASE64.encode([1, 2, 3, 4])).unwrap();
        let path = state.0.lock().unwrap()[&id].path.clone();
        let mut header = vec![0; 224];
        header[..4].copy_from_slice(b"RIFF");
        (state, id, path, header)
    }

    #[test]
    fn mp4_success_publishes_then_removes_avi() {
        let (state, id, source, header) = pending_fixture();
        let destination = source.with_extension("MP4");
        finish_with(
            &state,
            id,
            destination.to_string_lossy().into(),
            header,
            b"idx1".to_vec(),
            |input, output| {
                let bytes = std::fs::read(input).unwrap();
                assert!(bytes.starts_with(b"RIFF"));
                assert!(bytes.ends_with(b"idx1"));
                std::fs::write(output, b"test mp4").map_err(error)
            },
        )
        .unwrap();
        assert!(!source.exists());
        assert_eq!(std::fs::read(&destination).unwrap(), b"test mp4");
        std::fs::remove_file(destination).unwrap();
    }

    #[test]
    fn mp4_failure_keeps_finalized_avi_even_after_cancel_and_preserves_destination() {
        let (state, id, source, header) = pending_fixture();
        let destination = source.with_extension("mp4");
        std::fs::write(&destination, b"previous export").unwrap();
        let mut partial = PathBuf::new();
        let result = finish_with(
            &state,
            id.clone(),
            destination.to_string_lossy().into(),
            header,
            b"idx1".to_vec(),
            |_, output| {
                partial = output.to_path_buf();
                std::fs::write(output, b"partial").unwrap();
                Err("conversion failed".into())
            },
        );
        assert!(result.unwrap_err().contains(source.to_str().unwrap()));
        cancel(&state, id).unwrap();
        let bytes = std::fs::read(&source).unwrap();
        assert!(bytes.starts_with(b"RIFF") && bytes.ends_with(b"idx1"));
        assert!(!partial.exists());
        assert_eq!(std::fs::read(&destination).unwrap(), b"previous export");
        std::fs::remove_file(source).unwrap();
        std::fs::remove_file(destination).unwrap();
    }

    #[test]
    fn missing_converter_empty_output_and_publish_failure_keep_avi() {
        for failure in ["missing", "empty", "publish"] {
            let (state, id, source, header) = pending_fixture();
            let destination = source.with_extension("mp4");
            if failure == "publish" {
                std::fs::create_dir(&destination).unwrap();
            }
            let result = finish_with(
                &state,
                id,
                destination.to_string_lossy().into(),
                header,
                b"idx1".to_vec(),
                |input, output| match failure {
                    "missing" => {
                        convert_mp4(Path::new("/missing-viaspania-converter"), input, output)
                    }
                    "empty" => Ok(()),
                    _ => std::fs::write(output, b"mp4").map_err(error),
                },
            );
            assert!(result.unwrap_err().contains(source.to_str().unwrap()));
            assert!(source.exists());
            std::fs::remove_file(source).unwrap();
            if failure == "publish" {
                std::fs::remove_dir(destination).unwrap();
            }
        }
    }

    #[test]
    #[ignore = "requires pnpm video:prepare; run cargo test real_mp4 -- --ignored"]
    fn real_mp4_preserves_resolution_fps_frames_and_has_no_audio() {
        let root = Path::new(env!("CARGO_MANIFEST_DIR"));
        let converter = root.join("resources/video/ffmpeg");
        let probe = root.join("../release/video/build/FFmpeg/ffmpeg-8.0.1/ffprobe");
        let fixture = root.join("tests/fixtures/video-32x24-24fps.avi");
        let bytes = std::fs::read(&fixture).unwrap();
        let index = bytes.windows(4).rposition(|v| v == b"idx1").unwrap();
        let state = VideoExports::default();
        let id = start(&state).unwrap();
        let source = state.0.lock().unwrap()[&id].path.clone();
        append(&state, id.clone(), BASE64.encode(&bytes[224..index])).unwrap();
        let destination = source.with_extension("mp4");
        finish_with(
            &state,
            id,
            destination.to_string_lossy().into(),
            bytes[..224].to_vec(),
            bytes[index..].to_vec(),
            |input, output| convert_mp4(&converter, input, output),
        )
        .unwrap();
        assert!(!source.exists());
        let inspect = |path: &Path| -> serde_json::Value {
            let output = Command::new(&probe)
                .args(["-v", "error", "-show_streams", "-of", "json"])
                .arg(path)
                .output()
                .unwrap();
            assert!(output.status.success());
            serde_json::from_slice(&output.stdout).unwrap()
        };
        let original = inspect(&fixture);
        let mp4 = inspect(&destination);
        assert_eq!(mp4["streams"].as_array().unwrap().len(), 1);
        let video = &mp4["streams"][0];
        assert_eq!(video["codec_name"], "h264");
        assert_eq!(video["pix_fmt"], "yuv420p");
        let encoded = std::fs::read(&destination).unwrap();
        assert!(encoded.windows(b"crf=20.0".len()).any(|w| w == b"crf=20.0"));
        for field in [
            "width",
            "height",
            "r_frame_rate",
            "avg_frame_rate",
            "nb_frames",
            "duration",
        ] {
            assert_eq!(video[field], original["streams"][0][field], "{field}");
        }
        std::fs::remove_file(destination).unwrap();

        // A real decoder failure must retain the source, including after UI cleanup.
        let (state, id, source, header) = pending_fixture();
        let destination = source.with_extension("mp4");
        let failure = finish_with(
            &state,
            id.clone(),
            destination.to_string_lossy().into(),
            header,
            b"idx1".to_vec(),
            |input, output| convert_mp4(&converter, input, output),
        )
        .unwrap_err();
        cancel(&state, id).unwrap();
        assert!(failure.contains(source.to_str().unwrap()));
        assert!(source.exists());
        assert!(!destination.exists());
        std::fs::remove_file(source).unwrap();
    }
}
