import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

// Re-running adds new source messages without overwriting the translator's work.
const target='src/core/i18n.it.json';
const previous=fs.existsSync(target)?JSON.parse(fs.readFileSync(target,'utf8')):{messages:{},patterns:[]};
const messages={...previous.messages};
const add=value=>{const text=value.trim().replace(/\s+/g,' ');if(text&&/[a-zA-ZÀ-ÿ]/.test(text))messages[text]??='';};
function scan(file){
 const source=fs.readFileSync(file,'utf8'),tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
 function visit(node){
  if(ts.isConditionalExpression(node)&&/^(?:en|language\s*===\s*['\"]en['\"])$/.test(node.condition.getText(tree))){visit(node.whenFalse);return}
  if(ts.isPropertyAssignment(node)&&/En$/.test(node.name.getText(tree)))return;
  if(ts.isJsxText(node))add(node.text);
  else if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)){
   const parent=node.parent;
   if(!ts.isImportDeclaration(parent)&&!ts.isExportDeclaration(parent)&&!(ts.isPropertyAssignment(parent)&&parent.name===node)&&!ts.isLiteralTypeNode(parent)&&(/\s|[áéíóúñ¿¡]/i.test(node.text)||/^[A-ZÁÉÍÓÚ][a-záéíóúñ]+$/.test(node.text)))add(node.text);
  }else if(ts.isTemplateExpression(node))add(node.head.text+node.templateSpans.map((span,index)=>`{${index}}${span.literal.text}`).join(''));
  ts.forEachChild(node,visit);
 }
 visit(tree);
 return tree;
}
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory()){if(entry.name!=='website')walk(file)}else if(/\.tsx?$/.test(file)&&!/(\.test\.|\.en\.ts|i18nPatterns|italianCatalog|statusMessages|i18n\.tsx)/.test(file))scan(file)}}
walk('src');
for(const key of Object.keys(JSON.parse(fs.readFileSync('src/core/i18n.en.json','utf8'))))add(key);
// Include dictionary keys (the ordinary scanner skips object property names).
const source=fs.readFileSync('src/core/i18n.tsx','utf8');
const tree=ts.createSourceFile('i18n.tsx',source,ts.ScriptTarget.Latest,true);
function keys(node){if(ts.isPropertyAssignment(node)&&ts.isStringLiteral(node.name))add(node.name.text);ts.forEachChild(node,keys)}keys(tree);
// The help viewer strips Markdown formatting before rendering.
for(const line of fs.readFileSync('docs/manual.md','utf8').split('\n'))add(line.trim().replace(/^(?:#{1,3} |\d+\. |[-] )/,'').replace(/\*\*/g,'').replace(/`([^`]+)`/g,'$1').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1'));
const patterns=[...previous.patterns];
for(const file of ['src/core/i18n.tsx','src/core/i18nPatterns.ts']){
 const tree=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
 function visit(node){
  if(ts.isArrayLiteralExpression(node)&&node.elements.length===2&&ts.isRegularExpressionLiteral(node.elements[0])&&ts.isStringLiteral(node.elements[1])){
   const raw=node.elements[0].text,end=raw.lastIndexOf('/'),source=raw.slice(1,end),flags=raw.slice(end+1);
   if(!patterns.some(item=>item.source===source&&item.flags===flags))patterns.push({source,flags,reference:node.elements[1].text,translation:''});
  }ts.forEachChild(node,visit);
 }visit(tree);
}
fs.writeFileSync(target,JSON.stringify({messages:Object.fromEntries(Object.entries(messages).sort(([a],[b])=>a.localeCompare(b,'es'))),patterns},null,2)+'\n');
console.log(`${Object.keys(messages).length} messages, ${patterns.length} patterns; existing translations preserved.`);
