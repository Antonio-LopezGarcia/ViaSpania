import {useState} from 'react';
import '../exchange-export.css';
import '../credits-build.css';
import {BUILD_INFO,buildDateLabel} from '../core/buildInfo';
import {useLanguage} from '../core/i18n';

const software:[string,string,string][]=[
  ['React, React DOM y tipos React','React, React DOM and React types','MIT'],['OpenLayers','OpenLayers','BSD-2-Clause'],['Three.js y tipos Three.js','Three.js and Three.js types','MIT'],['jsPDF','jsPDF','MIT'],
  ['Tauri, Tauri Build, Tauri CLI y complemento Dialog','Tauri, Tauri Build, Tauri CLI and Dialog plugin','Apache-2.0 OR MIT'],['Vite y @vitejs/plugin-react','Vite and @vitejs/plugin-react','MIT'],['TypeScript','TypeScript','Apache-2.0'],
  ['Vitest','Vitest','MIT'],['Testing Library para React','Testing Library for React','MIT'],['jsdom','jsdom','MIT'],['GDAL','GDAL','MIT/X'],['PROJ','PROJ','MIT'],['Rust y Cargo','Rust and Cargo','Apache-2.0 OR MIT'],
  ['Tokio','Tokio','MIT'],['Reqwest','Reqwest','Apache-2.0 OR MIT'],['Serde y Serde JSON','Serde and Serde JSON','Apache-2.0 OR MIT'],['Futures Util','Futures Util','Apache-2.0 OR MIT'],
  ['URL','URL','MIT OR Apache-2.0'],['UUID','UUID','Apache-2.0 OR MIT'],['Base64','Base64','MIT OR Apache-2.0'],['Thiserror','Thiserror','MIT OR Apache-2.0'],
];

export function CreditsControl(){
  const [open,setOpen]=useState(false),language=useLanguage(),en=language==='en';
  return <><button onClick={()=>setOpen(true)}>Créditos</button>{open&&<section className="exchange-backdrop"><div className="exchange-dialog credits-dialog">
    <header><div><b>{en?'Credits and licences':'Créditos y licencias'}</b><span>{en?'ViaSpania · territorial analysis':'ViaSpania · análisis territorial'}</span></div><button aria-label={en?'Close credits':'Cerrar créditos'} onClick={()=>setOpen(false)}>×</button></header>
    <div className="exchange-body">
      <section className="credits-build" aria-label={en?'Running build':'Compilación en ejecución'}><h3>{en?'Running build':'Compilación en ejecución'}</h3><dl><div><dt>{en?'Version':'Versión'}</dt><dd>{BUILD_INFO.version}</dd></div><div><dt>{en?'Exact build':'Build exacto'}</dt><dd><code>{BUILD_INFO.id}</code></dd></div><div><dt>Commit</dt><dd><code>{BUILD_INFO.commit}{BUILD_INFO.dirty?(en?' · local changes':' · cambios locales'):''}</code></dd></div><div><dt>{en?'Built':'Compilado'}</dt><dd>{buildDateLabel(BUILD_INFO.builtAt)} · {BUILD_INFO.platform}</dd></div></dl></section>
      <h3>{en?'Creator and maintainer':'Creador y responsable'}</h3><p>Antonio López García, 2026.</p><p>{en?'Contact':'Contacto'}: <a href="mailto:antonio-lopez-garcia@hotmail.com">antonio-lopez-garcia@hotmail.com</a></p>
      <p>{en?'ViaSpania preserves attributions and licence notices. Scientific formulae are cited in each profile and in the manual.':'ViaSpania conserva atribuciones y avisos de licencia. Las fórmulas científicas se citan en cada perfil y en el manual.'}</p>
      <table><thead><tr><th>{en?'Component':'Componente'}</th><th>{en?'Licence':'Licencia'}</th></tr></thead><tbody>{software.map(([name,nameEn,license])=><tr key={name}><td>{en?nameEn:name}</td><td>{license}</td></tr>)}</tbody></table>
      <h3>{en?'Data and cartography':'Datos y cartografía'}</h3><p>{en?'Orthophotography, DTM data, historical cartography, administrative boundaries and settlement names: Instituto Geográfico Nacional / Centro Nacional de Información Geográfica, subject to their reuse conditions. European VHR 2021 mosaic: Copernicus Land Monitoring Service / European Environment Agency. Community map: © OpenStreetMap contributors, Open Database License (ODbL) 1.0.':'Ortofotografía, MDT, cartografía histórica, límites administrativos y núcleos de población: Instituto Geográfico Nacional / Centro Nacional de Información Geográfica, sujetos a sus condiciones de reutilización. Mosaico europeo VHR 2021: Copernicus Land Monitoring Service / Agencia Europea de Medio Ambiente. Mapa comunitario: © colaboradores de OpenStreetMap, Open Database License (ODbL) 1.0.'}</p>
      <h3>{en?'Export and formats':'Exportación y formatos'}</h3><p>{en?'PDF files are generated with jsPDF. Captures, watermarks, GIFs and videos are produced locally using Canvas, the built-in encoder and the MediaRecorder web APIs; content is not sent to external services.':'Los PDF se generan con jsPDF. Las capturas, marcas de agua, GIF y vídeo se producen localmente mediante Canvas, codificación propia y las API web MediaRecorder, sin enviar el contenido a servicios externos.'}</p>
      <h3>{en?'Model limitations':'Limitaciones del modelo'}</h3><p>{en?'The DTM only describes elevation. A mathematical optimum does not guarantee a path, permission, passability or safety. ViaSpania must not be used for emergencies.':'El MDT solo describe elevación. El óptimo matemático no garantiza camino, permiso, transitabilidad ni seguridad. ViaSpania no debe utilizarse para emergencias.'}</p>
      <h3>{en?'Calculation basis':'Base de cálculo'}</h3><p>{en?'The methodological and calculation basis acknowledges the R package ': 'La base metodológica y de cálculo reconoce el paquete R '}<i>movecost</i>{en?', created and maintained by Gianmarco Alberti.':', creado y mantenido por Gianmarco Alberti.'}</p>
      <p className="hint">{en?'Transitive dependencies retain their own copyright and licence notices in their distributions.':'Las dependencias transitivas mantienen sus propios avisos de copyright y licencia dentro de sus distribuciones.'}</p>
    </div><footer><button className="primary" onClick={()=>setOpen(false)}>{en?'Close':'Cerrar'}</button></footer>
  </div></section>}</>;
}
