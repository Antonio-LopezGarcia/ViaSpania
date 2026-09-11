import {spawnSync} from 'node:child_process';

const option='--no-experimental-webstorage';
const nodeOptions=[process.env.NODE_OPTIONS,option].filter(Boolean).join(' ');
const result=spawnSync(process.execPath,['node_modules/vitest/vitest.mjs','run','src'],{
  env:{...process.env,NODE_OPTIONS:nodeOptions},
  stdio:'inherit',
});

if(result.error)console.error(`No se pudieron ejecutar los tests: ${result.error.message}`);
process.exit(result.status??1);
