import type {Barrier} from '../types';

/** Returns every independent line that belongs to one logical barrier. */
export function barrierParts(barrier:Pick<Barrier,'coordinates'|'additionalParts'>):[number,number][][] {
 return [barrier.coordinates,...(barrier.additionalParts??[])];
}
