import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import BDRDashboard from './components/BDRDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

function ProtectedRoute({ children, requireAdmin = false }) {
  // Bypass protection - allow direct access
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  // Bypass login - create mock user for direct access
  const mockUser = user || { id: '1', email: 'admin@leadrouter.com', role: 'admin', name: 'Admin User' };

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/admin" />} />
      <Route
        path="/admin/*"
        element={<AdminDashboard />}
      />
      <Route
        path="/dashboard"
        element={<BDRDashboard />}
      />
      <Route path="/" element={<Navigate to="/admin" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;

