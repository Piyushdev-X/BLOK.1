import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OnboardingPage from './pages/OnboardingPage';
import FeedPage from './pages/FeedPage';
import TaskDetailPage from './pages/TaskDetailPage';
import PostTaskPage from './pages/PostTaskPage';
import WalletPage from './pages/WalletPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('blok_token');
  if (!token) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

function RootRedirect() {
  const token = localStorage.getItem('blok_token');
  if (token) {
    return <Navigate to="/feed" replace />;
  }
  return <Navigate to="/onboarding" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/feed" element={
          <ProtectedRoute><FeedPage /></ProtectedRoute>
        } />
        <Route path="/task/:task_id" element={
          <ProtectedRoute><TaskDetailPage /></ProtectedRoute>
        } />
        <Route path="/post" element={
          <ProtectedRoute><PostTaskPage /></ProtectedRoute>
        } />
        <Route path="/wallet" element={
          <ProtectedRoute><WalletPage /></ProtectedRoute>
        } />
        <Route path="/chat/:task_id" element={
          <ProtectedRoute><ChatPage /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
