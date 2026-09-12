// @vitest-environment jsdom
import {useState} from 'react';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {ModelLoadPanel} from './ModelLoadPanel';
afterEach(cleanup);
it('permite plegar y volver a abrir sin perder la selección del modelo',()=>{
  function Panel(){const [expanded,setExpanded]=useState(true);return <ModelLoadPanel expanded={expanded} onExpandedChange={setExpanded}><select aria-label="Modelo de elevación" defaultValue="5"><option value="5">MDT05</option><option value="25">MDT25</option></select></ModelLoadPanel>}
  render(<Panel/>);
  const toggle=screen.getByRole('button',{name:'Cargar modelo'}),select=screen.getByRole('combobox');
  fireEvent.change(select,{target:{value:'25'}});
  fireEvent.click(toggle);
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByRole('combobox')).toBeNull();
  fireEvent.click(toggle);
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('25');
});
it('refleja el cierre tras la carga y permite solicitar la reapertura',()=>{
 const {rerender}=render(<ModelLoadPanel expanded onExpandedChange={()=>{}}>Datos del modelo</ModelLoadPanel>);
 rerender(<ModelLoadPanel expanded={false} onExpandedChange={()=>{}}>Datos del modelo</ModelLoadPanel>);
 const toggle=screen.getByRole('button',{name:'Cargar modelo'});
 expect(toggle.getAttribute('aria-expanded')).toBe('false');
 expect(document.getElementById(toggle.getAttribute('aria-controls')!)?.hidden).toBe(true);
});
it('coloca el contenido después del botón para desplegarlo hacia abajo',()=>{
 render(<ModelLoadPanel expanded onExpandedChange={()=>{}}>Datos del modelo</ModelLoadPanel>);
 const toggle=screen.getByRole('button',{name:'Cargar modelo'}),content=document.getElementById(toggle.getAttribute('aria-controls')!);
 expect(toggle.nextElementSibling).toBe(content);
 expect(toggle.textContent).toContain('▴');
});
