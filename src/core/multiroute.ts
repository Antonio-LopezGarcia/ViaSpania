export function sequentialPairs<T>(items: readonly T[]): readonly (readonly [T,T])[] {
  return items.slice(1).map((item,index)=>[items[index],item] as const);
}

export function directedPairs<T>(items: readonly T[]) {
  return items.flatMap((from,row)=>items.flatMap((to,column)=>row===column?[]:[{from,to,row,column}]));
}
