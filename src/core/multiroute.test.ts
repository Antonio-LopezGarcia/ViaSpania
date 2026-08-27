import { describe, expect, it } from 'vitest';
import { sequentialPairs } from './multiroute';

describe('multirruta secuencial',()=>{
  it('conecta cada punto únicamente con el siguiente',()=>{
    expect(sequentialPairs([1,2,3,4])).toEqual([[1,2],[2,3],[3,4]]);
  });

  it('no crea tramos si faltan dos puntos',()=>{
    expect(sequentialPairs([1])).toEqual([]);
  });
});
