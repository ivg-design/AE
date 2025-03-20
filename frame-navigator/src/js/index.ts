import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './main/main';

// Mount the app to the root element
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(App));
}

// Simple console log for development
console.log('Frame Navigator initialized'); 