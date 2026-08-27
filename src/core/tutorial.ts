export const TUTORIAL_COMPLETED_KEY='viaspania.tutorial.completed.v1';

export function shouldStartTutorial(enabled:boolean,completed:string|null){return enabled&&completed!=='true'}
export function tutorialCompleted(){try{return localStorage.getItem(TUTORIAL_COMPLETED_KEY)}catch{return null}}
export function completeTutorial(){try{localStorage.setItem(TUTORIAL_COMPLETED_KEY,'true')}catch{/* El recorrido puede cerrarse aunque no haya almacenamiento. */}}
