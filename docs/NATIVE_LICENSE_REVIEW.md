# Revisión del alcance de las licencias nativas: Kerberos

## Resultado y alcance

**PB-2 resuelto para el runtime macOS identificado en `native-evidence/REVIEW.json`: no se ha identificado una incompatibilidad residual de Kerberos que impida combinar este runtime con software GPLv3.** La conclusión está condicionada a conservar los avisos y las fuentes/licencias aplicables; no convierte Kerberos en MIT ni sustituye sus licencias.

Esta revisión cierra el problema residual de alcance señalado por la auditoría previa de los 85 proveedores nativos. No es una nueva certificación de todas las líneas de todos sus proyectos, ni cierra las revisiones separadas de datos y código fuente correspondiente. Tampoco se aplica a otro sistema operativo o a bibliotecas futuras.

## Identidad e integración reales

Las fuentes verificadas son `krb5-1.22.2.tar.gz`, obtenidas del servidor oficial, SHA-256 `3243ffbc8ea4d4ac22ddc7dd2a1dc54c57874c40648b60ff97009763554eaf13`. Coinciden con la receta Homebrew instalada conservada en el expediente. No se ha usado la licencia de una versión actual diferente.

El inventario y `otool -L` muestran esta cadena:

`gdalinfo → libgdal.39.dylib → libpq.5.dylib → libgssapi_krb5.2.2.dylib`

ViaSpania invoca GDAL mediante `Command`, como programa externo. GDAL sí enlaza dinámicamente bibliotecas del runtime; incluir Poppler GPLv3 en ese runtime hace relevante la compatibilidad de su combinación. El argumento de subprocess no se utiliza para ignorar ese segundo nivel de linking.

| Biblioteca incluida | Procedencia | Función/relación |
| --- | --- | --- |
| libgssapi_krb5.2.2.dylib | krb5 1.22.2 | GSSAPI utilizado por libpq; depende de las cuatro siguientes. |
| libkrb5.3.3.dylib | krb5 1.22.2 | Funciones cliente del protocolo Kerberos y perfiles. |
| libk5crypto.3.1.dylib | krb5 1.22.2 | Implementaciones criptográficas; este binario no declara dependencia de libcrypto OpenSSL. |
| libcom_err.3.0.dylib | krb5 1.22.2 | Tratamiento de errores. |
| libkrb5support.1.1.dylib | krb5 1.22.2 | Utilidades internas. |

Los UUID, SHA-256, enlaces y tablas `nm -m` completas de esas cinco bibliotecas se conservan en [native-evidence/REVIEW.json](native-evidence/REVIEW.json). El registro incluye hashes de todo el conjunto nativo para impedir reutilizar este cierre con otro runtime. El framework Kerberos de Apple al que referencia libkrb5 es una ruta del sistema, no una copia de ese framework incluida por ViaSpania.

## Hallazgos concretos

| Cuestión | Evidencia de esta versión | Conclusión |
| --- | --- | --- |
| Harvard / cláusula de publicidad | En las fuentes, las referencias a Harvard se localizan en el plugin KDB db2 y documentación asociada; `hash/hash_debug.c` contiene la cabecera relevante. Los Makefile de las cinco bibliotecas no incluyen el plugin db2. No hay plugin db2, libkdb, libkadm5, libgssrpc ni ejecutables kadmin/ksu en los 196 Mach-O empaquetados. | No se atribuye esta cláusula a las cinco bibliotecas cliente por estar en el NOTICE global. No se aplica a Harvard la retirada de cláusulas de otro titular. |
| NetBSD / strptime.c | `str_conv.c` incluye la implementación local únicamente si no existe HAVE_STRPTIME. `nm -m libkrb5` muestra `_strptime` **undefined, from libSystem**, y no una implementación local `my_strptime`. | El binario analizado utiliza la función del sistema; el fallback BSD de cuatro cláusulas no se observa incorporado. |
| NetBSD / k5-queue.h | NOTICE atribuye conjuntamente una sección antigua a este archivo y strptime.c. La cabecera real de `k5-queue.h` en 1.22.2 tiene copyright Regents de California y **BSD-3-Clause**, sin publicidad. Está referenciado por código de GSSAPI, cachés y utilidades. | El texto específico del archivo demuestra que no lleva la cláusula problemática citada globalmente. Se conserva tanto el NOTICE histórico como la cabecera real, sin editar el upstream. |
| Fallbacks BSD de getopt, getopt_long y mkstemp | Configure selecciona esos objetos cuando falta la función del sistema; los Makefile usan variables condicionales. Las tablas de las bibliotecas inspeccionadas no muestran las implementaciones de reemplazo `k5_getopt`, `k5_getopt_long` o `krb5int_mkstemp`. `daemon.c` está en apputils, fuera del grupo de objetos de las cinco bibliotecas. | No se ha encontrado una incorporación de esos fallbacks al conjunto inspeccionado. La conclusión es de este target, no de Windows u otro sistema. |
| OpenVision administrativo | NOTICE delimita su texto administrativo a kadmin, lib/kadm5 y porciones de lib/rpc. Esos productos no están en el runtime. | No se aplica automáticamente ese texto a todo lo que tenga copyright OpenVision. |
| OpenVision efectivamente incorporado | `lib/gssapi/generic/util_buffer.c` y `lib/krb5/krb/conv_creds.c` contienen permisos expresos para usar, copiar, modificar, distribuir y vender, conservando avisos y sin usar el nombre como respaldo. La tabla de GSSAPI contiene `_gssint_g_make_string_buffer`, vinculable al primer archivo. | Hay código OpenVision: no se oculta. Sus cabeceras permisivas son distintas del texto administrativo sobre derechos de derivados. Se conservan sus condiciones propias, sin etiquetarlas MIT por aproximación. |
| Otros avisos del cliente | Fuentes de crypto, GSSAPI, krb5, soporte, perfiles e includes contienen avisos MIT/BSD y permisos históricos específicos, entre otros. Los recordatorios de exportación y restricciones de uso de nombres no se presentan como una prohibición contractual de uso comercial ni se eliminan. | Se conserva el conjunto de avisos originales; no se identificó en esta revisión una cláusula adicional que impida la combinación GPLv3 de los objetos examinados. Las obligaciones legales de exportación no se certifican mediante una auditoría de licencias. |

## Fuentes oficiales y criterio jurídico utilizado

- [MIT: información oficial de licencias de Kerberos 1.22](https://web.mit.edu/kerberos/krb5-1.22/doc/mitK5license.html). Se contrastó con el NOTICE exacto del archivo 1.22.2, no solo con la web.
- [GNU: problema de la cláusula publicitaria BSD](https://www.gnu.org/philosophy/bsd.html). Que BSD-4-Clause pueda impedir una combinación GPL no permite concluir que todo el NOTICE de un proyecto afecte a cada binario.
- [NetBSD: licencias y redistribución](https://www.netbsd.org/about/redistribution.html). Distingue derechos de cada titular y autoriza actualizar archivos de cuatro cláusulas contribuidos a la Foundation. No se necesita usar esa autorización para justificar el strptime del sistema o la cabecera BSD-3 ya presente; tampoco se extrapola a Harvard.

## Obligaciones y material de distribución

1. Conservar el NOTICE original de Kerberos, copyrights, permisos y disclaimers. No reemplazarlo por un MIT genérico.
2. Incorporar `public/compliance/KERBEROS_SOURCE_NOTICES.txt`: cabeceras originales de las bibliotecas cliente, sus utilidades e includes, incluidas las de OpenVision y la de k5-queue. Es un conjunto conservador: que una cabecera se reproduzca no afirma que todos sus archivos se compilaran.
3. Mantener las licencias originales de las fuentes de todo Kerberos que se ofrecen como archivo separado. El tarball completo también contiene componentes no empaquetados, documentación CC-BY-SA-3.0 y material de otros titulares; no se relicencia ese archivo completo como GPL ni se confunde con objetos enlazados.
4. Si se alteran fuentes, conservar avisos y documentar cambios según corresponda. Los ajustes de rutas Mach-O y firmas del empaquetado se conservan en los scripts y la procedencia; no se presentan como binarios originales sin transformación.
5. Reabrir la revisión cuando cambie el runtime. No extrapolar este cierre al bundle Windows/Linux, ni a un cambio de configuración que incorpore un KDC, plugins de base de datos o bibliotecas de administración.

## Límites de la comprobación

Se combinaron hashes/UUID, dependencias Mach-O, símbolos definidos/importados, listas de objetos de Makefile, condiciones de configure y cabeceras de fuentes. No se dispone del mapa de enlace del build histórico de Homebrew ni se ha reconstruido Kerberos bit a bit. No se usa la mera ausencia de una cadena en un binario como prueba única de ausencia de código: se contrasta con su estructura de compilación y, en strptime, con la importación positiva de libSystem. La reconstrucción y el cierre de recursos de build siguen en la revisión separada de código fuente correspondiente.

El resultado permite cerrar PB-2 sobre este runtime con las obligaciones anteriores. No autoriza todavía la release completa: permanecen las revisiones de datos y código fuente correspondiente.
