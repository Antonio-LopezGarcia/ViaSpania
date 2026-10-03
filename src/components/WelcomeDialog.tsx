import {setLanguage as applyLanguage, translateText, type AppLanguage} from '../core/i18n';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { AppSettings } from '../core/appSettings';
import { BUILD_INFO } from '../core/buildInfo';
import '../exchange-export.css';
import '../welcome.css';

const WELCOME_DURATION_MS=5000;
const LOADING_PATH='M 8 36 C 42 36 42 10 76 10 S 110 62 144 62 S 178 10 212 10 S 246 62 280 62 S 314 10 348 10 S 382 62 416 62 S 450 36 488 36';

export function WelcomeDialog({settings,onSave,onStartTutorial}:{settings:AppSettings;onSave:(settings:AppSettings)=>void;onStartTutorial:()=>void}){
  const progressMaskId=useId();
  const [open,setOpen]=useState(true);
  const [firstRun]=useState(()=>settings.firstRunCompleted!==true);
  const [language,setLanguage]=useState<AppLanguage>(settings.language??'es');
  const [startTutorial,setStartTutorial]=useState(settings.tutorialEnabled);
  const [error,setError]=useState(false);
  const dialogRef=useRef<HTMLDialogElement>(null),en=language==='en';
  useLayoutEffect(()=>{
    if(!open)return;
    const dialog=dialogRef.current!;
    dialog.showModal();
    return()=>dialog.close();
  },[open]);
  const finish=()=>{
    if(!firstRun){setOpen(false);return}
    try{onSave({...settings,language,tutorialEnabled:startTutorial,firstRunCompleted:true})}
    catch{setError(true);return}
    setOpen(false);
    if(startTutorial)onStartTutorial();
  };
  const finishRef=useRef(finish);
  useLayoutEffect(()=>{finishRef.current=finish});
  useEffect(()=>{
    if(!open)return;
    const timer=window.setTimeout(()=>finishRef.current(),WELCOME_DURATION_MS);
    return()=>window.clearTimeout(timer);
  },[open]);
  if(!open)return null;
  return <dialog ref={dialogRef} className="exchange-dialog welcome-dialog" aria-labelledby="welcome-title" translate="no" onCancel={event=>event.preventDefault()}>
    <div className="exchange-body">
      <div className="brand"><span className="mark" role="img" aria-label="ViaSpania">VS</span><b>ViaSpania</b></div>
      <h1 id="welcome-title">{en?'Welcome to ViaSpania':translateText('Bienvenido a ViaSpania',language)}</h1>
      <p>{en?'Version':translateText('Versión',language)} {BUILD_INFO.version}</p>
      <p>Copyright © 2026 Antonio López García, Universidad de Granada</p>
      {firstRun&&<><label>{translateText('Idioma / Language',language)}<select autoFocus value={language} onChange={event=>{const selected=event.target.value as AppLanguage;setLanguage(selected);applyLanguage(selected)}}><option value="es">Español</option><option value="en">English</option><option value="it">Italiano</option></select></label>
      <label className="check"><input type="checkbox" checked={startTutorial} onChange={event=>setStartTutorial(event.target.checked)}/>{en?'Start the tutorial':translateText('Iniciar el tutorial',language)}</label></>}
      {!error&&<svg className="welcome-loading" viewBox="0 0 496 72" role="progressbar" aria-label={en?'Starting ViaSpania':translateText('Iniciando ViaSpania',language)}>
        <defs><mask id={progressMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="496" height="72">
          <path className="welcome-loading-reveal" d={LOADING_PATH} pathLength="100" style={{animationDuration:`${WELCOME_DURATION_MS}ms`}}/>
        </mask></defs>
        <path className="welcome-loading-track" d={LOADING_PATH}/>
        <path className="welcome-loading-fill" d={LOADING_PATH} mask={`url(#${progressMaskId})`}/>
      </svg>}
      {error&&<p role="alert">{translateText('No se pudieron guardar las preferencias. Vuelva a intentarlo.',language)}{en?' / Preferences could not be saved. Please try again.':translateText('',language)}</p>}
    </div>
    {firstRun&&<footer><button className="primary" onClick={finish}>{en?'Continue':translateText('Continuar',language)}</button></footer>}
  </dialog>;
}
