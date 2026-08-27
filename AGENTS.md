# ViaSpania engineering guide

## Structure
- `src/components`: React UI and OpenLayers maps.
- `src/core`: framework-free geographic, import and routing logic.
- `src/services`: remote-service adapters and metadata parsing.
- `docs`: architecture, decisions and scientific notes.
- `public/fixtures`: captured service capabilities for deterministic tests.

## Commands
- Development: `pnpm dev`
- Unit tests: `pnpm test`
- Production web build: `pnpm build`
- Preview: `pnpm preview`
- Native development: `pnpm desktop:dev`
- macOS bundle: `pnpm desktop:build`
- Rust tests: `cargo test --manifest-path src-tauri/Cargo.toml`

## Conventions
Use strict TypeScript, immutable data at module boundaries, WGS84 for persisted point coordinates and metres for graph distances. Keep remote providers behind adapters. Never add a scientific equation without its unit and citation. Do not invent unavailable terrain, access or land-cover data.

## Done means
The feature performs real work, has tests for its pure logic, exposes errors in Spanish, preserves attributions, and passes `pnpm test` plus `pnpm build`. A control wired only to mock data is not complete.

## Verification
Test pure modules locally. Keep network tests opt-in; use checked-in capability fixtures for routine tests. Verify live endpoints manually before a release. Native GeoTIFF work additionally requires Rust, GDAL and PROJ.
