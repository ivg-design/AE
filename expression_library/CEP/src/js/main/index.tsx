// src/main/index.tsx
import React from 'react';
import ReactDOM from 'react-dom';
import App from './main';
import '../index.css'; // Adjusted the path to go up one level

ReactDOM.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
	document.getElementById('root')
);
