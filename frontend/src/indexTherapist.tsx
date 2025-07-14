import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppTherapist from './AppTherapist';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AppTherapist />
  </React.StrictMode>
); 