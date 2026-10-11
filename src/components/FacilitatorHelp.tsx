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
  marineTitle:'Máscara marítima',marine:'Funciona como una barrera impermeable: impide el paso por las celdas que cubre. Si la crea desde la vista reducida del panel de Selección, por defecto cubre el área situada a 0 metros o por debajo. En la vista ampliada de ese panel puede cambiar los valores de tolerancia de la máscara y realizar una edición más detallada.',
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
  marineTitle:'Marine mask',marine:'It works as an impermeable barrier: movement cannot pass through the cells it covers. When created from the compact view of the Selection panel, it covers areas at 0 metres and below by default. In the expanded view of that panel, you can change the mask’s tolerance values and edit it in greater detail.',
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
 },
 it:{
  eyebrow:'Aiuto specifico',title:'Barriere e facilitatori',close:'Chiudi l’aiuto su barriere e facilitatori',
  intro:'Questi elementi modificano la superficie di costo prima dei calcoli dei percorsi a costo minimo. ViaSpania li adatta alle celle del modello digitale: la risoluzione del modello determina la precisione spaziale effettiva.',
  graphTitle:'Come incidono sul calcolo',graph:[
   'Nei calcoli di percorsi, confronti, multipunto, itinerari multipli, corridoi LCP e isocrone, Dijkstra confronta il costo accumulato dello spostamento tra celle vicine.',
   'Il modello di movimento e il terreno determinano il costo iniziale. In seguito si applicano le penalità delle barriere e i moltiplicatori dei facilitatori.',
   'Un moltiplicatore inferiore a 1 riduce il costo e attira il percorso; 1 lo lascia invariato; un valore superiore a 1 lo aumenta. Le barriere assolute sono escluse dal grafo.',
   'La visibilità e le curve di livello sono analisi geometriche del terreno e non utilizzano queste modifiche al movimento.'
  ],
  barrierTitle:'Barriere',absoluteTitle:'Invalicabile o assoluta',absolute:'Blocca la fascia di celle attraversata dalla linea. Dijkstra non può entrare in quelle celle e deve aggirarle. Se la barriera chiude completamente l’area, potrebbe non esistere un percorso.',
  marineTitle:'Maschera marina',marine:'Funziona come una barriera impermeabile: impedisce il passaggio nelle celle che copre. Se viene creata dalla vista ridotta del pannello Selezione, per impostazione predefinita copre l’area a quota 0 metri o inferiore. Nella vista ampliata dello stesso pannello puoi modificare i valori di tolleranza della maschera e intervenire con maggior dettaglio.',
  permeableTitle:'Permeabile',permeable:'Consente il passaggio, ma moltiplica il costo per il valore selezionato (da 1× a 1000×). 1× è neutro; valori più alti scoraggiano maggiormente l’attraversamento. Se più barriere permeabili si sovrappongono, si mantiene la penalità maggiore.',
  footprintTitle:'Area di influenza',footprint:'La linea viene rasterizzata con un margine di una cella per lato, formando una barriera continua. La sua larghezza effettiva dipende quindi dalla dimensione delle celle del modello e non è una larghezza fisica configurabile.',
  facilitatorTitle:'Facilitatori',corridorTitle:'Corridoio preferenziale',corridor:'Crea una fascia centrata sulla linea. “Larghezza” indica la larghezza totale in metri e “Costo” accetta valori da 0,01× a 1×. Valori più bassi favoriscono maggiormente il corridoio. Il corridoio da solo non può aprire una barriera invalicabile.',
  crossingTitle:'Passaggio: ponte, guado o tunnel',crossing:'I tre tipi identificano la soluzione rappresentata e attualmente seguono la stessa regola di calcolo. La geometria del passaggio rende transitabili le celle che attraversa, comprese quelle di una barriera assoluta, e applica il relativo moltiplicatore di costo.',
  crossingVariables:[
   'Costo: inferiore a 1× favorisce il passaggio, 1× è neutro e superiore a 1× lo mantiene transitabile ma più costoso.',
   'Passaggio obbligatorio: impone che l’itinerario attraversi i suoi vertici. ViaSpania ordina i passaggi obbligatori e i punti intermedi per vicinanza all’origine.',
   'Tipo: ponte, guado o tunnel è una classificazione descrittiva; da solo non aggiunge altezza, pendenza, sagoma libera, portata o restrizioni per i veicoli.'
  ],
  poiTitle:'Punto di interesse',poi:'Nella modalità Influenza spaziale, il raggio definisce l’estensione in metri e l’attrazione riduce gradualmente il costo. La riduzione è massima nel punto e scompare al limite del raggio. La modalità Punto intermedio obbligatorio aggiunge il punto all’itinerario.',
  formula:'moltiplicatore = 1 − attrazione × (1 − distanza / raggio)',
  overlapTitle:'Sovrapposizioni e lettura dei risultati',overlap:[
   'Quando corridoi, passaggi e aree di influenza si sovrappongono, si usa il moltiplicatore più basso, cioè l’effetto più favorevole.',
   'La penalità permeabile e lo sconto si applicano entrambi al costo. Un passaggio può riaprire una barriera assoluta; gli altri facilitatori no.',
   'Nome e categoria servono a identificare e rappresentare l’elemento, ma non ne modificano l’effetto numerico.',
   'Questi parametri esprimono ipotesi dell’analisi. Verifica che geometrie, risoluzione e valori rappresentino lo scenario studiato.'
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
    <section><h3>{text.barrierTitle}</h3><div className="facilitator-help-grid"><div><h4>{text.absoluteTitle}</h4><p>{text.absolute}</p></div><div><h4>{text.permeableTitle}</h4><p>{text.permeable}</p></div><div><h4>{text.footprintTitle}</h4><p>{text.footprint}</p></div></div><h4>{text.marineTitle}</h4><p>{text.marine}</p></section>
    <section><h3>{text.facilitatorTitle}</h3><div className="facilitator-help-grid"><div><h4>{text.corridorTitle}</h4><p>{text.corridor}</p></div><div><h4>{text.crossingTitle}</h4><p>{text.crossing}</p><ul>{text.crossingVariables.map(item=><li key={item}>{item}</li>)}</ul></div><div><h4>{text.poiTitle}</h4><p>{text.poi}</p><code>{text.formula}</code></div></div></section>
    <section><h3>{text.overlapTitle}</h3><ul>{text.overlap.map(item=><li key={item}>{item}</li>)}</ul></section>
   </div>
  </article>
 </div>
}
