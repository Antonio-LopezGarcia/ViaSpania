type PlaceCoordinate = {readonly longitude:number;readonly latitude:number};
export function samePlace(a:PlaceCoordinate,b:PlaceCoordinate){return a.longitude===b.longitude&&a.latitude===b.latitude}
export function addSearchedPlace<T extends PlaceCoordinate>(places:readonly T[],place:T):T[]{
 return places.some(item=>samePlace(item,place))?[...places]:[...places,place];
}
export function removeSearchedPlace<T extends PlaceCoordinate>(places:readonly T[],place:PlaceCoordinate):T[]{
 return places.filter(item=>!samePlace(item,place));
}
