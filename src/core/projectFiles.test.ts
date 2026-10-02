import {afterEach,describe,expect,it,vi} from 'vitest';
import {setLanguage} from './i18n';
import {projectBackupDate,projectNameFromPath,projectStudyExtent,reportFileName} from './projectFiles';

describe('nombres de proyecto e informes',()=>{
  it('obtiene el nombre desde la ubicación elegida',()=>expect(projectNameFromPath('/datos/Proyecto Sierra.json')).toBe('Proyecto_Sierra'));
  it('formatea la fecha local de modificación como DDMMAA',()=>expect(projectBackupDate(new Date(2026,8,4).getTime())).toBe('040926'));
  afterEach(()=>{vi.useRealTimers();setLanguage('es')});
  describe.each(['es','en'] as const)('informes en %s',language=>{
    it.each([
      ['route-simple','RSimple'],['route-comparison','RComp'],['multipoint','MultiPn'],
      ['multiroute','MultiRt'],['corridor','Pas'],['isochrones','Isoc'],['viewshed','Vis'],['contours','Curvas'],
    ] as const)('nombra %s con el prefijo y la fecha local de generación', (kind,code)=>{
      setLanguage(language);
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026,8,11,10,33));
      expect(reportFileName(kind,'Guadix')).toBe(`Info_${code}_Guadix_111033.pdf`);
      vi.setSystemTime(new Date(2026,8,12,0,5));
      expect(reportFileName(kind,'Guadix')).toBe(`Info_${code}_Guadix_120005.pdf`);
    });
  });
  it('rellena día, hora y minuto con ceros y conserva la normalización del proyecto',()=>{
    const date=new Date(2026,8,1,2,3);
    expect(reportFileName('route-simple',' Sierra Norte ',date)).toBe('Info_RSimple_Sierra_Norte_010203.pdf');
    expect(reportFileName('viewshed','',date)).toBe('Info_Vis_Proyecto_010203.pdf');
  });
  it('recupera únicamente áreas geográficas válidas',()=>{expect(projectStudyExtent([-4,40,-3,41])).toEqual([-4,40,-3,41]);expect(projectStudyExtent([-3,41,-4,40])).toBeNull();expect(projectStudyExtent(['-4',40,-3,41])).toBeNull()});
});
