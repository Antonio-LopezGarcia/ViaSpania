const stops=[
  {slope:-30,color:[45,70,210]},
  {slope:-10,color:[40,190,235]},
  {slope:0,color:[220,245,80]},
  {slope:10,color:[255,145,35]},
  {slope:30,color:[220,35,45]},
] as const;

export function slopeColor(percent:number){
  const value=Math.max(-30,Math.min(30,Number.isFinite(percent)?percent:0));
  const upper=stops.findIndex(stop=>value<=stop.slope);
  if(upper<=0){const [r,g,b]=stops[0].color;return `rgb(${r}, ${g}, ${b})`}
  const from=stops[upper-1],to=stops[upper],ratio=(value-from.slope)/(to.slope-from.slope);
  const color=from.color.map((channel,index)=>Math.round(channel+(to.color[index]-channel)*ratio));
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}
