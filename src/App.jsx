import { Navigate, Route, HashRouter as Router, Routes } from 'react-router-dom';
import DefaultLayout from './layouts/DefaultLayout/DefaultLayout';
import HomePage from './pages/HomePage/HomePage';
import QuoteEditorPage from './pages/QuoteEditorPage/QuoteEditorPage';

function App() {
  return (
    <Router>
      <DefaultLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/quote" element={<QuoteEditorPage />} />
          <Route path="/quote/edit/:fileName" element={<QuoteEditorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DefaultLayout>
    </Router>
  );
}

export default App;
