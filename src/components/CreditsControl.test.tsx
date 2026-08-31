// @vitest-environment jsdom
import {fireEvent,render,screen} from '@testing-library/react';
import {describe,expect,it} from 'vitest';
import {CreditsControl} from './CreditsControl';
import {BUILD_INFO} from '../core/buildInfo';
describe('CreditsControl',()=>{it('muestra el build exacto que se está ejecutando',()=>{render(<CreditsControl/>);fireEvent.click(screen.getByRole('button',{name:'Créditos'}));expect(screen.getByRole('region',{name:'Compilación en ejecución'})).toBeTruthy();expect(screen.getByText(BUILD_INFO.id)).toBeTruthy();expect(screen.getByText(BUILD_INFO.commit+(BUILD_INFO.dirty?' · cambios locales':''))).toBeTruthy()})});
