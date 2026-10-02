// @vitest-environment jsdom
import {describe,expect,it} from 'vitest';
import {installLinuxFormControls} from './linuxFormControls';

describe('estilos de formularios Linux',()=>{
  it.each(['Linux x86_64','Linux aarch64'])('reconoce Tauri con user agent personalizado: %s',platform=>{
    const target=document.implementation.createHTMLDocument();
    installLinuxFormControls(target,'ViaSpania/0.2.4 (https://github.com/traxtiber/ViaSpania)',platform);
    expect(target.querySelector('#linux-form-controls')).not.toBeNull();
  });
  it.each([
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/605.1.15 Version/60.5 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
  ])('instala una sola hoja en Linux: %s',userAgent=>{
    const target=document.implementation.createHTMLDocument();
    installLinuxFormControls(target,userAgent);
    installLinuxFormControls(target,userAgent);
    expect(target.querySelectorAll('#linux-form-controls')).toHaveLength(1);
    expect(target.head.textContent).toContain('appearance: none');
    // DetachedWindowPortal copies head children; no OS class on <html> is needed.
    const popup=document.implementation.createHTMLDocument();
    popup.head.replaceChildren(...Array.from(target.head.children).map(node=>node.cloneNode(true)));
    expect(popup.querySelector('#linux-form-controls')?.textContent).toBe(target.querySelector('#linux-form-controls')?.textContent);
  });
  it.each([
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36',
  ])('no modifica los estilos de otras plataformas: %s',userAgent=>{
    const target=document.implementation.createHTMLDocument();
    const before=target.documentElement.outerHTML;
    installLinuxFormControls(target,userAgent);
    expect(target.documentElement.outerHTML).toBe(before);
  });
});
