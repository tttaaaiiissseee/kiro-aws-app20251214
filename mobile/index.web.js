import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Web用のスタイルを追加
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }
    #root {
      height: 100vh;
      width: 100vw;
    }
  `;
  document.head.appendChild(style);
}

AppRegistry.registerComponent(appName, () => App);
AppRegistry.runApplication(appName, {
  initialProps: {},
  rootTag: document.getElementById('root'),
});