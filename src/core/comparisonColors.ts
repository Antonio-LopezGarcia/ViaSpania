import type { ModelId } from '../types';

const ROUTE_COLORS = ['#00e5ff', '#ff4d6d', '#d8ff55', '#ffb000', '#b388ff', '#00e676', '#ff6d00', '#40c4ff', '#f500ff', '#ffd600', '#64ffda', '#ff8a80', '#8c9eff', '#76ff03', '#ff4081'] as const;

export function comparisonRouteColor(model: ModelId, modelOrder: readonly ModelId[]) {
  const index = modelOrder.indexOf(model);
  return ROUTE_COLORS[(index < 0 ? 0 : index) % ROUTE_COLORS.length];
}

export function indexedRouteColor(index: number) {
  return ROUTE_COLORS[Math.abs(index) % ROUTE_COLORS.length];
}

export function levelColor(index:number,count:number){
  const hue=205-(count<2?0:index/(count-1))*165,s=.95,l=.58,c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((hue/60)%2-1)),m=l-c/2;
  const [r,g,b]=hue<60?[c,x,0]:hue<120?[x,c,0]:hue<180?[0,c,x]:hue<240?[0,x,c]:hue<300?[x,0,c]:[c,0,x];
  return `#${[r,g,b].map(value=>Math.round((value+m)*255).toString(16).padStart(2,'0')).join('')}`;
}
