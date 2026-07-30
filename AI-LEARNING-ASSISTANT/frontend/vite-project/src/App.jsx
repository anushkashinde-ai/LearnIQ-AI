import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage.jsx';
import NotFoudPage from './pages/NotFoudPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import DashboardPage from './pages/Dashboard/DashboardPage.jsx';
import DocumentListPage from './pages/Documents/DocumentListPage.jsx';
import DocumentDetailPage from './pages/Documents/DocumentDetailPage.jsx';
import FlashcardListPage from './pages/Flashcards/FlashcardListPage.jsx';
import FlashcardPage from './pages/Flashcards/FlashcardPage.jsx';
import QuizListPage from './pages/Quizzes/QuizListPage.jsx';
import QuizTakePage from './pages/Quizzes/QuizTakePage.jsx';
import QuizResultPage from './pages/Quizzes/QuizResultPage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';

const App = () => {
  const {isAuthenticated, loading} = useAuth()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>

        {/* Default Route */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>

          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/documents" element={<DocumentListPage />} />

          <Route path="/documents/:id" element={<DocumentDetailPage />} />

          <Route path="/flashcards" element={<FlashcardListPage />} />

          <Route
            path="/documents/:id/flashcards"
            element={<FlashcardPage />}
          />

          <Route path="/quizzes" element={<QuizListPage />} />

          <Route
            path="/quizzes/:quizId"
            element={<QuizTakePage />}
          />

          <Route
            path="/quizzes/:quizId/results"
            element={<QuizResultPage />}
          />

          <Route path="/profile" element={<ProfilePage />} />

        </Route>

        {/* 404 Page */}
        <Route path="*" element={<NotFoudPage />} />

      </Routes>
    </Router>
  );
};

export default App;