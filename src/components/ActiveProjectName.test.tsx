// @vitest-environment jsdom
import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {setLanguage} from '../core/i18n';
import {ActiveProjectName} from './ActiveProjectName';

afterEach(()=>{cleanup();setLanguage('es')});

it('muestra el proyecto vacío en dos líneas y en ambos idiomas',()=>{
 const {container,rerender}=render(<ActiveProjectName name={null}/>);
 expect(screen.getByLabelText('Proyecto vacío')).toBeTruthy();
 expect(container.querySelectorAll('.active-project-empty>span')).toHaveLength(2);
 setLanguage('en');rerender(<ActiveProjectName name={null}/>);
 expect(screen.getByLabelText('Empty project')).toBeTruthy();
 expect([...container.querySelectorAll('.active-project-empty>span')].map(node=>node.textContent)).toEqual(['Empty','project']);
});

it('sustituye inmediatamente el estado vacío por el nombre',()=>{
 const {rerender}=render(<ActiveProjectName name={null}/>);
 rerender(<ActiveProjectName name="Proyecto_Roma" title="/tmp/Proyecto_Roma.json"/>);
 expect(screen.getByText('Proyecto Roma').getAttribute('title')).toBe('/tmp/Proyecto_Roma.json');
 expect(screen.queryByLabelText('Proyecto vacío')).toBeNull();
 rerender(<ActiveProjectName name={null}/>);
 expect(screen.getByLabelText('Proyecto vacío')).toBeTruthy();
});
