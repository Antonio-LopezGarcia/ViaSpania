import type { ModelId } from '../types';

// The colour ramp follows the movement-model sequence shown in the selector.
// Fixed assignments keep each model recognizable when the visible set changes.
const MODEL_COLOR_ORDER: readonly ModelId[] = [
  'tobler', 'tobler-off', 'marquez-perez', 'kondo-seino', 'irmischer-clarke',
  'uriarte-gonzalez', 'marin-arroyo', 'rees', 'gkrs', 'tripcevich', 'alberti',
  'pandolf', 'pandolf-corrected', 'minetti', 'herzog', 'ardigo',
  'llobera-sluckin', 'wheeled', 'eastman',
];

function sequentialRouteColor(index: number, count: number) {
  // Traverse nearly the full hue wheel so neighbouring models are easier to tell apart.
  const hue = (180 - index / (count - 1) * 355 + 360) % 360;
  const saturation = 0.95, lightness = 0.58;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
  const match = lightness - chroma / 2;
  const [r, g, b] = hue < 60 ? [chroma, x, 0] : hue < 120 ? [x, chroma, 0] : hue < 180 ? [0, chroma, x] : hue < 240 ? [0, x, chroma] : hue < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return `#${[r, g, b].map(value => Math.round((value + match) * 255).toString(16).padStart(2, '0')).join('')}`;
}

const MODEL_ROUTE_COLORS = Object.fromEntries(
  MODEL_COLOR_ORDER.map((model, index) => [model, sequentialRouteColor(index, MODEL_COLOR_ORDER.length)]),
) as Record<ModelId, string>;
const ROUTE_COLORS = MODEL_COLOR_ORDER.map(model => MODEL_ROUTE_COLORS[model]);

export function comparisonRouteColor(model: ModelId, _modelOrder: readonly ModelId[]) {
  return MODEL_ROUTE_COLORS[model];
}

export function indexedRouteColor(index: number) {
  return ROUTE_COLORS[Math.abs(index) % ROUTE_COLORS.length];
}

export function levelColor(index:number,count:number){
  const hue=205-(count<2?0:index/(count-1))*165,s=.95,l=.58,c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((hue/60)%2-1)),m=l-c/2;
  const [r,g,b]=hue<60?[c,x,0]:hue<120?[x,c,0]:hue<180?[0,c,x]:hue<240?[0,x,c]:hue<300?[x,0,c]:[c,0,x];
  return `#${[r,g,b].map(value=>Math.round((value+m)*255).toString(16).padStart(2,'0')).join('')}`;
}
