// Must stay first. When the app has been killed, Android starts a headless runtime just to run
// this task; registering it before any UI module loads means a failure elsewhere in App's import
// graph cannot leave the live-location task undefined and silently drop the rider's fixes.
import './src/location/riderBackgroundLocationTask';

import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);
