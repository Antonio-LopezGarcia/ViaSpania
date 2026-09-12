import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scripts = path.dirname(fileURLToPath(import.meta.url));
if(process.env.VIASPANIA_USE_PREPARED_GEOSPATIAL==='1'){
  const verified=spawnSync(process.execPath,[path.join(scripts,'release-compliance.mjs'),'check'],{stdio:'inherit'});
  process.exit(verified.status??1);
}

let command;
if (process.platform === 'win32') {
  command = ['powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(scripts, 'prepare-geospatial-bundle.windows.ps1')]];
} else if (process.platform === 'darwin') {
  command = ['bash', [path.join(scripts, 'prepare-geospatial-bundle.sh')]];
} else if (process.platform === 'linux') {
  command = ['bash', [path.join(scripts, 'prepare-geospatial-bundle.linux.sh')]];
} else {
  console.error(`Sistema no compatible para empaquetar GDAL/PROJ: ${process.platform}`);
  process.exit(1);
}

const result = spawnSync(command[0], command[1], { stdio: 'inherit' });
if (result.error) {
  console.error(`No se pudo iniciar la preparación geoespacial: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
