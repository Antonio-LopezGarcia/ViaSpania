import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const candidates=process.platform==='win32'?['python','python3']:['python3','/opt/homebrew/bin/python3','python3.11'];
const python=candidates.find(command=>spawnSync(command,['-c','import sys;sys.exit(0 if sys.version_info >= (3,11) else 1)'],{stdio:'ignore'}).status===0);
if(!python){console.error('El conversor MP4 necesita Python 3.11 o posterior.');process.exit(1)}
const result=spawnSync(python,[fileURLToPath(new URL('./prepare-video.py',import.meta.url)),...process.argv.slice(2)],{stdio:'inherit'});
if(result.error)console.error(`No se pudo preparar el conversor MP4: ${result.error.message}`);
process.exit(result.status??1);
