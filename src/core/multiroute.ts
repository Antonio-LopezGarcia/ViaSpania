export function sequentialPairs<T>(items: readonly T[]): readonly (readonly [T,T])[] {
  return items.slice(1).map((item,index)=>[items[index],item] as const);
}
