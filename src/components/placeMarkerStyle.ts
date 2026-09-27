import {Fill,RegularShape,Stroke,Style} from 'ol/style';

export function placeMarkerStyle(){
  return new Style({image:new RegularShape({points:3,radius:6,fill:new Fill({color:'#f59e0b'}),stroke:new Stroke({color:'#78350f',width:1})})});
}
