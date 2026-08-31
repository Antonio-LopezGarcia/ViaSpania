# ViaSpania Manual

ViaSpania is a desktop application for terrain-based least-cost analysis, route comparison and topographic interpretation. Persisted point coordinates use WGS84 (EPSG:4326); graph distances and raster resolution use metres.

## 1. Overview

The main workspace contains four synchronised map viewers and a calculation panel. The current project, study area, selected elevation model and available results determine which controls are enabled.

### Header

- New project creates and saves an empty workspace.
- Open project restores a saved ViaSpania JSON project.
- Save project updates the current file or asks for a destination on first save.
- Export results saves selected vector, raster and project products.
- 3D viewer opens after an elevation model has been processed.
- Settings contains language, display, data-source, processing, sound and tutorial preferences.
- Compose report opens the PDF composer for the current calculation mode.
- Help opens this manual; Credits shows authorship, licences, sources and exact build information.

### Navigation

Use the Navigation viewer to choose a base map, locate the work area and draw the rectangular study extent. The ↗ control expands or restores the viewer.

### Orthophoto and editing tools

The Selection viewer is the editing surface for start, end and multipoints, barriers, preferred corridors, enabled crossings and points of interest. Pan, select, move and delete modes are mutually exclusive. Coordinates shown and stored for points are longitude/latitude in EPSG:4326.

### DTM

The Digital Model viewer displays the processed raster and analytical overlays. Its cursor can report cell position, elevation and values when the corresponding preference is enabled. Palette changes affect presentation, not source elevations.

### Cartography

The Cartography viewer provides IGN/CNIG historical and modern sources and any user-configured XYZ, WMS or WMTS layers. External services remain responsible for availability, CORS policy, licence and attribution.

### Geographic calculations

Choose Simple route, Route comparison, Multipoint, Multi-route, Corridor, Isochrones, Viewshed or Contour lines. The ? button opens calculation-specific methodological help. Results never imply legal access, physical passability or safety.

### Barriers and facilitators panel

- Absolute barriers block intersected cells.
- Penalty barriers multiply traversal cost.
- Preferred corridors reduce cost within their configured width.
- Bridges, fords and tunnels enable crossing through a linked barrier using a multiplier.
- Points of interest can influence nearby cost, require a single visit or act as waypoints.

Names, geometry and parameters remain editable. Review the list before recalculating because all enabled elements affect subsequent analyses.

### Current configuration

Travel profile, connectivity and profile-specific parameters are shared by the active calculation. Four-neighbour connectivity is restrictive, eight neighbours adds diagonals and sixteen neighbours adds extended directions. Higher connectivity generally produces smoother routes but requires more work.

## 2. Preparing the elevation model

1. Draw a study extent in the Navigation viewer.
2. Choose an enabled elevation source and resolution.
3. Check the estimated rows, columns, cell count, disk use and memory use.
4. Download and process the model.
5. Wait for completion before calculating routes or topographic products.

Routine processing uses deterministic provider adapters. ViaSpania reports source metadata and preserves attribution. Do not assume terrain, access or land-cover information that is not present in the selected elevation product.

### Digital surface models

A DTM describes bare-earth elevation. A DSM may include vegetation and buildings. Surface products are therefore useful for some visibility studies but can produce unsuitable least-cost routes. ViaSpania displays a warning when a surface source is selected.

### Copernicus VHR 2021 imagery

Copernicus VHR 2021 is a European image mosaic with different date, resolution and coverage properties from PNOA. It is a visual background, not an elevation source and not a walkability layer.

## 3. Geographic calculations: operation and interpretation

### Simple route

**Sub-optimal routes.** When enabled, rank 1 is the optimum. Later ranks reduce the conductance of edges incident to previously used cells and run Dijkstra again. A stronger separation uses a smaller multiplier and usually pushes routes farther apart. These are spatially distinct sub-optimal routes, not exact *k*-shortest paths. Every published cost is evaluated on the original unpenalised surface; the interface also reports its increase over the optimum and shared-cell percentage. Mandatory waypoints remain part of every rank.

Simple route finds the minimum accumulated-cost path between start and end. Outbound and return are calculated independently because directional profiles may assign different costs to ascent and descent. The result includes geometry, cost, distance, ascent, descent, elevations and slopes. Open the route viewer to inspect the line and elevation profile.

### Route comparison

Route comparison repeats the same endpoints, raster, connectivity and facilitators with selected profiles. Compare geometry and behaviour carefully: numerical costs with different units—seconds, joules and relative cost—are not directly comparable. The dedicated viewer offers overlaid and side-by-side maps plus a results table.

### Multipoint

Multipoint calculates directed least-cost connections among the first eight points. Each point becomes an origin in turn. The matrix may be asymmetric for directional profiles. Colours identify origins; use the matrix and synchronised maps to inspect from/to relationships.

### Multi-route

**Sub-optimal itineraries.** Every rank is a complete journey through all points in list order. ViaSpania joins all legs, penalises the cells of that complete itinerary, and then calculates the next rank. It does not arbitrarily combine unrelated partial routes from individual legs. Total cost is evaluated on the original surface and compared with rank 1.

Multi-route connects consecutive points strictly in list order: 1→2, 2→3 and so forth. It optimises each leg but does not optimise visit order. Reorder the point list before calculation when sequence matters.

### LCP corridor

The least-cost corridor combines accumulated costs from both endpoints and retains cells whose combined cost is within the selected percentage above the optimum. A narrow threshold represents close alternatives; a broad threshold includes increasingly costly possibilities. It is not a legal or surveyed corridor.

### Isochrones

Isochrones run accumulated-cost propagation from one or more origins and interpolate equal-cost lines at the chosen interval. Choose origins, interval and maximum number of levels. The coloured surface represents accumulated cost; opacity only changes display.

### Viewshed

Viewshed estimates line of sight from selected observers using the loaded raster and observer height. Choose a human, tripod, tower or custom height. The calculation does not include atmospheric refraction and cannot include vegetation or buildings unless they are represented by the loaded surface model.

### Contour lines

Contours interpolate equal-elevation segments from raster cells at the selected vertical interval. A small interval creates more geometry and may suggest precision beyond the source resolution. Exported contours retain their elevation values.

## 4. Travel profiles

ViaSpania includes walking-time, energetic, pastoral, caravan and wheeled relative-cost profiles. Each profile's contextual help states authorship, purpose, equation, variables, editable parameters, units, limitations and scientific reference.

- Tobler profiles estimate walking time and distinguish slope direction.
- Márquez-Pérez and Kondo–Seino are empirical walking formulations.
- Rees and GKRS are symmetric slope-response functions.
- Tripcevich represents llama caravans; Alberti represents pastoral movement.
- Pandolf variants estimate metabolic expenditure with documented fixed assumptions.
- Minetti, Herzog and Ardigò estimate energetic cost; Ardigò exposes speed.
- Wheeled uses a configurable critical slope as a cost reference, not an absolute block.
- Eastman produces an abstract relative-cost index.

Never compare values across incompatible units. Equations, units and citations are shown in the calculation help and technical report pages.

## 5. Result viewers

Dedicated viewers preserve the map context while presenting routes, surfaces, legends and tables. Map capture controls export PNG or PDF views with ViaSpania attribution. Selection, route and raster overlays use the same stored WGS84 project geometry.

## 6. 3D viewer

The 3D viewer builds a terrain mesh locally from the processed raster. Vertical exaggeration changes visual interpretation only; 0 produces a flat display. Palettes and imagery are presentation layers.

### Camera and orientation

Left drag orbits, right drag pans and the wheel zooms. Inclination and orientation can be entered in the animation panel. The compass and tilt indicators report the current camera view.

### Terrain and layers

Toggle points, labels, maximum elevation, scale, barriers, corridors, crossings, points of interest and available analytical results. Texture sources keep their required attribution. A raster surface displayed in 3D remains the result already calculated in 2D.

### Video and GIF

Choose orbit or route animation, speed, nominal duration, inclination, orientation and resolution. Video is captured at a planned 30 fps using the best MP4 or WebM format supported by the platform web engine. GIF export is generated deterministically, supports up to 1280 pixels in width and limits frame count to control memory. Long or high-resolution exports take more time. Cancelling releases capture resources.

## 7. Settings

### Language

Choose Español or English. Saving preferences applies the language to the interface, tutorial, contextual calculation help, integrated manual, credits, reports and generated messages. The preference is stored on this computer and shared by desktop builds on Windows, macOS and Linux.

### 2D viewers

Configure crosshairs, synchronized pointers, scales, cursor coordinates, feature labels, administrative boundaries, default navigation map, default orthophoto and DTM palette.

### 3D viewer

Configure default vertical exaggeration, palette, maximum-elevation marker and scale visibility.

### Digital models

Enable or disable terrain and surface sources. At least one digital model must remain enabled.

### Cartography

Enable built-in navigation, orthophoto and historical sources. At least one source in each required viewer group must remain active. Add external XYZ, WMS or WMTS services only when their address, layer definition, CORS policy, licence and attribution are known.

### Processing

The detected-memory recommendation controls the maximum raster-cell count accepted before native allocation. Larger limits permit larger studies but increase memory and calculation time. Model comparison, sixteen-neighbour connectivity and multipoint analysis are particularly demanding.

### Sounds

Enable completion sounds and choose a notification. Sounds play only after successful calculations, loads and exports—not after cancellation or failure.

## 8. PDF report composer and export

The composer exposes sections appropriate to the current calculation: navigation overview, orthophoto, individual routes, 3D terrain, historical cartography, point and barrier lists, technical pages, analytical maps and custom text. Choose page size and visual options before export.

Reports preserve source attributions, calculation profile, effective parameters, units and limitations. A report documents a computation; it does not validate access, terrain safety or source completeness.

## 9. Files and exports

- Project JSON stores editable state and WGS84 features.
- GeoJSON exports vector routes, isochrones and contours.
- GeoPackage groups project feature layers and attributes.
- GeoTIFF preserves the selected elevation raster bytes and georeferencing.
- PNG and PDF capture map or analytical views.
- GIF, MP4 and WebM export 3D animations according to platform support.

Exported filenames are normalised for portability. Saving can be cancelled without changing the project. Keep the project file and exported products together when reproducibility matters.

## 10. Limitations

Elevation alone does not describe land cover, paths, ownership, permission, hazards, weather, seasonal conditions or accessibility. Remote services can change or become unavailable. Results depend on source resolution, extent, profile assumptions, connectivity and every configured barrier or facilitator. ViaSpania is not an emergency-navigation system.

## 11. Credits, sources and contact

ViaSpania was created and is maintained by Antonio López García. Credits lists software licences, IGN/CNIG, Copernicus and OpenStreetMap attributions, the methodological acknowledgement to Gianmarco Alberti's movecost package, and the exact version/build currently running.

Contact: antonio-lopez-garcia@hotmail.com
