import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// UnoCSS virtual import
import 'virtual:uno.css'
// Custom CSS for theme variables
import './index-uno.css'
import { markPerformance } from './utils/performance'

// Mark app initialization start
markPerformance('app-init-start');

// Add performance mark for initial render
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Mark app initialization complete
markPerformance('app-init-complete');