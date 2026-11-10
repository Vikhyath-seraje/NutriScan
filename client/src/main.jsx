// src/main.jsx
// ---------------------------------------------------------
// React application entry point.
// Renders the root <App /> component into #root (index.html).
// StrictMode enables extra development warnings.
// ---------------------------------------------------------

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
