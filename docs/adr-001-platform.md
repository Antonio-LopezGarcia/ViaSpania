# ADR-001 — staged Tauri architecture

Status: accepted. React/OpenLayers is implemented first with pure testable domain modules. Tauri 2/Rust remains the desktop boundary. This keeps the product executable while the absent Rust/GDAL/PROJ toolchain is resolved and avoids pretending browser code can safely process production rasters.
