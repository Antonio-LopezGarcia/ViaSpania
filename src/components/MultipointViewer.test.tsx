// @vitest-environment jsdom
import { cleanup,render,screen } from '@testing-library/react';
import { afterEach,describe,expect,it } from 'vitest';
import { MultipointViewer } from './MultipointViewer';

afterEach(cleanup);
describe('acceso al visor multipunto',()=>{
  it('permanece oculto mientras no existen conexiones calculadas',()=>{
    render(<MultipointViewer connections={[]} points={[]} selectedPointId={null} barriers={[]} corridors={[]} crossings={[]} initialView={{center:[0,0],resolution:1,rotation:0}} studyExtent={null}/>);
    expect(screen.queryByRole('button',{name:/Abrir visor multipunto/})).toBeNull();
  });
});
