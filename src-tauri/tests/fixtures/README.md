`video-32x24-24fps.avi` is an original ViaSpania test fixture (GPL-3.0-only),
with twelve identical 32 × 24 JPEG frames at 24 fps, no audio.
It was encoded with the unchanged `MjpegAviEncoder` in `src/core/mjpegAvi.ts`.
The image is a synthetic RGB gradient: R = x × 8, G = y × 10, B = (x + y) × 4.
No third-party imagery or data is used.

Native end-to-end verification (source-built converter and probe required):

```sh
pnpm video:prepare --network
cargo test --manifest-path src-tauri/Cargo.toml real_mp4 -- --ignored
```
