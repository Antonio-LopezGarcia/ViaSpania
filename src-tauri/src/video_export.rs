use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use std::{
    collections::HashMap,
    fs::{File, OpenOptions},
    io::{Seek, SeekFrom, Write},
    path::PathBuf,
    sync::Mutex,
};
use tauri::State;

const LIMIT: u64 = 1_500_000_000;
struct Pending {
    file: File,
    path: PathBuf,
}
impl Drop for Pending {
    fn drop(&mut self) {
        let _ = std::fs::remove_file(&self.path);
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
    let mut pending = Pending { file, path };
    pending.file.write_all(&[0; 224]).map_err(error)?;
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
    if session.file.metadata().map_err(error)?.len() + bytes.len() as u64 > LIMIT {
        return Err("El vídeo supera 1,5 GB. Reduzca duración o resolución.".into());
    }
    session.file.write_all(&bytes).map_err(error)
}
fn cancel(state: &VideoExports, id: String) -> Result<(), String> {
    if let Some(session) = state.0.lock().map_err(error)?.remove(&id) {
        let path = session.path.clone();
        drop(session);
        let _ = std::fs::remove_file(path);
    }
    Ok(())
}
fn finish(
    state: &VideoExports,
    id: String,
    path: String,
    header: Vec<u8>,
    index: Vec<u8>,
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
        session.file.write_all(&index).map_err(error)?;
        session.file.seek(SeekFrom::Start(0)).map_err(error)?;
        session.file.write_all(&header).map_err(error)?;
        session.file.flush().map_err(error)?;
        let destination = PathBuf::from(&path);
        if destination
            .extension()
            .and_then(|e| e.to_str())
            .is_none_or(|e| !e.eq_ignore_ascii_case("avi"))
        {
            return Err("Seleccione un archivo AVI".into());
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
            session.file.seek(SeekFrom::Start(0)).map_err(error)?;
            std::io::copy(&mut session.file, &mut output).map_err(error)?;
            output.sync_all().map_err(error)?;
            drop(output);
            std::fs::rename(&temporary, &destination).map_err(error)?;
            Ok(path)
        })();
        let _ = std::fs::remove_file(temporary);
        copy_result
    })();
    let temporary = session.path.clone();
    drop(session);
    let _ = std::fs::remove_file(temporary);
    result
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
pub fn video_export_finish(
    state: State<'_, VideoExports>,
    id: String,
    path: String,
    header: Vec<u8>,
    index: Vec<u8>,
) -> Result<String, String> {
    finish(&state, id, path, header, index)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn streams_more_than_old_limit_and_removes_temporary() {
        let state = VideoExports::default();
        let id = start(&state).unwrap();
        let temporary = {
            let mut map = state.0.lock().unwrap();
            let entry = map.get_mut(&id).unwrap();
            entry.file.set_len(100_000_001).unwrap();
            entry.file.seek(SeekFrom::End(0)).unwrap();
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
}
