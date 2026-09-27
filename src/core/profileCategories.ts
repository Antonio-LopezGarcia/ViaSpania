import {MODELS} from './costModels';
import type {ModelId} from '../types';

export const PROFILE_CATEGORIES=[
 {name:'Tiempo de desplazamiento',models:(Object.values(MODELS).filter(model=>model.unit==='s').map(model=>model.id))},
 {name:'Energía metabólica',models:Object.values(MODELS).filter(model=>['J','J/kg','kJ'].includes(model.unit)).map(model=>model.id)},
 {name:'Coste relativo',models:Object.values(MODELS).filter(model=>model.unit==='coste relativo').map(model=>model.id)},
] as const satisfies readonly {name:string;models:readonly ModelId[]}[];
