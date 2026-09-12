# ViaSpania General Manual

ViaSpania  
Copyright © 2026 Antonio López García, Universidad de Granada  
This program is distributed under the GPL-3.0-only license.

[LICENSE](../LICENSE) · This statement applies to the original ViaSpania code. Third-party components and data retain their respective copyrights, licenses and terms. The ViaSpania logo and original graphic assets remain separately copyrighted, with all rights reserved; institutional symbols remain subject to their own terms.

ViaSpania helps you explore terrain, calculate least-cost travel and study accessibility and visibility. This manual explains how to prepare a project, choose an analysis, interpret its results and save them. For the equations and assumptions of a particular profile, use the calculation's contextual help button.

## 1. Start here

### What you need

To run analyses, you need the desktop application, an elevation model and the points required by your chosen tool. An Internet connection is needed to download models, view online maps and search for place names. You can import a local model; calculations run on your computer.

A background map helps you find your bearings. The elevation model supplies the heights used in calculations. Replacing an orthophoto with another map does not change the terrain used for analysis.

### Your first route, step by step

1. Click **New project**, enter a name and choose where to save the JSON file.
2. Find a familiar location in **Navigation**. You can move around the map or use **Search for a place**.
3. Activate **Select area** and drag a small rectangle containing both ends of your journey, with space around them for possible alternatives.
4. Choose a terrain model and check its resolution and estimated size. Download it and wait for processing to finish.
5. In the **Selection** map, activate the Start tool and place the origin. Do the same with End for the destination. Both must lie inside the model on cells with valid elevation.
6. Open **Simple route**, choose a travel profile and connectivity. For this first exercise, leave barriers and facilitators empty.
7. Calculate the outbound route. Review its line, distance, cost and unit, and elevation profile.
8. To study the return journey, calculate the independent return route. Then save the project and use **Compose report** or **Export results**, depending on what you want to keep.

Start with a small area and a single profile. Once you understand the result, change just one condition and calculate again; this helps you identify what causes each difference.

## 2. Get to know the workspace

### The four maps

- **Navigation**: locates your study and defines its extent.
- **Selection**: lets you place and edit points, barriers and facilitators over a map or orthophoto.
- **Digital model**: displays the loaded elevation and available overlays.
- **Cartography**: provides modern and historical maps and other enabled sources.

The main maps share navigation. Use the expand/restore control when you need more space, and return to the combined layout to compare backgrounds. The visible controls depend on the viewer and available data.

### Main actions

**New project**, **Open project** and **Save project** manage your working file. The active project name appears beside ViaSpania. **Settings** contains preferences; **3D view** opens the terrain when a model is loaded; **Compose report** prepares a PDF and **Export results** saves analysis products.

The calculation panel shows the parameters for the selected tool. Contextual help buttons explain that analysis or profile. Also read the status messages: they tell you what is missing, how an operation is progressing or why an error occurred.

## 3. Create, save and recover projects

### Create and save

When no project has been created or opened, the header shows **Empty project** and Save is disabled. Creating a project asks for a name and destination; the new workspace starts without a model, points or results. Save your current work before starting another project.

**Save project** updates the associated file. If the last project was recovered automatically and has no associated destination in the session yet, you will be asked for a location. Save after editing points, changing conditions or completing an analysis you want to retain.

### Open a project

1. Click **Open project** and select a ViaSpania JSON file.
2. Check the recovered name, points and conditions. If the project contains a valid study area, the maps fit to it.
3. Download or import the elevation model again before recalculating.

The JSON keeps project data and settings and the results included when saving; it does not embed the elevation file. Saving the project is different from exporting all products. Keep the JSON, GeoTIFF and exports in an identifiable working folder.

## 4. Locate and define the study

### Search for a place or coordinates

1. Click **Search for a place** in Navigation.
2. Enter at least three characters of a place name and click Search or press Enter.
3. Select a result with the mouse or arrow keys and Enter. The map centres on that location. Escape closes the window.

Place-name search uses GeoNames online and does not require an individual account setup. It only sends a request when you submit the search; quota limits or connection errors may occur. Centring the map does not replace placing calculation points in Selection.

You can also enter **latitude, longitude** in WGS84 decimal degrees, for example **40.4168, -3.7038**. Use a decimal point and a comma between values. This field does not accept UTM or degrees, minutes and seconds. Coordinates are parsed locally, and the window shows their transformation to the loaded model's or viewer's coordinate system.

### Choose the area

Activate **Select area** and draw a rectangle in Navigation. Include every location you need and leave room for a route to go around obstacles. An area that is too tight can exclude a useful alternative; an unnecessarily large one increases memory use.

**Delete area** removes the extent and associated model but keeps points and barriers. You will then need to define or import the terrain again and recalculate analyses that depend on it.

## 5. Prepare the elevation model

### Terrain and surface: an important distinction

A **DTM** represents terrain without buildings or vegetation. It is the usual choice for studying travel and ground slopes. A **DSM** represents the upper surface and may include structures and treetops; it can be useful for visibility studies, but those heights also affect routes, slopes and contours.

Choose the model type to match your study question. An aerial image does not itself supply building heights or information about passability. A DSM does not guarantee that every current obstacle is represented either.

### Download a model

1. Define the area and select an enabled source in the model-loading panel.
2. Check resolution, dimensions, cell count and resource estimates.
3. Start downloading and processing. Wait for the model to appear before calculating.
4. Check coverage and heights in the digital model viewer.

In **Settings → Digital models**, enable the sources you need. Available sources include terrain and surface models with different coverage and detail. A source appearing in the selector does not mean it covers every area.

### Import a GeoTIFF

Use the local model import option and specify whether it represents terrain or surface. The application checks its metadata and prepares the file for analysis. It must contain elevations and a recognisable coordinate system; an ungeoreferenced TIFF image is insufficient.

After importing, check the area, resolution and assigned type. Saved points use WGS84; analysis distances and resolution are expressed in metres. You do not need to convert points manually to the file's projected coordinate system.

### Resolution, memory and missing data

Each model cell represents part of the terrain. Smaller cells provide more detail if the source contains it, but increase data size and calculation work. Choosing a finer output resolution does not create new information in a coarse source.

If you exceed the processing limit, reduce the area or choose a less detailed model. In **Settings → Processing**, apply the recommended limit for detected memory. Raising the limit allows more cells but does not add memory to your computer.

Cells without a valid elevation, called **NoData**, are not terrain at zero height. They can prevent a connection. If the cursor displays a dash, check whether it is outside the model or over missing data. Changing the palette only changes colours, not heights.

## 6. Add points and crossing conditions

### Calculation points

Place Start and End for a route between two endpoints. Use multipoints to study several locations or an itinerary with stops. Check names, positions and order in the list. The select, move and delete tools act on features in the Selection map; return to navigation mode to move the map without editing them.

You can import points using CSV or GeoJSON. Use the application's CSV template as a guide to columns and formatting, and check the imported positions on the map before calculating. The search field uses latitude, longitude; GeoJSON uses longitude, latitude.

### Barriers and facilitators

Draw features in Selection and edit their properties in the collapsible **Barriers and facilitators** panel. Its summary lets you review conditions without keeping every control open.

- **Absolute barrier**: prevents crossing the affected cells.
- **Permeable barrier**: increases cost using a multiplier.
- **Preferred corridor**: reduces cost within its specified width.
- **Bridge or crossing**: allows a barrier to be crossed along its geometry, with the configured cost.
- **Point of interest**: can influence nearby cost or serve as a visit/waypoint, depending on its mode.

For example, to represent an obstacle that can only be crossed at a particular passage, draw the barrier and then the crossing through it. Check that the two overlap at the model's scale. A crossing does not fill NoData elevations or establish that real infrastructure exists.

### Mandatory crossings

Select **Required waypoint** if the route must visit that bridge or crossing. When unchecked, it remains available for crossing the barrier, but the route can choose another alternative. Mandatory crossings apply to simple routes, comparison, multipoint connections and alternatives.

The application chains visits together; it does not globally optimise their order. In Multi-route, conditions apply to every leg and a crossing may be visited more than once. Isochrones and the corridor surface do not represent an itinerary of mandatory visits.

### Display is different from activation or deletion

Hiding barriers, facilitators or labels in a viewer only changes their presentation. To change analysis conditions, edit or delete project features and calculate again. Always check the list before interpreting a new route.

## 7. Choose an analysis

### Simple route: connect two places

Use this to find a route between Start and End. Load the model, place both points, choose profile and connectivity, and calculate the outbound journey. Least cost means the lowest cost according to that profile, not necessarily the shortest distance.

The result provides a line, distance, cost with unit, ascent, descent and elevation profile. The return journey is calculated independently: climbing and descending may produce different costs and routes. Calculate both to compare directions.

### Route comparison: compare profiles

Use this to explore how the route changes with your travel assumptions. Select several profiles and calculate while keeping endpoints, model and crossing conditions the same.

Review the table and the overlaid or dual viewers. The overlaid view lets you show or hide profiles; the dual view lets you inspect two routes with synchronised navigation. Compare geometries and check units before comparing numerical values: seconds, joules and relative cost are not equivalent.

### Multipoint: compare connections between locations

Use this to study connections among the first eight points in the list. The result is a cost matrix and a set of directed routes. Read each cell from the origin in its row to the destination in its column.

The A→B connection may differ from B→A. Multipoint answers what it costs to travel between pairs; it does not suggest an order for visiting all locations.

### Multi-route: follow a sequence of stops

Use this when the visit order is already decided. Order the points and calculate: A, B and C produce A→B followed by B→C. Review each leg and its joins.

The application does not reorder stops or automatically add a return to the start. To try another itinerary, change the list and calculate again.

### Sub-optimal alternatives

In modes offering this option, enable alternatives before calculating. Rank 1 is the optimum; later ranks seek spatially different routes. Review the cost increase and percentage shared with the optimal route.

Separation influences how far routes diverge. These are not the exact k-shortest paths, and not every alternative will be useful for your study. Displayed costs are evaluated under the original conditions. In Multi-route, each rank represents the complete itinerary through the stop list.

### Corridor: explore a band of alternatives

Use this to identify a potential passage zone between Start and End. Choose profile, connectivity and tolerance percentage, then calculate and inspect the surface.

A 10% threshold includes cells through which a connection can pass at a cost up to 10% above the optimum. Increasing the percentage usually widens the corridor. It does not represent a physical path width or a probability of use.

### Isochrones: study reach from one or more origins

Select origins, the interval between levels and the maximum number of levels. Calculate and inspect the lines and accumulated surface. With several origins, each cell takes the lowest cost from any of them.

Lines represent time only when the profile uses time units. Other profiles produce energy or relative-cost levels. For time profiles, enter the interface interval in minutes. Do not interpret the calculated reach as a guarantee of real access.

### Viewshed: study visibility

Select observers and their height above the surface, calculate, and inspect visible and non-visible areas. Observer height can represent a person, tripod, tower or custom value.

Visibility depends on the loaded model. A DTM does not automatically include trees or buildings; a DSM only includes what its surface records. The analysis does not include atmospheric refraction or reconstruct historical conditions.

### Contour lines: read elevations

Choose vertical spacing in metres and generate contours. Use their elevation values to recognise slopes, ridges and valley bottoms. Smaller spacing produces more lines but does not improve source accuracy.

Calculated contours can be overlaid in supporting viewers, including 3D. On a DSM they describe the upper surface, not necessarily the ground.

## 8. Choose parameters and interpret results

### Travel profile

The profile defines what is minimised: time, energy or relative cost. Choose one suited to your question and consult its contextual help for assumptions. Some profiles offer their own parameters, such as speed or critical slope; these are not universal controls.

A wheeled profile does not itself incorporate roads, road surfaces or permissions. Its critical slope is a cost reference, not an absolute barrier. Represent known restrictions through project conditions.

### Connectivity

Connectivity defines available directions between cells: 4 allows orthogonal movement, 8 adds diagonals and 16 adds extended directions. Higher connectivity can soften the grid effect at the cost of more calculation work. Keep it constant when comparing profiles if you want to isolate the profile's effect.

### How to review a result

1. Check the model's source, area and resolution.
2. Review points, profile, unit, connectivity and crossing conditions.
3. Examine the route and elevation profile, not just total cost.
4. Check whether the result approaches the area boundary or NoData zones.
5. After changing analysis data or parameters, calculate again before exporting a conclusion.

Changing a background, palette, opacity or label visibility does not recalculate the analysis. A modelled route does not establish a path, permission, passability or safety. ViaSpania must not be used for emergency navigation.

## 9. Explore results in 2D and 3D

### 2D viewers

Open the result viewer to explore maps, legends, tables and profiles. The background selector lets you place results over different sources and saved external layers. Historical backgrounds provide visual context; they do not turn the current elevation model into historical terrain.

In the expanded digital model viewer, you can control barriers, facilitators and labels. Hiding them does not change their role in the calculation. Calculation viewers have no direct PNG/PDF export or printing: use the report composer.

### 3D viewer

With a model loaded, click **3D view**. Drag with the left button to orbit, the right button to pan, and use the wheel to zoom. The compass and inclination indicator help you find your bearings.

Adjust vertical exaggeration, palette or texture, and enable available points, routes, contours and other results. Exaggeration changes only the display; zero flattens the view. The 3D mesh is a simplified representation, not an additional elevation source.

### Create images and animations

1. Prepare visible layers and wait for the background to finish loading.
2. In **Animated export**, choose Camera orbit, Route traversal or Bird’s-eye route tracking.
3. To follow a route, keep a calculated route visible and select which one to follow. Adjust camera distance, inclination and available controls.
4. Choose duration, speed and resolution. Enable the compass or elevation profile if needed and available.
5. Click **Export video**, **Export GIF animation** or **Export PNG frame** and wait for save confirmation.

Video is saved as AVI/MJPEG at 30 frames per second, with a maximum of 90 seconds and 1.5 GB per file. Effective duration depends on duration and speed: 20 seconds at 2× produces 10 seconds. Generating the file may take longer than its playback duration.

GIF adapts resolution and frame count to control memory. PNG captures the initial frame of the configured mode. Videos can be large; allow disk space for the temporary file and final output. You can cancel export. If your player does not support AVI/MJPEG, open the file with a compatible player.

## 10. Save results and compose a report

### Which option to use

- **Save project**: continue editing your work in ViaSpania.
- **Export results**: retain geographic data for archiving or GIS use.
- **Compose report**: present maps, metrics and parameters in PDF.
- **3D viewer export**: create an image or animation of the scene.

### Export data

Open **Export results**, select available products and choose a folder. The application organises files using descriptive names. Depending on the analysis, these may include elevation models, routes, surfaces, contours, points, barriers and facilitators.

GeoJSON preserves vector geometries; GeoPackage groups layers and attributes; GeoTIFF preserves raster data and georeferencing. The elevation GeoTIFF does not include the preview palette. Check the final message and generated files before moving or closing your work.

### Prepare the PDF

1. Calculate the results you want to include and select the corresponding analysis mode.
2. Click **Compose report**. Options vary with the analysis and available results.
3. Select the maps, routes, tables and technical pages offered. Choose the background and page size.
4. Adjust visual options. If using the 3D model, check inclination and orientation before generating the document.
5. Click **Generate PDF**, choose the destination and check the saved document.

Include parameters and units if another person needs to interpret the calculation. A PDF communicates a result; it does not replace the editable project or geographic data.

## 11. Adapt the application to your work

### Language and help

In **Settings**, choose Español or English and save preferences. The selection applies to the interface and general help, along with associated text. Use the tutorial to find your way around the controls and contextual help to explore each calculation in depth.

### Maps and display

**2D viewers** lets you adjust pointers, coordinates, scales, labels, boundaries and default backgrounds. **3D viewer** contains terrain display preferences. These options affect how you read the map, not the original elevations.

### Sources and external layers

In **Digital models**, enable the elevation sources you want offered in the selector. In **Cartography**, manage backgrounds and add XYZ, WMS or WMTS services. Check the service address, layer and requested configuration before saving. A service may have limited coverage or prevent access from the application.

### Processing and sounds

In **Processing**, review detected memory and apply the recommended limit. In **Sounds**, enable, choose and test the completion notification. The sound signals a successful operation; still check the status message and result.

## 12. Solve common problems

### I cannot start a calculation

Check that a model is loaded, the area is valid and the required points exist. Review whether points lie inside coverage and whether a parameter is missing. Read the status message; a disabled control often indicates an unmet requirement.

### No route is found

Review NoData cells, absolute barriers and mandatory crossings. Check that crossings connect both sides of the obstacle at the model's resolution. Expand the area if an alternative may lie outside it, reload the model and calculate again.

### A download or map will not load

Check the connection and source coverage. Try a smaller area or another background. If the service fails or reaches its quota, try again later. To continue with an available model, use local GeoTIFF import.

### A calculation uses too many resources

Reduce the area, use a less detailed model, or first try a single profile and fewer points. Comparisons, alternatives and connectivity 16 may require more time. Do not raise the cell limit without reviewing available memory.

### I opened a project but the terrain is missing

The project JSON does not contain the elevation file. Download or import the model again and check that it matches the study before recalculating.

### Video export fails or the file will not play

Wait for textures to finish loading, check that a route is visible if the mode requires one, and reduce duration or resolution. Review disk space and export limits. The file is AVI/MJPEG; it needs a player supporting that format.

### I need to report a problem

Record version and build, operating system, steps taken and the complete error message. Include the model's source and resolution, and attach only data you can share. Support contact: antonio.lopez@ugr.es.
