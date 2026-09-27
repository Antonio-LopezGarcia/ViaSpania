use crate::NativeError;
use std::{
    cell::RefCell,
    collections::HashMap,
    io::Read,
    process::{Child, Command, Output, Stdio},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex, OnceLock,
    },
    time::Duration,
};
type Token = Arc<AtomicBool>;
static TOKENS: OnceLock<Mutex<HashMap<String, Token>>> = OnceLock::new();
thread_local! {static CURRENT:RefCell<Option<Token>>=const{RefCell::new(None)};}
pub fn token(id: Option<&str>) -> Option<Token> {
    id.map(|id| {
        TOKENS
            .get_or_init(Default::default)
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .entry(id.to_owned())
            .or_default()
            .clone()
    })
}
#[tauri::command]
pub fn cancel_calculation(calculation_id: String) {
    if let Some(token) = token(Some(&calculation_id)) {
        token.store(true, Ordering::Relaxed)
    }
}
#[tauri::command]
pub fn release_calculation(calculation_id: String) {
    TOKENS
        .get_or_init(Default::default)
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .remove(&calculation_id);
}
pub fn check() -> Result<(), NativeError> {
    if CURRENT.with(|current| {
        current
            .borrow()
            .as_ref()
            .is_some_and(|token| token.load(Ordering::Relaxed))
    }) {
        Err(NativeError::CalculationCancelled)
    } else {
        Ok(())
    }
}
pub fn run<T>(
    token: Option<Token>,
    work: impl FnOnce() -> Result<T, NativeError>,
) -> Result<T, NativeError> {
    struct Restore(Option<Token>);
    impl Drop for Restore {
        fn drop(&mut self) {
            CURRENT.with(|current| {
                current.replace(self.0.take());
            });
        }
    }
    let _restore = Restore(CURRENT.with(|current| current.replace(token)));
    check()?;
    let result = work()?;
    check()?;
    Ok(result)
}
// Drain both pipes concurrently: GDAL output must not block cancellation or fill a pipe.
pub fn wait(mut child: Child) -> std::io::Result<Output> {
    let stdout = child.stdout.take();
    let stderr = child.stderr.take();
    let out = std::thread::spawn(move || {
        let mut bytes = Vec::new();
        if let Some(mut stream) = stdout {
            stream.read_to_end(&mut bytes)?;
        }
        Ok::<_, std::io::Error>(bytes)
    });
    let err = std::thread::spawn(move || {
        let mut bytes = Vec::new();
        if let Some(mut stream) = stderr {
            stream.read_to_end(&mut bytes)?;
        }
        Ok::<_, std::io::Error>(bytes)
    });
    let status = loop {
        if check().is_err() {
            let _ = child.kill();
            let _ = child.wait();
            let _ = out.join();
            let _ = err.join();
            return Err(std::io::Error::new(
                std::io::ErrorKind::Interrupted,
                "Cálculo cancelado",
            ));
        }
        match child.try_wait() {
            Ok(Some(status)) => break status,
            Ok(None) => std::thread::sleep(Duration::from_millis(25)),
            Err(error) => {
                let _ = child.kill();
                let _ = child.wait();
                let _ = out.join();
                let _ = err.join();
                return Err(error);
            }
        }
    };
    let stdout = out
        .join()
        .map_err(|_| std::io::Error::other("Error leyendo GDAL"))??;
    let stderr = err
        .join()
        .map_err(|_| std::io::Error::other("Error leyendo GDAL"))??;
    Ok(Output {
        status,
        stdout,
        stderr,
    })
}
pub trait CancellableOutput {
    fn cancellable_output(&mut self) -> std::io::Result<Output>;
}
impl CancellableOutput for Command {
    fn cancellable_output(&mut self) -> std::io::Result<Output> {
        if check().is_err() {
            return Err(std::io::Error::new(
                std::io::ErrorKind::Interrupted,
                "Cálculo cancelado",
            ));
        }
        wait(self.stdout(Stdio::piped()).stderr(Stdio::piped()).spawn()?)
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn cancellation_before_start_and_next_job() {
        let id = "cancel-test";
        cancel_calculation(id.into());
        assert!(run(token(Some(id)), || Ok(())).is_err());
        assert!(run(token(Some("next-test")), || Ok(())).is_ok());
        assert!(check().is_ok());
        release_calculation(id.into());
        release_calculation("next-test".into());
    }
    #[test]
    fn running_job_observes_cancel() {
        let id = "running-test";
        let token = token(Some(id));
        run(token, || {
            assert!(check().is_ok());
            cancel_calculation(id.into());
            assert!(check().is_err());
            Ok(())
        })
        .unwrap_err();
        release_calculation(id.into());
    }
    #[cfg(unix)]
    #[test]
    fn interrupts_external_processing() {
        let id = "child-test";
        let token = token(Some(id));
        let cancel = std::thread::spawn(move || {
            std::thread::sleep(Duration::from_millis(100));
            cancel_calculation(id.into())
        });
        let start = std::time::Instant::now();
        let result = run(token, || {
            Command::new("sleep")
                .arg("10")
                .cancellable_output()
                .map_err(|e| NativeError::Gdal(e.to_string()))
        });
        cancel.join().unwrap();
        assert!(result.is_err());
        assert!(start.elapsed() < Duration::from_secs(2));
        release_calculation(id.into());
    }
}
