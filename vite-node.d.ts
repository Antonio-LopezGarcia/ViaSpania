declare module 'node:child_process'{export function execFileSync(file:string,args:readonly string[],options:{encoding:'utf8'}):string}
declare module 'node:fs'{export function readFileSync(path:URL,encoding:'utf8'):string}
declare const process:{env:Record<string,string|undefined>;platform:string};
