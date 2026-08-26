import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initAuth } from './store/authStore';
import './index.css';

// Registered once, outside the store, so it can't race the collection load.
initAuth();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
