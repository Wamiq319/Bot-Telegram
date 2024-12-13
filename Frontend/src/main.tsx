import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { UserProvider } from './UserContext';  // Import the UserProvider from UserContext
import { TonConnectUIProvider } from '@tonconnect/ui-react';

// Ensure Telegram Web App is ready and manage expansion
declare const Telegram: any;
Telegram.WebApp.ready();

// Check if the Mini App is expanded and expand it if needed
if (!Telegram.WebApp.isExpanded) {
  Telegram.WebApp.expand();
}

// Optionally log the isExpanded value for debugging purposes
console.log("Mini App is expanded:", Telegram.WebApp.isExpanded);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TonConnectUIProvider manifestUrl="https://raw.githubusercontent.com/ATSadi/ton_wallet-main/refs/heads/main/manifest2.json">
      <UserProvider>
        <App />
      </UserProvider>
    </TonConnectUIProvider>
  </React.StrictMode>,
);
