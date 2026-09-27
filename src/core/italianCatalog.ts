/** Catalogue-only translation. Captured values are data, never translated. */
export interface TranslationCatalog {
 readonly messages:Readonly<Record<string,string>>;
 readonly patterns:readonly {readonly source:string;readonly flags:string;readonly reference:string;readonly translation:string}[];
}
const escapeRegex=(value:string)=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const placeholders=(value:string)=>[...value.matchAll(/\{(\d+)\}/g)].map(match=>match[1]).sort().join(',');
export function createCatalogTranslator(catalog:TranslationCatalog){
 const exact=new Map(Object.entries(catalog.messages).filter(([source,target])=>target.trim()&&placeholders(source)===placeholders(target)));
 const templates=[...exact].filter(([source])=>/\{\d+\}/.test(source)).map(([source,target])=>{
  const ids:string[]=[];let cursor=0,pattern='^';
  for(const match of source.matchAll(/\{(\d+)\}/g)){pattern+=escapeRegex(source.slice(cursor,match.index))+'([\\s\\S]*?)';ids.push(match[1]);cursor=match.index!+match[0].length}
  return {regex:new RegExp(pattern+escapeRegex(source.slice(cursor))+'$'),target,ids,specificity:source.replace(/\{\d+\}/g,'').length};
 }).sort((a,b)=>b.specificity-a.specificity);
 const captureTokens=(value:string)=>[...value.matchAll(/\$\d+/g)].map(match=>match[0]).sort().join(',');
 const patterns=catalog.patterns.filter(item=>item.translation.trim()&&captureTokens(item.reference)===captureTokens(item.translation)).map(item=>({...item,regex:new RegExp(item.source,item.flags)}));
 function translate(value:string):string{
  if(!value.trim())return value;
  const trimmed=value.trim(),direct=exact.get(trimmed);
  if(direct!==undefined)return value.replace(trimmed,()=>direct);
  for(const {regex,target,ids} of templates){const match=trimmed.match(regex);if(match){const captures=Object.fromEntries(ids.map((id,index)=>[id,match[index+1]]));return value.replace(trimmed,()=>target.replace(/\{(\d+)\}/g,(_,id:string)=>captures[id]))}}
  const translated=patterns.reduce((text,item)=>text.replace(item.regex,item.translation),value);
  if(translated!==value)return translated;
  // Labels and values in reports are frequently joined into a single string.
  const clauses=value.split(/(\n| · |: )/);
  if(clauses.length>1)return clauses.map((part,index)=>index%2?part:translate(part)).join('');
  return value;
 }
 return translate;
}
