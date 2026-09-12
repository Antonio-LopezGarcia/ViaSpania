import {useEffect} from 'react';
import {observeLocalizedDocument} from '../core/i18n';

export function DetachedWindowPortal({detached,title,onClose,onBlocked}:{detached:boolean;title:string;onClose:()=>void;onBlocked?:()=>void}){
  useEffect(()=>{
    if(!detached)return;
    const viewer=document.querySelector<HTMLElement>('.terrain-3d-overlay'),external=window.open('','viaspania-3d','popup=yes,width=1280,height=820,resizable=yes');
    if(!viewer||!external){onBlocked?.();return}
    external.document.head.replaceChildren(...Array.from(document.head.children).map(node=>node.cloneNode(true)));
    const root=external.document.createElement('div');root.className='detached-3d-root';external.document.body.replaceChildren(root);root.appendChild(viewer);
    external.document.title=title;
    const stopLocalizing=observeLocalizedDocument(external.document);
    const closed=()=>onClose();external.addEventListener('beforeunload',closed);external.focus();
    return()=>{stopLocalizing();external.removeEventListener('beforeunload',closed);if(viewer.isConnected)document.querySelector('#root')?.appendChild(viewer);if(!external.closed)external.close()};
  },[detached,title]);
  return null;
}
