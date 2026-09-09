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
