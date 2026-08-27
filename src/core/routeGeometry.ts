import type { StudyExtent } from '../components/MapPanel';

export type LonLat = [number, number];

export function gridPathToLonLat(path: readonly number[], width: number, height: number, extent: StudyExtent): LonLat[] {
  if (width < 1 || height < 1) throw new Error('La rejilla de ruta no es válida');
  const [west, south, east, north] = extent;
  return path.map(index => {
    const column = index % width;
    const row = Math.floor(index / width);
    if (index < 0 || row >= height) throw new Error('La ruta contiene una celda fuera de la rejilla');
    return [west + ((column + 0.5) / width) * (east - west), north - ((row + 0.5) / height) * (north - south)];
  });
}

export function gridPathBetweenPoints(path: readonly number[], width: number, height: number, start: LonLat, end: LonLat): LonLat[] {
  if (width < 2 || height < 2) throw new Error('La rejilla de ruta necesita al menos 2 × 2 celdas');
  const deltaLon = end[0] - start[0];
  const deltaLat = end[1] - start[1];
  return path.map(index => {
    const column = index % width;
    const row = Math.floor(index / width);
    if (index < 0 || row >= height) throw new Error('La ruta contiene una celda fuera de la rejilla');
    const x = column / (width - 1);
    const y = row / (height - 1);
    const progress = (x + y) / 2;
    const deviation = (y - x) / 2;
    return [
      start[0] + progress * deltaLon - deviation * deltaLat,
      start[1] + progress * deltaLat + deviation * deltaLon,
    ];
  });
}

export function routeToPercent(coordinates: readonly LonLat[], extent: StudyExtent): string {
  const [west, south, east, north] = extent;
  const width = east - west;
  const height = north - south;
  if (width <= 0 || height <= 0) throw new Error('El área de estudio no es válida');
  return coordinates.map(([lon, lat]) => `${((lon - west) / width) * 100},${((north - lat) / height) * 100}`).join(' ');
}
