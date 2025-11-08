import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import DefaultLayout from './layouts/DefaultLayout/DefaultLayout';
import HomePage from './pages/HomePage';
import QuotePage from './pages/QuotePage';
// import QuoteExportPage from './pages/QuoteExportPage';
// import QuoteEditPage from './pages/QuoteEditPage';

function App() {
  return (
    <Router>
      <DefaultLayout>
        <Routes>

          <Route path="/" element={<HomePage />} />
          <Route path="/quote" element={<QuotePage />} />
          {/* <Route path="/quote/export" element={<QuoteExportPage />} />
        <Route path="/quote/edit/:id" element={<QuoteEditPage />} />
        Redirect any unknown route to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </DefaultLayout >
    </Router>
  );
}

export default App;
