import {describe,expect,it} from 'vitest';
import {projectNameFromPath,projectStudyExtent,reportFileName} from './projectFiles';

describe('nombres de proyecto e informes',()=>{
  it('obtiene el nombre desde la ubicación elegida',()=>expect(projectNameFromPath('/datos/Proyecto Sierra.json')).toBe('Proyecto_Sierra'));
  it('usa los códigos pedidos y secuencias independientes',()=>{expect(reportFileName('route-simple','Sierra Norte',1)).toBe('Informe_RSimple_Sierra_Norte.pdf');expect(reportFileName('route-simple','Sierra Norte',2)).toBe('Informe_RSimple_Sierra_Norte_2.pdf');expect(reportFileName('viewshed','Sierra Norte',1)).toBe('Informe_Vis_Sierra_Norte.pdf')});
  it('recupera únicamente áreas geográficas válidas',()=>{expect(projectStudyExtent([-4,40,-3,41])).toEqual([-4,40,-3,41]);expect(projectStudyExtent([-3,41,-4,40])).toBeNull();expect(projectStudyExtent(['-4',40,-3,41])).toBeNull()});
});
