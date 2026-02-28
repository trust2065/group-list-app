import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HistoryPage from './pages/HistoryPage.jsx';
import InputPage from './pages/InputPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import HelpPage from './pages/HelpPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HistoryPage />} />
      <Route path="/new" element={<InputPage />} />
      <Route path="/session/:id" element={<ResultPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
