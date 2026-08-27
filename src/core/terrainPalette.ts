export type TerrainPaletteId='grayscale'|'terrain'|'hypsometric'|'viridis'|'alpine';
type Stop=readonly [elevationM:number,r:number,g:number,b:number];

export const TERRAIN_PALETTE_STOPS:Record<Exclude<TerrainPaletteId,'grayscale'>,readonly Stop[]>={
 terrain:[[-50,15,60,125],[0,35,105,170],[1,55,145,75],[300,140,185,80],[700,215,190,115],[1300,165,115,75],[2200,205,205,195],[3500,255,255,255]],
 hypsometric:[[-50,35,75,160],[0,50,130,210],[1,45,150,80],[250,130,195,70],[600,235,220,85],[1000,220,145,65],[1600,155,90,65],[2400,205,205,205],[3500,255,255,255]],
 viridis:[[-50,68,1,84],[0,68,1,84],[500,59,82,139],[1000,33,145,140],[1500,94,201,98],[2200,253,231,37],[3500,253,231,37]],
 alpine:[[-50,8,48,107],[0,20,95,160],[250,50,145,95],[700,145,190,110],[1200,185,150,100],[1800,135,115,105],[2400,210,220,225],[3500,255,255,255]],
};

export function terrainPaletteRgb(value:number,min:number,max:number,palette:string):[number,number,number]{
 if(palette==='grayscale'){const ratio=Math.max(0,Math.min(1,(value-min)/Math.max(max-min,1e-6)));return[ratio,ratio,ratio]}
 const stops=TERRAIN_PALETTE_STOPS[palette as Exclude<TerrainPaletteId,'grayscale'>]??TERRAIN_PALETTE_STOPS.terrain;
 if(value<=stops[0][0])return stops[0].slice(1).map(channel=>channel/255) as [number,number,number];
 const upper=stops.findIndex(stop=>value<=stop[0]);
 if(upper<0)return stops.at(-1)!.slice(1).map(channel=>channel/255) as [number,number,number];
 const from=stops[upper-1],to=stops[upper],ratio=(value-from[0])/Math.max(to[0]-from[0],1e-9);
 return [1,2,3].map(channel=>(from[channel]+(to[channel]-from[channel])*ratio)/255) as [number,number,number];
}
