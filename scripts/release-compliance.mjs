import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const candidates=process.platform==='win32'?['python','python3']:['python3','/opt/homebrew/bin/python3','python3.11'];
const python=candidates.find(command=>spawnSync(command,['-c','import sys;sys.exit(0 if sys.version_info >= (3,11) else 1)'],{stdio:'ignore'}).status===0);
if(!python){console.error('El expediente de licencias necesita Python 3.11 o posterior (biblioteca estándar).');process.exit(1)}
if(process.argv[2]==='test'){const result=spawnSync(python,['-m','unittest','discover','-s',fileURLToPath(new URL('./compliance',import.meta.url)),'-p','test_*.py'],{stdio:'inherit'});process.exit(result.status??1)}
const result=spawnSync(python,[fileURLToPath(new URL('./compliance/release.py',import.meta.url)),...process.argv.slice(2)],{stdio:'inherit'});
if(result.error)console.error(`No se pudo ejecutar la comprobación de licencias: ${result.error.message}`);
process.exit(result.status??1);
