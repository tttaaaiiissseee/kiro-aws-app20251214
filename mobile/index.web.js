import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

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

// React 18の新しいAPIを使用
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);