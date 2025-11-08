import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import DefaultLayout from './layouts/DefaultLayout/DefaultLayout';
import EditQuotePage from './pages/EditQuotePage';
import HomePage from './pages/HomePage';
import QuotePage from './pages/QuotePage';

function App() {
  return (
    <Router>
      <DefaultLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/quote" element={<QuotePage />} />
          <Route path="/quote/edit/:fileName" element={<EditQuotePage />} />

          {/* Redirect any unknown route to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DefaultLayout>
    </Router>
  );
}

export default App;
