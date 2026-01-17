import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import QueuePanel from './QueuePanel';
import ToastContainer from './ToastContainer';
import AssignmentCharts from './AssignmentCharts';
import ManualAssignmentButton from './ManualAssignmentButton';
import { useToast } from '../hooks/useToast';

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
const mockUser = { id: '1', email: 'bdr@leadrouter.com', role: 'bdr', name: 'BDR User' };

function BDRDashboard() {
  const { user: authUser, logout } = useAuth();
  const user = authUser || mockUser; // Use mock user if auth is bypassed
  const { toasts, removeToast, success, error } = useToast();
  const [smbNextRep, setSmbNextRep] = useState(null);
  const [entNextRep, setEntNextRep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState({ smb: false, ent: false });
  const [lastAssignment, setLastAssignment] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [smbReps, setSmbReps] = useState([]);
  const [entReps, setEntReps] = useState([]);
  const [dateRange, setDateRange] = useState({ fromDate: '', toDate: '' });

  useEffect(() => {
    fetchNextReps();
    fetchDashboardStats();
    fetchReps();
    const interval = setInterval(() => {
      fetchNextReps();
      fetchDashboardStats();
    }, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReps = async () => {
    try {
      const [smbResponse, entResponse] = await Promise.all([
        axios.get(`${API_URL}/api/reps?queue=SMB`),
        axios.get(`${API_URL}/api/reps?queue=ENT`),
      ]);
      // Include all reps (active and inactive) for manual assignment
      setSmbReps(smbResponse.data.reps);
      setEntReps(entResponse.data.reps);
    } catch (error) {
      console.error('Error fetching reps:', error);
    }
  };

  const fetchDashboardStats = async (range = dateRange) => {
    try {
      let url = `${API_URL}/api/assignments/dashboard-stats`;
      const params = new URLSearchParams();
      if (range.fromDate) params.append('fromDate', range.fromDate);
      if (range.toDate) params.append('toDate', range.toDate);
      if (params.toString()) url += '?' + params.toString();
      
      const response = await axios.get(url);
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleFilterChange = (range) => {
    setDateRange(range);
    fetchDashboardStats(range);
  };

  const fetchNextReps = async () => {
    try {
      const [smbResponse, entResponse] = await Promise.all([
        axios.get(`${API_URL}/api/assignments/next/SMB`),
        axios.get(`${API_URL}/api/assignments/next/ENT`),
      ]);
      setSmbNextRep(smbResponse.data);
      setEntNextRep(entResponse.data);
    } catch (error) {
      console.error('Error fetching next reps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (queue) => {
    setAssigning({ ...assigning, [queue.toLowerCase()]: true });
    try {
      const response = await axios.post(`${API_URL}/api/assignments/assign/${queue}`);
      setLastAssignment({
        queue,
        rep: response.data.rep.name,
        timestamp: new Date()
      });
      success(`✓ Lead assigned to ${response.data.rep.name} in ${queue} queue!`);
      fetchNextReps(); // Refresh
    } catch (err) {
      error(err.response?.data?.error || 'Failed to assign lead');
    } finally {
      setAssigning({ ...assigning, [queue.toLowerCase()]: false });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">LR</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                LeadRouter
              </h1>
              <p className="text-sm text-gray-600">BDR Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{user?.name || user?.email}</div>
              <div className="text-xs text-gray-500">BDR Role</div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Last Assignment Banner */}
      {lastAssignment && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between animate-slide-down">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <div>
                <div className="text-sm font-medium text-green-900">
                  Last Assignment: {lastAssignment.rep} ({lastAssignment.queue})
                </div>
                <div className="text-xs text-green-700">
                  {lastAssignment.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
            <button
              onClick={() => setLastAssignment(null)}
              className="text-green-700 hover:text-green-900"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Lead Assignment Dashboard</h2>
          <p className="text-gray-600">Assign leads to sales reps using weighted round robin</p>
        </div>

        {/* Assignment Queues - Top Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-gray-900">Next Lead Assignment</h3>
            <div className="flex space-x-2">
              <ManualAssignmentButton 
                queue="SMB" 
                reps={smbReps}
                onSuccess={() => {
                  fetchDashboardStats();
                  fetchReps();
                  fetchNextReps(); // Recalculate next rep based on weights
                }}
              />
              <ManualAssignmentButton 
                queue="ENT" 
                reps={entReps}
                onSuccess={() => {
                  fetchDashboardStats();
                  fetchReps();
                  fetchNextReps(); // Recalculate next rep based on weights
                }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SMB Queue */}
            <QueuePanel
              queue="SMB"
              nextRep={smbNextRep}
              loading={loading}
              assigning={assigning.smb}
              onAssign={() => handleAssign('SMB')}
            />

            {/* ENT Queue */}
            <QueuePanel
              queue="ENT"
              nextRep={entNextRep}
              loading={loading}
              assigning={assigning.ent}
              onAssign={() => handleAssign('ENT')}
            />
          </div>
        </div>

        {/* Assignment Charts - Bottom Section */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Assignment Statistics & Charts</h3>
          <AssignmentCharts 
            smbData={dashboardStats?.smb} 
            entData={dashboardStats?.ent}
            loading={!dashboardStats}
            onFilterChange={handleFilterChange}
          />
        </div>
      </main>
    </div>
  );
}

export default BDRDashboard;

