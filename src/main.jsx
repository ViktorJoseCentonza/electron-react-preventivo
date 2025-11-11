import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { LanguageProvider } from './contexts/LanguageContext.jsx';
import { QuoteDataProvider } from './contexts/QuoteDataContext.jsx';
import { QuoteStateProvider } from './contexts/QuoteStateContext.jsx';
import { SearchProvider } from './contexts/SearchContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <QuoteDataProvider>
        <QuoteStateProvider>
          <SearchProvider>
            <App />
          </SearchProvider>
        </QuoteStateProvider>
      </QuoteDataProvider>
    </LanguageProvider>
  </StrictMode>
);
