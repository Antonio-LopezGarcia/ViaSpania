import {describe,expect,it} from 'vitest';
import {formatStatusCoordinates} from './statusCoordinates';

describe('coordenadas de la barra de estado',()=>{
  it('muestra latitud antes que longitud en el CRS del proyecto',()=>{
    expect(formatStatusCoordinates({lat:41.90520938746826,lon:12.422617225406457})).toBe('41.905209, 12.422617 · EPSG:4326');
  });

  it('mantiene un marcador estable cuando el cursor sale del visor',()=>{
    expect(formatStatusCoordinates(null)).toContain('EPSG:4326');
  });
});
