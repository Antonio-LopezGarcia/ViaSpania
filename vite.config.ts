import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function git(argument:string){try{return execFileSync('git',argument.split(' '),{encoding:'utf8'}).trim()}catch{return''}}
const tauriConfig=JSON.parse(readFileSync(new URL('./src-tauri/tauri.conf.json',import.meta.url),'utf8')) as {version:string};
const commit=process.env.GITHUB_SHA||git('rev-parse HEAD')||'sin-commit';
const dirty=Boolean(git('status --porcelain'));
const sourceEpoch=Number(process.env.SOURCE_DATE_EPOCH);
const builtAt=new Date(Number.isFinite(sourceEpoch)&&sourceEpoch>0?sourceEpoch*1000:Date.now()).toISOString();
const platform=(process.env.TAURI_ENV_PLATFORM||process.env.RUNNER_OS||process.platform).toLowerCase();
const buildId=`${tauriConfig.version}+${commit.slice(0,12)}${dirty?'.dirty':''}.${builtAt.replace(/[-:]/g,'').replace('.000','')}.${platform}`;
export default defineConfig({
  plugins: [react()],
  define: {
    __VIASPANIA_VERSION__:JSON.stringify(tauriConfig.version),
    __VIASPANIA_BUILD_ID__:JSON.stringify(buildId),
    __VIASPANIA_BUILD_COMMIT__:JSON.stringify(commit),
    __VIASPANIA_BUILD_DIRTY__:JSON.stringify(dirty),
    __VIASPANIA_BUILD_TIME__:JSON.stringify(builtAt),
    __VIASPANIA_BUILD_PLATFORM__:JSON.stringify(platform),
  },
  server: { port: 1420, strictPort: true },
  build: {rollupOptions: {input: {app: 'index.html', web: 'web/index.html'}}},
});
