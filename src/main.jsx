import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { LanguageProvider } from './contexts/LanguageContext.jsx'
import { QuoteProvider } from './contexts/QuoteContext.jsx'; // import your context provider
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <QuoteProvider>
        <App />
      </QuoteProvider>
    </LanguageProvider>
  </StrictMode>,
)
