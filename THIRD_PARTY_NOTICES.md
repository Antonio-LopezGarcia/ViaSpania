# ViaSpania third-party notices

ViaSpania
Copyright © 2026 Antonio López García, Universidad de Granada
Este programa se distribuye bajo la licencia GPL-3.0-only.

Esta declaración se aplica al código original de ViaSpania. Los componentes de terceros y los datos conservan sus respectivos copyrights, licencias y condiciones. El logotipo y los assets gráficos originales de ViaSpania mantienen copyright separado, con permiso de reproducción del logotipo según docs/ASSETS.md (incluido como compliance/ASSETS.txt en la distribución); los símbolos institucionales conservan sus condiciones propias.

Inventory reviewed on 7 September 2026 for ViaSpania 0.2.1. The JavaScript list comes from `pnpm licenses list --prod` against the installed production graph. The native list comes from `cargo tree --target <release-target> --edges normal,build --offline` and `Cargo.lock`. Build-only test and development tools are excluded from the application credits.

This file is a component index, not a replacement for the licence texts supplied by each project. Copyright and licence notices remain the property of their authors.

## Browser runtime included in the production bundle

- BSD-2-Clause: OpenLayers (`ol`).
- BSD-3-Clause: `pbf`.
- ISC: `earcut`, `quickselect`.
- Apache-2.0: `lerc`, `web-worker`.
- Apache-2.0 OR MIT: `@tauri-apps/api`.
- MIT OR Apache-2.0: `@tauri-apps/plugin-dialog`.
- MPL-2.0 OR Apache-2.0: DOMPurify.
- MIT AND Zlib: `pako`.
- MIT AND BSD-3-Clause: `zstddec`.
- CC0-1.0: `xml-utils`.
- MIT: React, React DOM, Scheduler, Three.js, jsPDF, GeoTIFF.js, html2canvas, canvg, core-js, fflate, fast-png, iobuffer, numcodecs, zarrita, `@zarrita/storage`, `@babel/runtime`, `@petamoriken/float16`, `@types/pako`, `@types/raf`, `@types/rbush`, `@types/trusted-types`, `base64-arraybuffer`, `css-line-break`, `parse-headers`, `performance-now`, `protocol-buffers-schema`, `quick-lru`, `raf`, `rbush`, `reference-spec-reader`, `regenerator-runtime`, `resolve-protobuf-schema`, `rgbcolor`, `stackblur-canvas`, `svg-pathdata`, `text-segmentation`, `unzipit`, and `utrie`.

Versions are fixed by `pnpm-lock.yaml`; the installed audit found React 19.2.8, OpenLayers 10.10.0, Three.js 0.185.1 and jsPDF 4.2.1. Vite, TypeScript, Vitest, Testing Library, jsdom and type-only Three.js/React packages are development inputs and are not represented as runtime components unless a later bundle audit proves otherwise.

## Native runtime

The desktop application includes Tauri and its platform runtime, Dialog and Filesystem plugins, Tokio, Reqwest/rustls, Serde/Serde JSON, Futures, URL, UUID, Base64 and Thiserror, with their target-specific transitive crates. These crates are predominantly licensed under MIT, Apache-2.0, or a choice of those licences. Exact versions and the complete target graph are fixed by `src-tauri/Cargo.lock`; target-specific review must be regenerated for every release target because macOS, Windows and Linux include different window-system crates.

## Selección de licencia de las dependencias directas Rust

Decisión de distribución · 8 de septiembre de 2026: ViaSpania utiliza **MIT** para las once crates directas indicadas. Se ejerce una opción concedida por sus titulares; no se modifica ni se sustituye la licencia original de terceros. Verificado contra las versiones de `src-tauri/Cargo.lock`, el `Cargo.toml` normalizado y el texto MIT de cada paquete.

Tokio 1.53.1 declara MIT, no Apache-2.0. Las otras diez crates ofrecen MIT y Apache-2.0 como alternativas. Apache-2.0 también es compatible con GPLv3; elegir MIT sigue la política solicitada, no corrige una incompatibilidad de Apache-2.0. Los features `derive`, `rustls-tls`, `stream` o `v4` no relicencian las dependencias que activan.

La selección se limita a estas identidades nombre-versión. No convierte en MIT a rustls/ring, serde_derive, tauri-build, plugins transitivos ni al resto de Cargo.lock. Sus avisos y las obligaciones acumulativas se conservan. Tampoco constituye el cierre de las revisiones pendientes de la auditoría completa.

| Crate | Versión resuelta | Licencia original verificada | Opción utilizada | Evidencia |
| --- | --- | --- | --- | --- |
| base64 | 0.22.1 | MIT OR Apache-2.0 | MIT | Cargo.toml y `LICENSE-MIT` del paquete; SHA-256 del texto `0dd882e53de11566d50f8e8e2d5a651bcf3fabee4987d70f306233cf39094ba7` |
| futures-util | 0.3.34 | MIT OR Apache-2.0 | MIT | Cargo.toml y `LICENSE-MIT` del paquete; SHA-256 del texto `6652c868f35dfe5e8ef636810a4e576b9d663f3a17fb0f5613ad73583e1b88fd` |
| reqwest | 0.12.28 | MIT OR Apache-2.0 | MIT | Cargo.toml y `LICENSE-MIT` del paquete; SHA-256 del texto `47d4e1803702728e03d30f8a848ae2249ba274bbd9f8443e803f7924d83cd371` |
| serde | 1.0.229 | MIT OR Apache-2.0 | MIT | Cargo.toml y `LICENSE-MIT` del paquete; SHA-256 del texto `23f18e03dc49df91622fe2a76176497404e46ced8a715d9d2b67a7446571cca3` |
| serde_json | 1.0.151 | MIT OR Apache-2.0 | MIT | Cargo.toml y `LICENSE-MIT` del paquete; SHA-256 del texto `23f18e03dc49df91622fe2a76176497404e46ced8a715d9d2b67a7446571cca3` |
| tauri | 2.11.5 | Apache-2.0 OR MIT | MIT | Cargo.toml y `LICENSE_MIT` del paquete; SHA-256 del texto `9dd42ea92cff2ede5cd477cbfcce051b2d0115c0ac7f368ee88cb545055dff1d` |
| tauri-plugin-dialog | 2.7.2 | Apache-2.0 OR MIT | MIT | Cargo.toml y `LICENSE_MIT` del paquete; SHA-256 del texto `89ff9689dcf9dd53968785d05a26f7898bb169dbfcada8d032b3e68cf0d55607` |
| thiserror | 2.0.20 | MIT OR Apache-2.0 | MIT | Cargo.toml y `LICENSE-MIT` del paquete; SHA-256 del texto `23f18e03dc49df91622fe2a76176497404e46ced8a715d9d2b67a7446571cca3` |
| tokio | 1.53.1 | MIT | MIT | Cargo.toml y `LICENSE` del paquete; SHA-256 del texto `253cd04c6714889df2d32f3f64d669179a1c95c76ac43c40882c52eb06bc3552` |
| url | 2.5.8 | MIT OR Apache-2.0 | MIT | Cargo.toml y `LICENSE-MIT` del paquete; SHA-256 del texto `b38f11f6096706e6de553dabe2a7ed142d59b6fa8c97e290c67496154745cdd5` |
| uuid | 1.24.1 | Apache-2.0 OR MIT | MIT | Cargo.toml y `LICENSE-MIT` del paquete; SHA-256 del texto `436bc5a105d8e57dcd8778730f3754f7bf39c14d2f530e4cde4bd2d17a83ec3d` |

## Bundled geospatial runtime

Desktop packages include GDAL, PROJ, their command-line utilities, projection databases and the non-system dynamic libraries discovered by the platform packaging scripts. GDAL is MIT/X style and PROJ is MIT, but each dynamically bundled library retains its own terms. The release package must contain the copied licence files and `geospatial/THIRD_PARTY_MANIFEST.txt`. A release is not compliant when a non-system binary appears in that manifest without a corresponding notice.

Unused GDAL logos and icons are excluded from the prepared runtime. ViaSpania's `VS` application icon and interface SVG symbols are original project assets. MICIU/EU/AEI funding logos are bundled solely to acknowledge the original funding, under the applicable institutional guidelines; they do not imply endorsement of other products. ViaSpania embeds no font files; it uses operating-system font families.

## Data and network services

- **GeoNames search service and data:** © GeoNames, Creative Commons Attribution 4.0. GeoNames requires credit when its data or web services are used. <https://www.geonames.org/export/>
- **OpenStreetMap:** © OpenStreetMap contributors. Data is available under ODbL 1.0. <https://www.openstreetmap.org/copyright>
- **IGN/CNIG services and products:** © Instituto Geográfico Nacional de España. IGN geographic information, including PNOA, current and historical cartography, MDT, MDS, administrative boundaries and settlement data, is reused under the IGN terms compatible with CC BY 4.0. Derived exports must identify that they are derived where applicable. <https://www.ign.es/web/ign/portal/politica-datos>
- **Copernicus Land Monitoring Service VHR 2021:** European Union's Copernicus Land Monitoring Service information. Redistributed or derived images must identify the source and must not imply EU endorsement. <https://land.copernicus.eu/en/data-policy>
- **Copernicus DEM GLO-30:** for adapted output, use: “Produced using Copernicus WorldDEM-30 © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018 provided under COPERNICUS by the European Union and ESA; all rights reserved”. <https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM>

External XYZ, WMS and WMTS layers configured by a user are not supplied by ViaSpania. Their configured attribution is preserved in the viewer and exports; the user remains responsible for entering the provider's required wording.

## Methodological acknowledgement

ViaSpania acknowledges Gianmarco Alberti's R package `movecost` as a methodological reference. The package is not included or executed by ViaSpania and its GPL licence does not describe ViaSpania's independently implemented code.

## Textos MIT de las once dependencias directas Rust

Se reproducen los textos originales sin inventar titulares cuando el propio archivo no incluye una línea de copyright. Deben conservarse además los avisos particulares de los fuentes incorporados. Este apéndice no sustituye los avisos del resto de dependencias.

### base64 0.22.1 — MIT

Fuente: https://static.crates.io/crates/base64/base64-0.22.1.crate · Archivo: `LICENSE-MIT`

```text
The MIT License (MIT)

Copyright (c) 2015 Alice Maz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### futures-util 0.3.34 — MIT

Fuente: https://static.crates.io/crates/futures-util/futures-util-0.3.34.crate · Archivo: `LICENSE-MIT`

```text
Copyright (c) 2016 Alex Crichton
Copyright (c) 2017 The Tokio Authors

Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```

### reqwest 0.12.28 — MIT

Fuente: https://static.crates.io/crates/reqwest/reqwest-0.12.28.crate · Archivo: `LICENSE-MIT`

```text
Copyright (c) 2016-2025 Sean McArthur

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### serde 1.0.229 — MIT

Fuente: https://static.crates.io/crates/serde/serde-1.0.229.crate · Archivo: `LICENSE-MIT`

```text
Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```

### serde_json 1.0.151 — MIT

Fuente: https://static.crates.io/crates/serde_json/serde_json-1.0.151.crate · Archivo: `LICENSE-MIT`

```text
Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```

### tauri 2.11.5 — MIT

Fuente: https://static.crates.io/crates/tauri/tauri-2.11.5.crate · Archivo: `LICENSE_MIT`

```text
MIT License

Copyright (c) 2017 - Present Tauri Apps Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### tauri-plugin-dialog 2.7.2 — MIT

Fuente: https://static.crates.io/crates/tauri-plugin-dialog/tauri-plugin-dialog-2.7.2.crate · Archivo: `LICENSE_MIT`

```text
MIT License

Copyright (c) 2017 - Present Tauri Apps Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### thiserror 2.0.20 — MIT

Fuente: https://static.crates.io/crates/thiserror/thiserror-2.0.20.crate · Archivo: `LICENSE-MIT`

```text
Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```

### tokio 1.53.1 — MIT

Fuente: https://static.crates.io/crates/tokio/tokio-1.53.1.crate · Archivo: `LICENSE`

```text
MIT License

Copyright (c) Tokio Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### url 2.5.8 — MIT

Fuente: https://static.crates.io/crates/url/url-2.5.8.crate · Archivo: `LICENSE-MIT`

```text
Copyright (c) 2013-2025 The rust-url developers

Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```

### uuid 1.24.1 — MIT

Fuente: https://static.crates.io/crates/uuid/uuid-1.24.1.crate · Archivo: `LICENSE-MIT`

```text
Copyright (c) 2014 The Rust Project Developers
Copyright (c) 2018 Ashley Mannix, Christopher Armstrong, Dylan DPC, Hunar Roop Kahlon

Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```


# Selección de licencias de los nueve componentes pendientes

Se utiliza MIT siempre que está ofrecida. Esta elección no sustituye la licencia del titular, no elimina licencias de archivos incorporados y no cambia las dependencias.

| Componente | Versión | Licencia utilizada | Evidencia y obligaciones |
| --- | --- | --- | --- |
| @napi-rs/lzma-linux-x64-gnu | 1.5.1 | MIT | package.json del archivo fijado por el lockfile. Conservar avisos disponibles y texto MIT. Herramienta para Linux. |
| lerc | 3.0.0 | Apache-2.0 | package.json y cabecera LercDecode.js: copyright 2015–2021 Esri. Conservar copyright, licencia y avisos; señalar modificaciones si se hacen. MIT no está ofrecida. |
| stackback | 0.0.2 | MIT; además BSD-3-Clause para formatstack.js | package.json declara MIT. formatstack.js conserva el aviso completo de V8 de 2012, las tres condiciones BSD y su disclaimer. No se aplica MIT en sustitución de BSD al archivo de V8. |
| libappindicator-sys | 0.9.0 | MIT | Cargo.toml/Cargo.toml.orig ofrecen Apache-2.0 OR MIT. No cambia la licencia de la biblioteca nativa appindicator ni acredita el bundle Linux. |
| r-efi | 5.3.0 | MIT | Cargo.toml ofrece tres alternativas; AUTHORS contiene el texto MIT y avisos originales. |
| r-efi | 6.0.0 | MIT | Igual comprobación sobre el archivo exacto de esta versión. |
| selectors | 0.36.1 | MPL-2.0, combinación GPL-3.0-only mediante §3.3 | Cargo.toml y cabeceras MPL. No se encontraron avisos de incompatibilidad con licencias secundarias en los archivos fuente inspeccionados. Se mantienen los archivos y avisos MPL; el conjunto puede combinarse por §3.3. No se sustituye unilateralmente MPL por MIT o GPL. Conservar y ofrecer sus fuentes, incluidas modificaciones si las hubiera. |
| winapi-i686-pc-windows-gnu | 0.4.0 | MIT | Cargo.toml usa la notación histórica MIT/Apache-2.0; las cabeceras de build.rs y src/lib.rs confirman expresamente que son alternativas a elección del receptor. Conservar copyright de winapi-rs developers. |
| winapi-x86_64-pc-windows-gnu | 0.4.0 | MIT | Mismas declaraciones verificadas en el archivo exacto de esta variante. |

## Qué se ha resuelto

La ausencia de un archivo llamado LICENSE no implica ausencia de una licencia: se ha comprobado la declaración dentro de cada paquete, sus cabeceras y, en r-efi, AUTHORS. Se han añadido los textos estándar de las licencias declaradas desde SPDX y las declaraciones/avisos originales por separado. No se presenta un texto estándar como si se hubiera encontrado un LICENSE original que el paquete no contiene. Los campos genéricos del texto SPDX no se rellenan inventando titulares o fechas. La identidad de un autor en package.json no se convierte por inferencia en titular de copyright.

`LICENSE_SELECTIONS.json` fija cada decisión a la declaración original, versión, SHA-256 del archivo original y evidencia. El colector rechaza una decisión si cambia el archivo o si la opción no está ofrecida. `license-evidence/` conserva textos, cabeceras y declaraciones. Las fuentes originales completas siguen en el expediente; los extractos documentales no las reemplazan.

Con ello quedan resueltas las nueve faltas de texto/selección del control, con obligaciones de conservación. **No significa que se hayan resuelto las otras cinco revisiones de la distribución**, ni que se haya demostrado todo el código fuente correspondiente de los binarios nativos.

## Referencias oficiales

- [MIT en SPDX](https://spdx.org/licenses/MIT.html).
- [Apache: compatibilidad con GPLv3](https://www.apache.org/licenses/GPL-compatibility).
- [Mozilla: combinación de MPL con GPL](https://www.mozilla.org/en-US/MPL/2.0/combining-mpl-and-gpl/).
- [MPL-2.0, especialmente §§1.5, 1.12 y 3.3](https://www.mozilla.org/en-US/MPL/2.0/).

Los textos estándar conservados proceden de los JSON oficiales `spdx/license-list-data/json/details/{MIT,Apache-2.0,MPL-2.0}.json`; sus copias locales están sujetas a los hashes de entrada del expediente.
