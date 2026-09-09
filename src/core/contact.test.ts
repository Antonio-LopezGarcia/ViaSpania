import {describe,expect,it} from 'vitest';
import {CONTACT_EMAIL,CONTACT_HREF} from './contact';
import manual from '../../docs/manual.md?raw';
import manualEn from '../../docs/manual.en.md?raw';

describe('contacto institucional',()=>{
  it('utiliza el buzón UGR y su enlace de correo',()=>{
    expect(CONTACT_EMAIL).toBe('antonio.lopez@ugr.es');
    expect(CONTACT_HREF).toBe(`mailto:${CONTACT_EMAIL}`);
  });
  it.each([['es',manual,[CONTACT_EMAIL]],['en',manualEn,[CONTACT_EMAIL]]])('mantiene el manual %s sincronizado con la política de contacto',(_language,text,expectedEmails)=>{
    const emails=text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
    expect(emails??[]).toEqual(expectedEmails);
  });
});
