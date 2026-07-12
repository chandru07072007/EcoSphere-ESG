import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './styles/design-system.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/animations.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0F1629',
            color: '#E8EBF0',
            border: '1px solid #1A2540',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          },
          success: {
            iconTheme: { primary: '#00D4AA', secondary: '#0F1629' },
          },
          error: {
            iconTheme: { primary: '#E05C5C', secondary: '#0F1629' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
