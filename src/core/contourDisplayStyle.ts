import {levelColor} from './comparisonColors';

export interface ContourDisplayStyle {
  mode:'topographic'|'elevation';
  color:'#111111'|'#ffffff'|'#ff8c00'|'#d8ff55';
  majorInterval:0|3|5|10;
}

export const DEFAULT_CONTOUR_DISPLAY_STYLE:ContourDisplayStyle={mode:'topographic',color:'#111111',majorInterval:5};

export function styleContourLines<T extends {level:number;coordinates:[number,number][]}>(lines:readonly T[],style:ContourDisplayStyle,contourIntervalM?:number){
  const levels=[...new Set(lines.map(line=>line.level))].sort((a,b)=>a-b);
  const inferredInterval=levels.slice(1).map((level,index)=>level-levels[index]).filter(step=>step>0).sort((a,b)=>a-b)[0];
  const interval=contourIntervalM&&contourIntervalM>0?contourIntervalM:inferredInterval;
  return lines.map(line=>{
    const index=levels.indexOf(line.level),contourIndex=interval?Math.round(line.level/interval):index,color=style.mode==='elevation'?levelColor(index,levels.length):style.color,major=style.majorInterval!==0&&((contourIndex%style.majorInterval)+style.majorInterval)%style.majorInterval===0;
    return{...line,color,width:major?2.2:1,halo:style.mode==='elevation'?'#ffffff':style.color==='#111111'?'#ffffff':'#111111'};
  });
}
