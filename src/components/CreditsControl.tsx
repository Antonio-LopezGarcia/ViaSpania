import {CONTACT_EMAIL,CONTACT_HREF} from '../core/contact';
import {useState,type MouseEvent} from 'react';
import {invoke,isTauri} from '@tauri-apps/api/core';
import viaSpaniaLogo from '../../src-tauri/icons/icon.svg';
import '../exchange-export.css';
import '../credits-build.css';
import '../credits-sources.css';
import {useLanguage,translateText} from '../core/i18n';

const software:[string,string,string][]=[
  ['React, React DOM y Scheduler','React, React DOM and Scheduler','MIT'],['OpenLayers','OpenLayers','BSD-2-Clause'],['Three.js','Three.js','MIT'],['jsPDF y sus componentes de renderizado','jsPDF and its rendering components','MIT y licencias compatibles'],
  ['GeoTIFF.js y códecs raster','GeoTIFF.js and raster codecs','MIT, Apache-2.0, BSD, Zlib y CC0'],['API JavaScript de Tauri y Dialog','Tauri and Dialog JavaScript APIs','Apache-2.0 OR MIT'],
  ['base64 0.22.1 (Rust)','base64 0.22.1 (Rust)','MIT'],
  ['futures-util 0.3.34 (Rust)','futures-util 0.3.34 (Rust)','MIT'],
  ['reqwest 0.12.28 (Rust)','reqwest 0.12.28 (Rust)','MIT'],
  ['serde 1.0.229 (Rust)','serde 1.0.229 (Rust)','MIT'],
  ['serde_json 1.0.151 (Rust)','serde_json 1.0.151 (Rust)','MIT'],
  ['tauri 2.11.5 (Rust)','tauri 2.11.5 (Rust)','MIT'],
  ['tauri-plugin-dialog 2.7.2 (Rust)','tauri-plugin-dialog 2.7.2 (Rust)','MIT'],
  ['thiserror 2.0.20 (Rust)','thiserror 2.0.20 (Rust)','MIT'],
  ['tokio 1.53.1 (Rust)','tokio 1.53.1 (Rust)','MIT'],
  ['url 2.5.8 (Rust)','url 2.5.8 (Rust)','MIT'],
  ['uuid 1.24.1 (Rust)','uuid 1.24.1 (Rust)','MIT'],
  ['@napi-rs/lzma-linux-x64-gnu 1.5.1 (build Linux)','@napi-rs/lzma-linux-x64-gnu 1.5.1 (Linux build)','MIT'],
  ['lerc 3.0.0','lerc 3.0.0','Apache-2.0'],
  ['stackback 0.0.2 (tests)','stackback 0.0.2 (tests)','MIT; formatstack.js: BSD-3-Clause'],
  ['libappindicator-sys 0.9.0 (Linux)','libappindicator-sys 0.9.0 (Linux)','MIT'],
  ['r-efi 5.3.0 y 6.0.0 (UEFI)','r-efi 5.3.0 and 6.0.0 (UEFI)','MIT'],
  ['selectors 0.36.1','selectors 0.36.1','MPL-2.0; GPL-3.0-only vía §3.3'],
  ['winapi-i686/x86_64-pc-windows-gnu 0.4.0 (Windows)','winapi-i686/x86_64-pc-windows-gnu 0.4.0 (Windows)','MIT'],
  ['Dependencias transitivas Rust','Transitive Rust dependencies','MIT, Apache-2.0, MPL-2.0, ISC, Unicode-3.0, CDLA-Permissive-2.0…'],['GDAL','GDAL','MIT/X'],['PROJ','PROJ','MIT'],
];

export function CreditsControl(){
  const [open,setOpen]=useState(false),[linkError,setLinkError]=useState(''),language=useLanguage(),en=language==='en';
  const openResource=(resource:string)=>async(event:MouseEvent<HTMLAnchorElement>)=>{if(!isTauri())return;event.preventDefault();setLinkError('');try{await invoke('open_credits_resource',{resource})}catch{setLinkError(en?'Could not open this credits resource.':'No se pudo abrir este recurso de créditos.')}};
  return <><button onClick={()=>setOpen(true)}>Créditos</button>{open&&<section className="exchange-backdrop"><div className="exchange-dialog credits-dialog">
    <header><img className="credits-header-logo" src={viaSpaniaLogo} alt="ViaSpania"/><div><b>{en?'Credits and licences':translateText('Créditos y licencias',language)}</b></div><button aria-label={en?'Close credits':translateText('Cerrar créditos',language)} onClick={()=>setOpen(false)}>×</button></header>
    <div className="exchange-body">
      <h3>{en?'Creator and maintainer':translateText('Creador y responsable',language)}</h3><p>Antonio López García, Universidad de Granada, 2026.</p><p>{en?'Contact':translateText('Contacto',language)}: <a href={CONTACT_HREF}>{CONTACT_EMAIL}</a></p>
      <h3>{en?'ViaSpania licence':translateText('Licencia de ViaSpania',language)}</h3><p>ViaSpania<br/>Copyright © 2026 Antonio López García, Universidad de Granada<br/>{en?'This program is distributed under the GPL-3.0-only licence.':translateText('Este programa se distribuye bajo la licencia GPL-3.0-only.',language)} <a href="/LICENSE.txt" target="_blank" rel="noreferrer" onClick={openResource('LICENSE.txt')}>{en?'Full notice':translateText('Aviso completo',language)} ↗</a></p>
      <p>{en?'You may copy, modify and redistribute the code under GNU GPL version 3. No warranty is provided, to the extent permitted by law.':translateText('Puede copiar, modificar y redistribuir el código bajo GNU GPL versión 3. No se ofrece garantía, en la medida permitida por la ley.',language)} <a href="/SOURCE_CODE.txt" target="_blank" rel="noreferrer" onClick={openResource('SOURCE_CODE.txt')}>{en?'Corresponding source':translateText('Fuentes correspondientes',language)} ↗</a></p>
      <h3>{en?'Data and network services':translateText('Datos y servicios externos',language)}</h3><p>{en?'IGN/CNIG products and services: © Instituto Geográfico Nacional de España, reuse terms compatible with CC BY 4.0. OpenStreetMap: © OpenStreetMap contributors, ODbL 1.0. OpenTopoMap: map data © OpenStreetMap contributors and SRTM; map style © OpenTopoMap, CC BY-SA 3.0. GeoNames search data: © GeoNames, CC BY 4.0. Copernicus VHR 2021: European Union’s Copernicus Land Monitoring Service information. Copernicus GLO-30 exports carry the mandatory DLR, Airbus, European Union and ESA notice shown in the complete notices.':translateText('Productos y servicios IGN/CNIG: © Instituto Geográfico Nacional de España, condiciones de reutilización compatibles con CC BY 4.0. OpenStreetMap: © colaboradores de OpenStreetMap, ODbL 1.0. OpenTopoMap: datos cartográficos © colaboradores de OpenStreetMap y SRTM; estilo cartográfico © OpenTopoMap, CC BY-SA 3.0. Datos de búsqueda GeoNames: © GeoNames, CC BY 4.0. Copernicus VHR 2021: información del Servicio de Vigilancia Terrestre de Copernicus de la Unión Europea. Las exportaciones Copernicus GLO-30 incorporan el reconocimiento obligatorio a DLR, Airbus, la Unión Europea y ESA recogido en los avisos completos.',language)}</p>
      <h3>{en?'Third party licences':translateText('Licencias de terceros',language)}</h3>
      <p><a href="/compliance/THIRD_PARTY_LICENSES.txt" target="_blank" rel="noreferrer" onClick={openResource('compliance/THIRD_PARTY_LICENSES.txt')}>{en?'Original third-party licence texts':translateText('Textos originales de licencias de terceros',language)} ↗</a> · <a href="/compliance/DATA_NOTICES.txt" target="_blank" rel="noreferrer" onClick={openResource('compliance/DATA_NOTICES.txt')}>{en?'Data terms':translateText('Condiciones de los datos',language)} ↗</a></p>
      <p>{en?'ViaSpania preserves attributions and licence notices. Scientific formulae are cited in each profile and in the manual.':translateText('ViaSpania conserva atribuciones y avisos de licencia. Las fórmulas científicas se citan en cada perfil y en el manual.',language)}</p>
      <p><a href="/THIRD_PARTY_NOTICES.txt" target="_blank" rel="noreferrer" onClick={openResource('THIRD_PARTY_NOTICES.txt')}>{en?'Complete production dependency notices':translateText('Avisos completos de dependencias de producción',language)} ↗</a></p>
      <p>{en?'MIT is the licence used for the eleven direct Rust dependencies listed above. Transitive dependencies retain their own licences; the complete notices include the selected MIT texts.':translateText('MIT es la licencia utilizada para las once dependencias directas Rust indicadas. Las dependencias transitivas conservan sus propias licencias; los avisos completos incluyen los textos MIT seleccionados.',language)}</p>
      <table><thead><tr><th>{en?'Component':translateText('Componente',language)}</th><th>{en?'Licence':translateText('Licencia',language)}</th></tr></thead><tbody>{software.map(([name,nameEn,license])=><tr key={name}><td>{en?nameEn:name}</td><td>{license}</td></tr>)}</tbody></table>
      <section className="credits-funding" aria-label={en?'Institutional funding':translateText('Financiación institucional',language)}>
        <h3>{en?'Institutional funding':translateText('Financiación institucional',language)}</h3>
        <p>{en?'This application is a result of the grant RYC2022-037730-I funded by MICIU/AEI/10.13039/501100011033 and by ESF+.':translateText('Este programa es resultado de la ayuda RYC2022-037730-I financiada por MICIU/AEI/10.13039/501100011033 y por ESF+.',language)}</p>
        <a href="/funding/miciu-ue-aei.jpg" target="_blank" rel="noreferrer" onClick={openResource('funding/miciu-ue-aei.jpg')} aria-label={en?'View funding logos at full resolution':translateText('Ver logotipos de financiación a resolución completa',language)}>
          <img translate="no" src="/funding/miciu-ue-aei.jpg" width="15237" height="2953" alt="Ministerio de Ciencia, Innovación y Universidades (MICIU); Cofinanciado por la Unión Europea; Agencia Estatal de Investigación (AEI)"/>
        </a>
      </section>
      {linkError&&<p role="alert">{linkError}</p>}
    </div><footer><button className="primary" onClick={()=>setOpen(false)}>{en?'Close':translateText('Cerrar',language)}</button></footer>
  </div></section>}</>;
}
