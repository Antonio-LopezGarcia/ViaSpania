//! Keep GDAL's WCS grid handling, but use the application's rustls HTTP client
//! for every WCS request. The bundled Linux libcurl intermittently fails before
//! receiving an HTTP status from the IGN services (including DescribeCoverage).
use super::NativeError;
use reqwest::{blocking::Client, header::CONTENT_TYPE, StatusCode, Url};
use std::{
    io::{Read, Write},
    net::{TcpListener, TcpStream},
    process::Command,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    time::Duration,
};

const MAX_RESPONSE_BYTES: u64 = 64 * 1024 * 1024;
const MAX_ATTEMPTS: u32 = 5;

pub(super) fn bypass_proxy_for_loopback(command: &mut Command) {
    let existing = ["NO_PROXY", "no_proxy"]
        .iter()
        .filter_map(|key| std::env::var(key).ok())
        .filter(|value| !value.is_empty())
        .collect::<Vec<_>>()
        .join(",");
    let value = if existing.is_empty() {
        "127.0.0.1,localhost".to_owned()
    } else {
        format!("127.0.0.1,localhost,{existing}")
    };
    command.env("NO_PROXY", &value).env("no_proxy", value);
}

pub(super) struct WcsRelay {
    service_url: String,
    stopped: Arc<AtomicBool>,
    last_error: Arc<Mutex<Option<String>>>,
}

impl WcsRelay {
    pub(super) fn start(endpoint: &str) -> Result<Self, NativeError> {
        let upstream =
            Url::parse(endpoint).map_err(|error| NativeError::Network(error.to_string()))?;
        if upstream.scheme() != "https" {
            return Err(NativeError::Network(
                "El servicio WCS debe usar HTTPS".into(),
            ));
        }
        Self::start_with_url(upstream)
    }

    fn start_with_url(upstream: Url) -> Result<Self, NativeError> {
        let client = Client::builder()
            .http1_only()
            .pool_max_idle_per_host(0)
            .connect_timeout(Duration::from_secs(15))
            .timeout(Duration::from_secs(120))
            .build()
            .map_err(|error| NativeError::Network(error.to_string()))?;
        let listener = TcpListener::bind("127.0.0.1:0")
            .map_err(|error| NativeError::Network(error.to_string()))?;
        listener
            .set_nonblocking(true)
            .map_err(|error| NativeError::Network(error.to_string()))?;
        let address = listener
            .local_addr()
            .map_err(|error| NativeError::Network(error.to_string()))?;
        let stopped = Arc::new(AtomicBool::new(false));
        let signal = stopped.clone();
        let last_error = Arc::new(Mutex::new(None));
        let diagnostic = last_error.clone();
        std::thread::Builder::new()
            .name("viaspania-wcs-relay".into())
            .spawn(move || {
                while !signal.load(Ordering::SeqCst) {
                    match listener.accept() {
                        Ok((stream, _)) => {
                            handle_connection(stream, &client, &upstream, &signal, &diagnostic)
                        }
                        Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                            std::thread::sleep(Duration::from_millis(50));
                        }
                        Err(_) => break,
                    }
                }
            })
            .map_err(|error| NativeError::Network(error.to_string()))?;
        Ok(Self {
            service_url: format!("http://{address}/?"),
            stopped,
            last_error,
        })
    }

    pub(super) fn service_url(&self) -> &str {
        &self.service_url
    }

    pub(super) fn explain(&self, error: NativeError) -> NativeError {
        match (
            error,
            self.last_error.lock().ok().and_then(|value| value.clone()),
        ) {
            (NativeError::Gdal(message), Some(cause)) => {
                NativeError::Gdal(format!("{message}. {cause}"))
            }
            (error, _) => error,
        }
    }
}

impl Drop for WcsRelay {
    fn drop(&mut self) {
        // A cancelled GDAL child must be reaped immediately. The relay thread
        // finishes its bounded in-flight request and then observes this flag.
        self.stopped.store(true, Ordering::SeqCst);
    }
}

fn handle_connection(
    mut stream: TcpStream,
    client: &Client,
    upstream: &Url,
    stopped: &AtomicBool,
    last_error: &Mutex<Option<String>>,
) {
    // Accepted sockets may inherit the nonblocking mode of the listener.
    // A full GeoTIFF block exceeds the socket buffer and must finish writing.
    let _ = stream.set_nonblocking(false);
    let _ = stream.set_read_timeout(Some(Duration::from_secs(10)));
    let _ = stream.set_write_timeout(Some(Duration::from_secs(30)));
    let response = match read_request_target(&mut stream) {
        Ok(target) => fetch(client, upstream, &target, stopped),
        Err(message) => Err((400, message)),
    };
    if let Ok(mut diagnostic) = last_error.lock() {
        *diagnostic = match &response {
            Ok((status, _, _)) if *status >= 400 => Some(format!(
                "El servicio WCS {} devolvió HTTP {status}",
                upstream.host_str().unwrap_or_default()
            )),
            Err((_, message)) => Some(message.clone()),
            _ => None,
        };
    }
    let (status, content_type, body) = match response {
        Ok(value) => value,
        Err((status, message)) => (status, "text/plain".into(), message.into_bytes()),
    };
    let reason = StatusCode::from_u16(status)
        .ok()
        .and_then(|value| value.canonical_reason())
        .unwrap_or("Error");
    let header = format!("HTTP/1.1 {status} {reason}\r\nContent-Type: {content_type}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n", body.len());
    if stream.write_all(header.as_bytes()).is_ok() {
        let _ = stream.write_all(&body);
    }
}

fn read_request_target(stream: &mut TcpStream) -> Result<String, String> {
    let mut header = Vec::new();
    let mut byte = [0_u8; 1];
    while header.len() < 16_384 {
        stream
            .read_exact(&mut byte)
            .map_err(|error| error.to_string())?;
        header.push(byte[0]);
        if header.ends_with(b"\r\n\r\n") {
            break;
        }
    }
    if !header.ends_with(b"\r\n\r\n") {
        return Err("Cabecera WCS demasiado larga".into());
    }
    let request = std::str::from_utf8(&header).map_err(|error| error.to_string())?;
    let mut line = request
        .lines()
        .next()
        .unwrap_or_default()
        .split_whitespace();
    if line.next() != Some("GET") {
        return Err("La petición WCS debe ser GET".into());
    }
    let target = line.next().ok_or("Falta la ruta WCS")?;
    if !target.starts_with('/') || target.starts_with("//") || !target.is_ascii() {
        return Err("Ruta WCS no válida".into());
    }
    Ok(target.to_owned())
}

fn fetch(
    client: &Client,
    upstream: &Url,
    target: &str,
    stopped: &AtomicBool,
) -> Result<(u16, String, Vec<u8>), (u16, String)> {
    let query = target.split_once('?').map(|(_, query)| query).unwrap_or("");
    let mut url = upstream.clone();
    url.set_query(Some(query));
    let mut last_error = String::new();
    for attempt in 0..MAX_ATTEMPTS {
        if stopped.load(Ordering::SeqCst) {
            return Err((503, "Descarga WCS cancelada".into()));
        }
        match client.get(url.clone()).send() {
            Ok(mut response) => {
                let status = response.status();
                if matches!(status.as_u16(), 429 | 500 | 502 | 503 | 504)
                    && attempt + 1 < MAX_ATTEMPTS
                {
                    last_error = format!("El servicio WCS devolvió HTTP {}", status.as_u16());
                } else {
                    let content_type = response
                        .headers()
                        .get(CONTENT_TYPE)
                        .and_then(|value| value.to_str().ok())
                        .unwrap_or("application/octet-stream")
                        .to_owned();
                    let mut body = Vec::new();
                    match response
                        .by_ref()
                        .take(MAX_RESPONSE_BYTES + 1)
                        .read_to_end(&mut body)
                    {
                        Ok(_) if body.len() as u64 <= MAX_RESPONSE_BYTES => {
                            return Ok((status.as_u16(), content_type, body));
                        }
                        Ok(_) => return Err((502, "El bloque WCS supera 64 MB".into())),
                        Err(error) => {
                            last_error = format!("No se pudo leer el bloque WCS: {error}")
                        }
                    }
                }
            }
            Err(error) => last_error = format!("Error de conexión con el servicio WCS: {error}"),
        }
        if attempt + 1 < MAX_ATTEMPTS {
            std::thread::sleep(Duration::from_millis(500 * 2_u64.pow(attempt)));
        }
    }
    Err((502, last_error))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keeps_loopback_out_of_gdal_proxy() {
        let mut command = Command::new("gdalinfo");
        bypass_proxy_for_loopback(&mut command);
        assert!(command.get_envs().any(|(key, value)| {
            key == "NO_PROXY"
                && value
                    .unwrap()
                    .to_string_lossy()
                    .contains("127.0.0.1,localhost")
        }));
    }

    #[test]
    fn forwards_exact_wcs_query_and_retries_transient_response() {
        let upstream = TcpListener::bind("127.0.0.1:0").unwrap();
        let address = upstream.local_addr().unwrap();
        let server = std::thread::spawn(move || {
            for attempt in 0..2 {
                let (mut stream, _) = upstream.accept().unwrap();
                let target = read_request_target(&mut stream).unwrap();
                assert_eq!(
                    target,
                    "/mds?SERVICE=WCS&REQUEST=DescribeCoverage&COVERAGE=mds05"
                );
                let (status, body) = if attempt == 0 {
                    (503, "retry".to_owned())
                } else {
                    (200, "A".repeat(2_100_000))
                };
                let response = format!("HTTP/1.1 {status} OK\r\nContent-Length: {}\r\nContent-Type: text/xml\r\nConnection: close\r\n\r\n{body}", body.len());
                stream.write_all(response.as_bytes()).unwrap();
            }
        });
        let relay =
            WcsRelay::start_with_url(Url::parse(&format!("http://{address}/mds?")).unwrap())
                .unwrap();
        let response = Client::new()
            .get(format!(
                "{}SERVICE=WCS&REQUEST=DescribeCoverage&COVERAGE=mds05",
                relay.service_url()
            ))
            .send()
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(response.bytes().unwrap().len(), 2_100_000);
        server.join().unwrap();
    }

    #[test]
    fn rejects_non_https_public_endpoint() {
        assert!(WcsRelay::start("http://servicios.idee.es/wcs-inspire/mdt?").is_err());
    }
}
