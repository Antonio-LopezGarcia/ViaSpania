# ViaSpania Architecture

## Overview

ViaSpania is a multi-platform geospatial application for analyzing transportation routes and land features. It comprises:

- **Web application** (TypeScript/React + OpenLayers) for interactive map exploration
- **Desktop application** (Tauri + Rust) for native performance and offline GeoTIFF analysis
- **Core services** (framework-free TypeScript) for geographic computation, routing, and data imports
- **Service adapters** for remote providers with fixtures for deterministic testing

The architecture prioritizes **geographic accuracy**, **immutable data boundaries**, **testability**, and **attribution preservation**.

---

## Runtime Architecture

### Application Execution Paths

#### 1. Web Application Runtime

```
Browser Entry Point
    ↓
React Application (src/components)
    ├── Routes & UI Components
    ├── OpenLayers Map Integration
    └── State Management
        ���
    Core Services (src/core)
    ├── Geographic Calculations
    ├── Routing Logic
    ├── Import Processing
    └── Graph Operations
        ↓
    Service Adapters (src/services)
    ├── Remote Provider Communication
    ├── Metadata Parsing
    ├── Capability Detection
    └── Fixture Loading (dev/test)
        ↓
    Browser APIs & Storage
    ├── localStorage
    ├── IndexedDB
    ├── Fetch/WebSocket
    └── Canvas/WebGL (Maps)
```

**Execution Flow:**
1. `pnpm dev` starts Vite dev server
2. React components mount and initialize OpenLayers map
3. User interactions trigger core module functions
4. Core modules request data from service adapters
5. Service adapters call remote providers or load fixtures
6. Results flow back through immutable data structures
7. React re-renders based on state changes

---

#### 2. Desktop Application Runtime

```
macOS/Windows Entry Point (Tauri)
    ↓
Frontend (Tauri WebView)
    ├── React Application
    └── Service Adapters
        ↓
    Tauri IPC Bridge
        ↓
    Rust Backend (src-tauri)
    ├── GDAL/PROJ Integration
    ├── GeoTIFF Processing
    ├── Native File I/O
    ├── CPU-Intensive Geospatial Ops
    └── OS-Level Features
        ↓
    System APIs
    ├── File System
    ├── Networking
    └── GPU/GDAL Libraries
```

**Execution Flow:**
1. `pnpm desktop:dev` starts Tauri development server
2. Frontend renders React UI in Tauri WebView
3. User interactions in frontend trigger Tauri commands
4. Tauri IPC serializes requests to Rust backend
5. Rust backend processes GeoTIFF files, terrain analysis, etc.
6. Results returned via IPC to TypeScript for rendering
7. macOS bundle created via `pnpm desktop:build`

**Desktop-Specific Capabilities:**
- Direct GeoTIFF file loading and raster analysis
- High-performance spatial indexing (Rust)
- Offline-first data processing
- System file dialogs and native menus

---

### Component Architecture

#### src/components: React UI Layer

**Responsibilities:**
- User interface and interaction
- OpenLayers map integration and rendering
- Component state management
- Event handling and user feedback

**Key Modules:**
```
src/components/
├── Map.tsx              # OpenLayers integration
├── RouteViewer.tsx      # Route visualization
├── TerrainAnalysis.tsx  # Elevation/terrain tools
├── ImportDialog.tsx     # Data import UI
├── Legend.tsx           # Map legend
└── ...                  # Other UI components
```

**Data Flow:**
- Components call functions from `src/core`
- Components receive immutable data structures
- State updates trigger re-renders
- OpenLayers map canvas updates via layer changes

---

#### src/core: Geographic & Routing Logic (Framework-Free)

**Responsibilities:**
- Pure geographic calculations (WGS84 coordinates)
- Graph-based routing algorithms
- Data import and transformation
- Geospatial utility functions

**Key Modules:**
```
src/core/
├── geographic/
│   ├── coordinates.ts   # WGS84 transformations
│   ├── distance.ts      # Haversine, great-circle
│   └── bounds.ts        # Bounding box operations
├── routing/
│   ├── graph.ts         # Graph data structure (metres)
│   ├── dijkstra.ts      # Shortest path algorithm
│   ├── elevation.ts     # Profile extraction
│   └── costs.ts         # Route cost calculations
├── import/
│   ├── osm.ts           # OpenStreetMap parsing
│   ├── shapefile.ts     # Shapefile import
│   ├── geoTiff.ts       # GeoTIFF metadata
│   └── validators.ts    # Data validation
└── terrain/
    ├── classification.ts # Land-cover categories
    ├── accessibility.ts  # Access restrictions
    └── analysis.ts       # Slope, exposure, etc.
```

**Key Invariants:**
- **Coordinate units**: WGS84 (latitude/longitude) for persisted data
- **Distance units**: Metres for graph edges and route profiles
- **Data flow**: Immutable inputs → pure functions → immutable outputs
- **No side effects**: All I/O delegated to adapters or components

**Example Data Structure:**
```typescript
// Route result (immutable)
interface Route {
  waypoints: CoordinateWGS84[];      // WGS84
  segments: RouteSegment[];           // Metres-based
  elevationProfile: number[];         // Metres
  totalDistance: number;              // Metres
  attribution: string[];              // Source attributions
}
```

---

#### src/services: Remote Provider Adapters

**Responsibilities:**
- Communication with external APIs
- Metadata parsing and capability detection
- Error handling and fallback strategies
- Fixture management for testing

**Key Modules:**
```
src/services/
├── openStreetMap/
│   ├── adapter.ts       # OSM API client
│   ├── parser.ts        # Way/node parsing
│   └── fixtures/        # Test data
├── elevation/
│   ├── adapter.ts       # DEM service client
│   ├── parser.ts        # Raster metadata
│   └── fixtures/
├── terrain/
│   ├── adapter.ts       # Land-cover provider
│   ├── parser.ts        # Classification mapping
│   └── fixtures/
└── provider.ts          # Provider registry
```

**Adapter Pattern:**
```typescript
// Generic adapter interface
interface GeospatialAdapter {
  capabilities(): Promise<ServiceCapability>;
  query(bounds: Bounds): Promise<GeoJSON | GeoTIFF>;
  parse(raw: unknown): GeometryCollection;
}

// Example implementation
class OSMAdapter implements GeospatialAdapter {
  async capabilities() { /* detect features */ }
  async query(bounds) { /* call overpass API */ }
  parse(raw) { /* convert to GeoJSON */ }
}
```

**Fixture Loading:**
- Store `public/fixtures/` with captured service responses
- Deterministic tests load fixtures instead of hitting live APIs
- Fixture paths: `fixtures/{service}/{operation}.json`
- Enable reproducible CI/CD without external dependencies

---

## Data Flows

### Route Calculation Flow

```
User Action: "Find Route from A to B"
    ↓
MapComponent.onRouteRequest()
    ↓
RouteService.calculateRoute(startWGS84, endWGS84)
    ├── core/routing/graph.buildGraph(tileData)
    │   └── Converts geographic data to metre-based graph
    ├── core/routing/dijkstra.shortestPath(start, end)
    │   └── Returns path through graph nodes
    ├── core/routing/elevation.getProfile(path)
    │   └── Queries DEM service adapter
    ├── core/geographic/distance.sumSegments(path)
    │   └── Calculates total route distance
    └── Aggregates results into immutable Route object
        ↓
MapComponent receives Route
    ├── Renders path on OpenLayers map
    ├── Displays elevation profile
    └── Shows attribution for all sources
```

### Data Import Flow

```
User Action: "Import GeoJSON file"
    ↓
ImportDialog.onFileSelect(file)
    ├── Validates file format
    └── Calls ImportService.import(file)
        ↓
        core/import/geoJson.parse(raw)
        ├── Converts to internal geometry format
        ├── Validates WGS84 coordinates
        └── Returns FeatureCollection
            ↓
        core/import/validators.checkCoverage(features)
        ├── Ensures features within Spain bounds
        └── Flags out-of-bounds geometry
            ↓
        MapComponent renders features
        └── Updates application state with import
```

### Terrain Analysis Flow

```
User Action: "Analyze terrain in map view"
    ↓
TerrainPanel.onAnalyze()
    ├── Bounds from map viewport (WGS84)
    └── Calls TerrainService.analyze(bounds)
        ↓
        services/terrain/adapter.query(bounds)
        └── Fetches land-cover data for viewport
            ↓
            services/terrain/parser.classify(raster)
            ├── Maps raster values to land-cover categories
            └── Returns classified GeoJSON
                ↓
                core/terrain/analysis.computeStatistics(classified)
                ├── Percentage by category
                ├── Accessibility score
                └── Exposure metrics
                    ↓
                    MapComponent renders overlay
                    └── Shows classified terrain with legend
```

---

## Execution Paths: Key Scenarios

### Scenario 1: Web App Route Query

**User**: Searches for hiking route from A to B on web

**Path**:
1. Browser loads `index.html` → React app
2. User clicks map, enters endpoints
3. `MapComponent.onRouteRequest(startCoord, endCoord)` fires
4. Calls `RouteService.calculateRoute(start, end)` (TypeScript, no framework)
5. `RouteService` fetches OSM street data via `OSMAdapter` (service)
   - Checks `public/fixtures/osm/ways.json` if in test mode
   - Otherwise calls live Overpass API
6. `core/routing/graph.ts` converts geographic data to metre-based graph
7. `core/routing/dijkstra.ts` computes shortest path
8. `core/routing/elevation.ts` queries DEM via adapter
9. Route object (WGS84 coords, metre distances) returned to component
10. React state updated → map re-renders with new route layer
11. Elevation profile chart updates

**Data Invariants Maintained**:
- Input coordinates in WGS84 ✓
- Internal graph distances in metres ✓
- Output route points in WGS84 ✓
- All source attributions included ✓

---

### Scenario 2: Desktop GeoTIFF Analysis

**User**: Opens desktop app, loads local GeoTIFF raster for slope analysis

**Path**:
1. Tauri app starts, renders React UI in WebView
2. User clicks "Open File" dialog (native Tauri menu)
3. Selects local GeoTIFF file
4. Frontend calls Tauri command: `analyze_raster(file_path)`
5. Tauri IPC serializes to Rust backend
6. Rust backend:
   ```
   - Opens file via GDAL
   - Reads metadata: CRS, pixel size, bounds
   - Invokes PROJ for coordinate transformation
   - Computes slope raster using differential operators
   - Returns statistics and preview as JSON
   ```
7. JSON result sent back via IPC to frontend
8. TypeScript deserializes result
9. `core/terrain/analysis.ts` processes slope categories
10. React component renders heatmap overlay on map
11. Legend shows slope ranges (0°–45°, >45°, etc.)

**Framework Integration**:
- Pure Rust computation isolated from TypeScript
- IPC boundary ensures type safety
- GeoTIFF never loaded into browser memory
- Desktop-only feature unavailable on web

---

### Scenario 3: Reproducible Test Suite

**Developer**: Runs `pnpm test` for routing algorithm

**Path**:
1. Test runner (Jest/Vitest) loads test suite
2. Tests import `core/routing/dijkstra.test.ts`
3. Test case calls `dijkstra.shortestPath(mockStart, mockEnd)`
4. When adapter is needed:
   ```
   - Test loads fixture: services/osm/fixtures/ways.json
   - No live API call ✓
   - Deterministic output ✓
   - Fast execution ✓
   ```
5. Assertions verify:
   - Path respects graph constraints
   - Distance calculation in metres
   - Output is immutable
6. All assertions pass → test green
7. `pnpm build` validates TypeScript strict mode
8. All tests pass → code ready for production

---

## Module Dependencies & Layers

### Dependency Graph

```
┌────────────────────────────────────────────────���────┐
│              src/components (React)                  │
│  - UI, OpenLayers maps, user interactions            │
└─────────────────────┬───────────────────────────────┘
                      │
         calls pure functions ↓
                      │
┌─────────────────────▼───────────────────────────────┐
│            src/core (Framework-Free)                 │
│  - Geographic, routing, import, terrain logic        │
│  - Pure functions, no I/O, immutable data            │
└─────────────────────┬───────────────────────────────┘
                      │
         delegates I/O ↓
                      │
┌─────────────────────▼───────────────────────────────┐
│           src/services (Adapters)                    │
│  - Remote API clients, fixture management            │
│  - Network I/O, error handling                       │
└─────────────────────┬───────────────────────────────┘
                      │
         communicates ↓
                      │
┌─────────────────────▼───────────────────────────────┐
│       External APIs & Local Storage                  │
│  - Overpass API, DEM services, GeoTIFF files         │
└─────────────────────────────────────────────────────┘
```

**Key Rule**: No layer can import from layers above it. Components may import core; core must not import components.

### Web vs. Desktop Differences

| Feature | Web (React + TypeScript) | Desktop (Tauri + Rust) |
|---------|--------------------------|------------------------|
| **UI Rendering** | Browser, OpenLayers Canvas | Tauri WebView, same React UI |
| **Raster Processing** | Client-side JS (limited) | Rust + GDAL (fast, native) |
| **File I/O** | Browser storage, upload | Native file dialogs, OS access |
| **Offline Support** | Service Workers, fixtures | Full offline with fixtures |
| **Performance** | GPU rendering, JS limits | CPU/GPU via Rust, no JS limits |
| **GeoTIFF Handling** | Metadata only, no pixel ops | Full GDAL analysis |

---

## Data Structures & Coordinate Systems

### Coordinate System Convention

```typescript
// WGS84 (EPSG:4326) - for persisted data
interface CoordinateWGS84 {
  latitude: number;   // -90 to +90
  longitude: number;  // -180 to +180
}

// Metres - for graph edges, distances, elevations
type DistanceMetres = number;

// Graph node (internal routing)
interface GraphNode {
  id: string;
  location: CoordinateWGS84;  // WGS84 storage
  edges: GraphEdge[];          // Metre-based
}

interface GraphEdge {
  targetNodeId: string;
  distanceMetres: DistanceMetres;
  elevation: number;  // Metres ASL
}
```

### Immutability at Boundaries

```typescript
// Core module output: frozen object
export function calculateRoute(
  startWGS84: CoordinateWGS84,
  endWGS84: CoordinateWGS84
): Readonly<Route> {
  const route = {
    waypoints: [...coords],
    distance: total,
    attribution: [...sources],
  };
  return Object.freeze(route);
}

// Component receives immutable data
const route: Readonly<Route> = calculateRoute(a, b);
// route.distance = 999; ❌ TypeError in strict mode
```

---

## Testing Strategy

### Unit Tests (Pure Modules)

**Location**: `src/core/**/*.test.ts`

**Characteristics**:
- Test pure functions with known inputs/outputs
- No external dependencies
- Fixtures pre-loaded
- Run via `pnpm test`

**Example**:
```typescript
import { dijkstra } from '../core/routing/dijkstra';

describe('Dijkstra shortest path', () => {
  it('finds shortest path in graph', () => {
    const graph = loadFixture('fixtures/routing/graph.json');
    const path = dijkstra(graph, 'node_0', 'node_5');
    expect(path.distance).toBe(1250); // Metres
    expect(path.nodes.length).toBe(6);
  });
});
```

### Integration Tests (With Fixtures)

**Location**: `src/services/**/*.test.ts`

**Characteristics**:
- Test adapter + core integration
- Load fixtures from `public/fixtures/`
- No live API calls
- Deterministic results

**Example**:
```typescript
import { OSMAdapter } from '../services/openStreetMap/adapter';

describe('OSM adapter', () => {
  it('parses fixture and builds route', async () => {
    const adapter = new OSMAdapter({ useFixtures: true });
    const ways = await adapter.query(bounds);
    const graph = buildGraph(ways);
    expect(graph.nodes.length).toBeGreaterThan(0);
  });
});
```

### Network Tests (Optional, Manual)

**Location**: `src/services/**/*.live.test.ts`

**Characteristics**:
- Hit live APIs
- Verify service capabilities before release
- Opt-in via CI flag: `TEST_LIVE_PROVIDERS=1 pnpm test`
- Require rate-limit awareness

**Example**:
```typescript
it('queries live Overpass API', async () => {
  if (!process.env.TEST_LIVE_PROVIDERS) {
    this.skip();
  }
  const adapter = new OSMAdapter({ useFixtures: false });
  const ways = await adapter.query(spainBounds);
  expect(ways).toBeDefined();
}, 10000); // 10s timeout
```

---

## Error Handling & Attribution

### Error Propagation

```typescript
// Core module: throw structured errors
function getElevationProfile(path: CoordinateWGS84[]): number[] {
  if (!path.length) {
    throw new GeometryError('Path cannot be empty');
  }
  // ...
}

// Adapter: catch and log
async function query(bounds) {
  try {
    return await fetch(url);
  } catch (err) {
    logger.error('Provider unavailable', { cause: err });
    throw new ProviderError('DEM service down, using cache');
  }
}

// Component: display to user in Spanish
try {
  const route = await calculateRoute(a, b);
} catch (err) {
  if (err instanceof GeometryError) {
    showUserMessage('Puntos inválidos'); // Spanish error
  }
}
```

### Attribution Preservation

```typescript
// Every result includes sources
interface Route {
  waypoints: CoordinateWGS84[];
  segments: RouteSegment[];
  attribution: string[];  // © OpenStreetMap contributors, etc.
}

// Component must display
function RouteViewer({ route }: { route: Route }) {
  return (
    <>
      <map>...</map>
      <div className="attribution">
        {route.attribution.map((attr) => (
          <span key={attr}>{attr}</span>
        ))}
      </div>
    </>
  );
}
```

---

## Build & Deployment

### Web Build Pipeline

```
pnpm build
    ├── Compile TypeScript strict mode
    ├── Bundle with Vite
    ├── Minify & optimize
    ├── Generate sourcemaps
    └── Output to dist/
        ↓
    Serve dist/ as static site
    or deploy to CDN
```

### Desktop Build Pipeline

```
pnpm desktop:build
    ├── Build frontend bundle (same as web)
    ├── Compile Rust backend (cargo build --release)
    ├── Link Rust + Tauri framework
    ├── Code-sign (macOS)
    ├── Create installer
    └── Output .app (macOS) or .exe (Windows)
```

### Testing Before Release

1. **Local verification**:
   ```bash
   pnpm test              # Unit tests
   pnpm build             # Production build
   pnpm preview           # Test prod build locally
   pnpm desktop:dev       # Test desktop on dev
   ```

2. **Live provider verification**:
   ```bash
   TEST_LIVE_PROVIDERS=1 pnpm test
   ```

3. **Manual testing**:
   - Load live providers in browser dev tools
   - Verify all data sources accessible
   - Check attributions display correctly
   - Validate coordinate precision
   - Test error scenarios (provider down, invalid input, etc.)

---

## Performance Considerations

### Web Application

- **Map rendering**: OpenLayers handles large tile sets via quadtree
- **Routing**: Dijkstra optimized for sparse graphs; typically <100ms
- **Elevation queries**: Cached via service adapter
- **Fixtures**: Pre-loaded for fast tests, no network latency

### Desktop Application

- **GeoTIFF raster ops**: Rust + GDAL avoids JS overhead
  - Slope computation: GDAL DEM utilities
  - Classification: GDAL raster algebra
  - Resampling: GDAL overviews for fast preview
- **IPC efficiency**: Minimize serialized data across boundary
- **File I/O**: Native OS calls, not WASM emulation

---

## Conclusion

ViaSpania's architecture enforces:

1. **Separation of concerns**: UI (React) → logic (core) → I/O (services)
2. **Geographic precision**: WGS84 for storage, metres for computation
3. **Immutability**: Data structures frozen at module boundaries
4. **Testability**: Pure functions with fixture-based integration tests
5. **Attribution**: Every result includes data source credits
6. **Multi-platform**: Shared core logic; platform-specific UI (web or Tauri)

This layered, immutable-first design ensures geographic correctness, facilitates testing, and enables confident deployments.
