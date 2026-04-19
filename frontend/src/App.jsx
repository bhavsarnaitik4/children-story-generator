import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import StoryGenerator from './pages/StoryGenerator';
import AuthPage from './pages/AuthPage';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/auth" />;
  return children;
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/generate" element={
            <ProtectedRoute>
              <StoryGenerator />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
