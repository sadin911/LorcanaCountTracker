import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initAuth } from './store/authStore';
import { analytics } from './utils/analytics';
import './index.css';

// Initialize services outside the store
analytics.init();
initAuth();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
