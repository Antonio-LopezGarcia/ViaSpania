import {useEffect} from 'react';
import {useLanguage} from '../core/i18n';
import '../calculation-help.css';

interface Props { onClose:()=>void }

const copy={
 es:{
  eyebrow:'Ayuda específica',title:'Barreras y facilitadores',close:'Cerrar ayuda sobre barreras y facilitadores',
  intro:'Estos elementos modifican la superficie de coste antes de ejecutar los cálculos de caminos mínimos. ViaSpania los adapta a las celdas del modelo digital: la resolución del modelo determina la precisión espacial efectiva.',
  graphTitle:'Cómo intervienen en el cálculo',graph:[
   'En los cálculos de rutas, comparaciones, multipunto, multirruta, pasillos LCP e isócronas, Dijkstra compara el coste acumulado de avanzar entre celdas vecinas.',
   'Primero se obtiene el coste del modelo de desplazamiento y del terreno. Después se aplican las penalizaciones de barrera y los multiplicadores de los facilitadores.',
   'Un multiplicador menor que 1 abarata el tránsito y atrae el trazado; 1 no lo cambia; un valor mayor que 1 lo encarece. Las barreras absolutas se excluyen del grafo.',
   'Visibilidad y curvas de nivel son análisis geométricos del modelo y no utilizan estas modificaciones de tránsito.'
  ],
  barrierTitle:'Barreras',absoluteTitle:'Infranqueable o absoluta',absolute:'Bloquea la banda de celdas atravesada por la línea. Dijkstra no puede entrar en esas celdas y debe rodearlas. Si la barrera cierra por completo el área, puede no existir una ruta.',
  permeableTitle:'Permeable',permeable:'Permite atravesar la línea, pero multiplica el coste por el valor indicado (de 1× a 1000×). 1× es neutro; cuanto mayor sea el valor, menos probable será el cruce. Si se superponen varias barreras permeables, se conserva la penalización mayor.',
  footprintTitle:'Área de influencia',footprint:'La línea se rasteriza con un margen de una celda a cada lado para formar una barrera continua. Por tanto, su anchura efectiva depende del tamaño de celda del modelo; no representa una anchura física configurable.',
  facilitatorTitle:'Facilitadores',corridorTitle:'Corredor preferente',corridor:'Crea una banda centrada en la línea. “Anchura” es el ancho total en metros y “Coste” admite de 0,01× a 1×. Un valor bajo favorece con más fuerza el corredor. El corredor por sí solo no abre una barrera infranqueable.',
  crossingTitle:'Paso: puente, vado o túnel',crossing:'Los tres tipos identifican la solución representada y se muestran con la misma regla de cálculo. La geometría del paso vuelve transitables las celdas que corta, incluida una barrera absoluta, y les aplica su multiplicador de coste.',
  crossingVariables:[
   'Coste: menos de 1× favorece el paso, 1× es neutro y más de 1× lo hace transitable pero más costoso.',
   'Paso obligatorio: obliga a que el itinerario recorra sus vértices. ViaSpania ordena los pasos obligatorios y los puntos de paso por proximidad desde el origen.',
   'Tipo: puente, vado o túnel es una clasificación descriptiva; no añade por sí mismo altura, pendiente, gálibo, caudal ni restricciones de vehículo.'
  ],
  poiTitle:'Punto de interés',poi:'En “Influencia espacial”, el radio define el alcance en metros y la atracción reduce gradualmente el coste. La reducción es máxima en el punto y desaparece en el borde del radio. En “Paso obligatorio”, el punto se incorpora al itinerario.',
  formula:'multiplicador = 1 − atracción × (1 − distancia / radio)',
  overlapTitle:'Coincidencias y lectura de resultados',overlap:[
   'Entre corredores, pasos y áreas de influencia coincidentes se usa el multiplicador más bajo, es decir, el efecto más favorable.',
   'La penalización permeable y el descuento se aplican ambos al coste. Un paso puede reabrir una barrera absoluta; los demás facilitadores no.',
   'Nombre y categoría sirven para identificar y representar el elemento, pero no cambian el valor numérico.',
   'Estos parámetros expresan hipótesis del análisis. Compruebe que geometrías, resolución y valores representan el escenario estudiado.'
  ]
 },
 en:{
  eyebrow:'Specific help',title:'Barriers and facilitators',close:'Close help about barriers and facilitators',
  intro:'These features modify the cost surface before least-cost calculations run. ViaSpania maps them onto the digital model cells, so model resolution determines their effective spatial precision.',
  graphTitle:'How they affect calculations',graph:[
   'For routes, comparisons, multipoint, multi-route, LCP corridors and isochrones, Dijkstra compares the accumulated cost of moving between neighbouring cells.',
   'The movement model and terrain produce the initial cost. Barrier penalties and facilitator multipliers are then applied.',
   'A multiplier below 1 reduces cost and attracts the route; 1 leaves it unchanged; above 1 increases it. Absolute barriers are removed from the graph.',
   'Viewshed and contour calculations are geometric terrain analyses and do not use these movement modifiers.'
  ],
  barrierTitle:'Barriers',absoluteTitle:'Impassable or absolute',absolute:'Blocks the band of cells crossed by the line. Dijkstra cannot enter those cells and must go around them. A route may be impossible if the barrier closes the entire area.',
  permeableTitle:'Permeable',permeable:'Allows crossing but multiplies cost by the selected value (1× to 1000×). 1× is neutral; larger values discourage crossing more strongly. Where permeable barriers overlap, the largest penalty is retained.',
  footprintTitle:'Area of influence',footprint:'The line is rasterised with a one-cell margin on each side to form a continuous barrier. Its effective width therefore depends on model cell size and is not a configurable physical width.',
  facilitatorTitle:'Facilitators',corridorTitle:'Preferred corridor',corridor:'Creates a band centred on the line. Width is the total width in metres and Cost accepts 0.01× to 1×. Lower values favour the corridor more strongly. A corridor alone cannot open an impassable barrier.',
  crossingTitle:'Crossing: bridge, ford or tunnel',crossing:'All three types identify the represented solution and currently use the same calculation rule. The crossing geometry makes intersected cells traversable, including cells in an absolute barrier, and applies its cost multiplier.',
  crossingVariables:[
   'Cost: below 1× favours the crossing, 1× is neutral and above 1× keeps it traversable but makes it more costly.',
   'Required crossing: forces the itinerary through its vertices. ViaSpania orders required crossings and waypoints by proximity from the origin.',
   'Type: bridge, ford or tunnel is descriptive; it does not by itself add height, gradient, clearance, flow or vehicle restrictions.'
  ],
  poiTitle:'Point of interest',poi:'In Spatial influence mode, Radius sets the reach in metres and Attraction gradually reduces cost. The reduction is strongest at the point and disappears at the radius boundary. Required waypoint adds the point to the itinerary.',
  formula:'multiplier = 1 − attraction × (1 − distance / radius)',
  overlapTitle:'Overlaps and interpreting results',overlap:[
   'Where corridors, crossings and influence areas overlap, the lowest multiplier is used: the most favourable effect.',
   'A permeable penalty and a discount are both applied to cost. A crossing can reopen an absolute barrier; other facilitators cannot.',
   'Name and category identify and display a feature but do not alter its numeric effect.',
   'These parameters express analysis assumptions. Check that geometry, resolution and values represent the scenario being studied.'
  ]
 }
} as const;

export function FacilitatorHelp({onClose}:Props){
 const language=useLanguage(),text=copy[language];
 useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose()};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[onClose]);
 return <div className="calculation-help-overlay" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
  <article className="calculation-help-window facilitator-help-window" role="dialog" aria-modal="true" aria-labelledby="facilitator-help-title">
   <header><div><small>{text.eyebrow}</small><h2 id="facilitator-help-title">{text.title}</h2></div><button type="button" onClick={onClose} aria-label={text.close}>×</button></header>
   <div className="calculation-help-body facilitator-help-body">
    <p className="facilitator-help-intro">{text.intro}</p>
    <section><h3>{text.graphTitle}</h3><ul>{text.graph.map(item=><li key={item}>{item}</li>)}</ul></section>
    <section><h3>{text.barrierTitle}</h3><div className="facilitator-help-grid"><div><h4>{text.absoluteTitle}</h4><p>{text.absolute}</p></div><div><h4>{text.permeableTitle}</h4><p>{text.permeable}</p></div><div><h4>{text.footprintTitle}</h4><p>{text.footprint}</p></div></div></section>
    <section><h3>{text.facilitatorTitle}</h3><div className="facilitator-help-grid"><div><h4>{text.corridorTitle}</h4><p>{text.corridor}</p></div><div><h4>{text.crossingTitle}</h4><p>{text.crossing}</p><ul>{text.crossingVariables.map(item=><li key={item}>{item}</li>)}</ul></div><div><h4>{text.poiTitle}</h4><p>{text.poi}</p><code>{text.formula}</code></div></div></section>
    <section><h3>{text.overlapTitle}</h3><ul>{text.overlap.map(item=><li key={item}>{item}</li>)}</ul></section>
   </div>
  </article>
 </div>
}
