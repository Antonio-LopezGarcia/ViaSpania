import {TerrainWindowApp} from './components/NativeTerrainWindow';
import { StrictMode } from 'react'; import { createRoot } from 'react-dom/client'; import App from './App';
import {loadAppSettings} from './core/appSettings';
import {LocalizationBoundary,setLanguage} from './core/i18n';
setLanguage(loadAppSettings().language??'es');
createRoot(document.getElementById('root')!).render(<StrictMode><LocalizationBoundary>{new URLSearchParams(location.search).has('terrainWindow')?<TerrainWindowApp/>:<App/>}</LocalizationBoundary></StrictMode>);
