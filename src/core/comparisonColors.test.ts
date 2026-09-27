import { describe, expect, it } from 'vitest';
import { comparisonRouteColor, indexedRouteColor } from './comparisonColors';
import { MODELS } from './costModels';
import type { ModelId } from '../types';

describe('colores del visor de comparación', () => {
  it('asigna colores estables y diferentes a modelos consecutivos', () => {
    const models: ModelId[] = ['tobler', 'rees', 'pandolf'];
    const colors = models.map(model => comparisonRouteColor(model, models));
    expect(new Set(colors).size).toBe(models.length);
    expect(comparisonRouteColor('rees', models)).toBe(colors[1]);
  });
  it('asigna un color único y estable a cada modelo disponible', () => {
    const models: ModelId[] = ['tobler','tobler-off','marquez-perez','kondo-seino','irmischer-clarke','uriarte-gonzalez','marin-arroyo','rees','gkrs','tripcevich','alberti','pandolf','pandolf-corrected','minetti','herzog','ardigo','llobera-sluckin','wheeled','eastman'];
    const colors = models.map(model => comparisonRouteColor(model, models));
    expect(models).toHaveLength(Object.keys(MODELS).length);
    expect(new Set(colors).size).toBe(models.length);
    expect(comparisonRouteColor(models[0], models)).toBe(comparisonRouteColor(models[0], models.slice(1)));
  });
  it('mantiene estable el color asignado al índice de un punto',()=>{expect(indexedRouteColor(2)).toBe(indexedRouteColor(2));expect(indexedRouteColor(2)).not.toBe(indexedRouteColor(3))});
});
