import {Icon,Style} from 'ol/style';

const scopeSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
  <g fill="none" stroke-linecap="round">
    <circle cx="18" cy="18" r="9" stroke="#07100d" stroke-width="5"/>
    <path d="M18 2v8M18 26v8M2 18h8M26 18h8" stroke="#07100d" stroke-width="5"/>
    <circle cx="18" cy="18" r="9" stroke="#d8ff55" stroke-width="2"/>
    <path d="M18 2v8M18 26v8M2 18h8M26 18h8" stroke="#d8ff55" stroke-width="2"/>
    <circle cx="18" cy="18" r="2.5" stroke="#d8ff55" stroke-width="2"/>
  </g>
</svg>`;

const scopeUrl=`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(scopeSvg)}`;

export function selectionMarkerStyle(){return new Style({image:new Icon({src:scopeUrl,scale:.68,anchor:[.5,.5],anchorXUnits:'fraction',anchorYUnits:'fraction'})})}
