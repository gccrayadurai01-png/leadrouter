import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import RepsManagement from './admin/RepsManagement';
import ManualAssignment from './admin/ManualAssignment';
import AssignmentsHistory from './admin/AssignmentsHistory';
import AuditLogs from './admin/AuditLogs';
import QueueStats from './admin/QueueStats';

// Use empty string for relative paths in production, localhost for development
// Use empty string for relative paths in production, localhost for development
// Handle both undefined and empty string cases
const getApiUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  // If explicitly set (even if empty string), use it
  if (envUrl !== undefined) {
    return envUrl;
  }
  // If running on production domain (not localhost), use relative paths
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '';
  }
  // Default to localhost for development
  return 'http://localhost:3001';
};
const API_URL = getApiUrl();

// Mock user for direct access
const mockUser = { id: '1', email: 'admin@leadrouter.com', role: 'admin', name: 'Admin User' };

function AdminDashboard() {
  const { user: authUser, logout } = useAuth();
  const user = authUser || mockUser; // Use mock user if auth is bypassed
  const location = useLocation();

  const navigation = [
    { name: 'Reps', path: '/admin/reps' },
    { name: 'Manual Assign', path: '/admin/manual' },
    { name: 'Queue Stats', path: '/admin/stats' },
    { name: 'Assignments', path: '/admin/assignments' },
    { name: 'Audit Logs', path: '/admin/audit' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">LeadRouter</h1>
              <p className="text-sm text-gray-600">Admin Dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.name || user?.email}</span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation */}
        <nav className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {navigation.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/reps" element={<RepsManagement />} />
          <Route path="/manual" element={<ManualAssignment />} />
          <Route path="/stats" element={<QueueStats />} />
          <Route path="/assignments" element={<AssignmentsHistory />} />
          <Route path="/audit" element={<AuditLogs />} />
          <Route path="/" element={<Navigate to="/admin/reps" />} />
        </Routes>
      </div>
    </div>
  );
}

export default AdminDashboard;

