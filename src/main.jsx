import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import { DateProvider } from './context/DateContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DateProvider>
      <App />
    </DateProvider>
  </React.StrictMode>
);