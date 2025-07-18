import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import AppTherapist from './AppTherapist';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Choose which app to render based on environment variable
const appType = process.env.REACT_APP_TYPE || 'checkin';

root.render(
  <React.StrictMode>
    {appType === 'therapist' ? <AppTherapist /> : <App />}
  </React.StrictMode>
);
