# Traducción al italiano

El único archivo que debe editar quien traduce es `src/core/i18n.it.json`.
Italiano ya se puede elegir en la bienvenida y en Configuración → Idioma.
Se ha incorporado el catálogo italiano entregado: 1.956 textos y 306 patrones.
Las 317 entradas vacías conservan el original; incluyen identificadores técnicos,
unidades, fórmulas, referencias y avisos legales.

## Textos y mensajes variables

En `messages`, mantenga intactas las claves y escriba el italiano entre las comillas
situadas a la derecha. También están incluidos los textos del manual mostrado dentro
de la app, ayudas de cálculo, tutorial y etiquetas de exportación.

```json
"Seleccionar todos": "Seleziona tutto",
"Punto {0} seleccionado": "Punto {0} selezionato"
```

Conserve todos los marcadores `{0}`, `{1}`, etc. Puede cambiar su orden.
La aplicación sustituye los marcadores por los datos reales sin traducirlos:
por ejemplo números, nombres y rutas de archivos. No cambie unidades, fórmulas,
citas científicas, nombres institucionales ni avisos legales originales.
Las entradas vacías permiten avanzar por partes. Una traducción que pierda
marcadores no se aplica.

## Patrones de mensajes del motor

En `patterns`, edite **únicamente `translation`**. `source` y `flags` son reglas
técnicas de detección; `reference` es la traducción inglesa existente como ayuda.
Conserve los marcadores `$1`, `$2`, etc. de `reference`.

```json
{
  "source": "^Punto (\\d+)$",
  "flags": "g",
  "reference": "Point $1",
  "translation": "Punto $1"
}
```

Los mensajes completos tienen prioridad; los patrones cubren mensajes variables,
incluidos diagnósticos nativos. No hace falta editar los archivos TypeScript para
traducir estas entradas. El catálogo se incorpora al compilar: después de editarlo,
la versión instalada necesita una compilación nueva.

## Mantenimiento y comprobación

`node scripts/prepare-italian-catalog.mjs` añade textos encontrados en el código,
el catálogo inglés y el manual, sin sobrescribir traducciones existentes.
La extracción es conservadora: puede incluir fragmentos técnicos que deben quedar
vacíos. Las nuevas pantallas deben mantener sus textos en el circuito de localización;
el extractor no sustituye la revisión visual de la app.

Ejecute `pnpm test` y `pnpm build`. Las pruebas comprueban cambios de idioma,
persistencia, bienvenida, parámetros y conservación de datos. Revise también
las ayudas, informes y ventanas 3D con la traducción terminada para comprobar su ajuste.
El sitio web público y los archivos originales de licencias no forman parte de este catálogo.
