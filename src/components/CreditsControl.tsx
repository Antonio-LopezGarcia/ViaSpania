import {useState} from 'react';
import '../exchange-export.css';

const software=[
  ['React, React DOM y tipos React','MIT'],['OpenLayers','BSD-2-Clause'],['Three.js y tipos Three.js','MIT'],['jsPDF','MIT'],
  ['Tauri, Tauri Build, Tauri CLI y complemento Dialog','Apache-2.0 OR MIT'],['Vite y @vitejs/plugin-react','MIT'],['TypeScript','Apache-2.0'],
  ['Vitest','MIT'],['Testing Library para React','MIT'],['jsdom','MIT'],['GDAL','MIT/X'],['PROJ','MIT'],['Rust y Cargo','Apache-2.0 OR MIT'],
  ['Tokio','MIT'],['Reqwest','Apache-2.0 OR MIT'],['Serde y Serde JSON','Apache-2.0 OR MIT'],['Futures Util','Apache-2.0 OR MIT'],
  ['URL','MIT OR Apache-2.0'],['UUID','Apache-2.0 OR MIT'],['Base64','MIT OR Apache-2.0'],['Thiserror','MIT OR Apache-2.0'],
];

export function CreditsControl(){
  const [open,setOpen]=useState(false);
  return <><button onClick={()=>setOpen(true)}>Créditos</button>{open&&<section className="exchange-backdrop"><div className="exchange-dialog credits-dialog">
    <header><div><b>Créditos y licencias</b><span>ViaSpania · análisis territorial</span></div><button aria-label="Cerrar créditos" onClick={()=>setOpen(false)}>×</button></header>
    <div className="exchange-body">
      <h3>Creador y responsable</h3><p>Antonio López García, 2026.</p><p>Contacto: <a href="mailto:antonio-lopez-garcia@hotmail.com">antonio-lopez-garcia@hotmail.com</a></p>
      <p>ViaSpania conserva atribuciones y avisos de licencia. Las fórmulas científicas se citan en cada perfil y en el manual.</p>
      <table><thead><tr><th>Componente</th><th>Licencia</th></tr></thead><tbody>{software.map(([name,license])=><tr key={name}><td>{name}</td><td>{license}</td></tr>)}</tbody></table>
      <h3>Datos y cartografía</h3><p>Ortofotografía, MDT, cartografía histórica, límites administrativos y núcleos de población: Instituto Geográfico Nacional / Centro Nacional de Información Geográfica, sujetos a sus condiciones de reutilización. Mosaico europeo VHR 2021: Copernicus Land Monitoring Service / Agencia Europea de Medio Ambiente. Mapa comunitario: © colaboradores de OpenStreetMap, Open Database License (ODbL) 1.0.</p>
      <h3>Exportación y formatos</h3><p>Los PDF se generan con jsPDF. Las capturas, marcas de agua, GIF y vídeo se producen localmente mediante Canvas, codificación propia y las API web MediaRecorder, sin enviar el contenido a servicios externos.</p>
      <h3>Limitaciones del modelo</h3><p>El MDT solo describe elevación. El óptimo matemático no garantiza camino, permiso, transitabilidad ni seguridad. ViaSpania no debe utilizarse para emergencias.</p>
      <h3>Base de cálculo</h3><p>La base metodológica y de cálculo reconoce el paquete R <i>movecost</i>, creado y mantenido por Gianmarco Alberti.</p>
      <p className="hint">Las dependencias transitivas mantienen sus propios avisos de copyright y licencia dentro de sus distribuciones.</p>
    </div><footer><button className="primary" onClick={()=>setOpen(false)}>Cerrar</button></footer>
  </div></section>}</>;
}
