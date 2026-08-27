import { describe, expect, it } from 'vitest';
import { comparisonRouteColor, indexedRouteColor } from './comparisonColors';
import type { ModelId } from '../types';

describe('colores del visor de comparación', () => {
  it('asigna colores estables y diferentes a modelos consecutivos', () => {
    const models: ModelId[] = ['tobler', 'rees', 'pandolf'];
    const colors = models.map(model => comparisonRouteColor(model, models));
    expect(new Set(colors).size).toBe(models.length);
    expect(comparisonRouteColor('rees', models)).toBe(colors[1]);
  });
  it('mantiene estable el color asignado al índice de un punto',()=>{expect(indexedRouteColor(2)).toBe(indexedRouteColor(2));expect(indexedRouteColor(2)).not.toBe(indexedRouteColor(3))});
});
