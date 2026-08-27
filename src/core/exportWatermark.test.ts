import {describe,expect,it} from 'vitest';
import {exportWatermarkLayout} from './exportWatermark';

describe('marca de agua de exportación',()=>{
  it('queda anclada dentro de la esquina inferior derecha',()=>{const layout=exportWatermarkLayout(1280,720);expect(layout.x+layout.width).toBeLessThan(1280);expect(layout.y+layout.height).toBeLessThan(720);expect(layout.x).toBeGreaterThan(1000);expect(layout.y).toBeGreaterThan(600)});
  it('se adapta a imágenes pequeñas sin salir del lienzo',()=>{const layout=exportWatermarkLayout(120,80);expect(layout.x).toBeGreaterThanOrEqual(0);expect(layout.y).toBeGreaterThanOrEqual(0);expect(layout.x+layout.width).toBeLessThanOrEqual(120);expect(layout.y+layout.height).toBeLessThanOrEqual(80)});
});
