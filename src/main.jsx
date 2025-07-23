import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
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