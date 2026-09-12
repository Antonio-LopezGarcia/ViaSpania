// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it} from 'vitest';
import {CreditsControl} from './CreditsControl';
import {setLanguage} from '../core/i18n';
import {BUILD_INFO} from '../core/buildInfo';
afterEach(()=>{cleanup();setLanguage('es')});
describe('CreditsControl',()=>{it('muestra el build exacto, los avisos de licencia y una financiación situada al final',()=>{render(<CreditsControl/>);fireEvent.click(screen.getByRole('button',{name:'Créditos'}));expect(screen.getByRole('region',{name:'Compilación en ejecución'})).toBeTruthy();expect(screen.getByText(BUILD_INFO.id)).toBeTruthy();expect(screen.getByText(BUILD_INFO.commit+(BUILD_INFO.dirty?' · cambios locales':''))).toBeTruthy();expect(screen.getByRole('link',{name:/Aviso completo/}).getAttribute('href')).toBe('/LICENSE.txt');expect(screen.getByRole('link',{name:/Avisos completos/}).getAttribute('href')).toBe('/THIRD_PARTY_NOTICES.txt');const funding=screen.getByRole('region',{name:'Financiación institucional'});expect(funding.previousElementSibling?.textContent).toContain('Copernicus GLO-30')});});

it.each([
  ['es', 'Financiación institucional', 'Este programa es resultado de la ayuda RYC2022-037730-I financiada por MICIU/AEI/10.13039/501100011033 y por ESF+.'],
  ['en', 'Institutional funding', 'This application is a result of the grant RYC2022-037730-I funded by MICIU/AEI/10.13039/501100011033 and by ESF+.'],
] as const)('reconoce la financiación en %s y conserva el logotipo institucional', (language, label, acknowledgement)=>{
  setLanguage(language);
  render(<CreditsControl/>);
  fireEvent.click(screen.getByRole('button',{name:'Créditos'}));
  expect(screen.getByRole('link',{name:'antonio.lopez@ugr.es'}).getAttribute('href')).toBe('mailto:antonio.lopez@ugr.es');
  const funding=screen.getByRole('region',{name:label});
  expect(funding.textContent).toContain(acknowledgement);
  const logo=screen.getByRole('img',{name:'Ministerio de Ciencia, Innovación y Universidades (MICIU); Cofinanciado por la Unión Europea; Agencia Estatal de Investigación (AEI)'});
  expect(funding.contains(logo)).toBe(true);
  expect(logo.getAttribute('src')).toBe('/funding/miciu-ue-aei.jpg');
  expect(logo.getAttribute('width')).toBe('15237');
  expect(logo.getAttribute('height')).toBe('2953');
  expect(logo.closest('a')?.getAttribute('href')).toBe(logo.getAttribute('src'));
});
