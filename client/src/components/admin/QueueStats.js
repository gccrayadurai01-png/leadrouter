import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

function QueueStats() {
  const [smbStats, setSmbStats] = useState(null);
  const [entStats, setEntStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState({});

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const [smbResponse, entResponse] = await Promise.all([
        axios.get(`${API_URL}/api/assignments/queue/SMB/stats`),
        axios.get(`${API_URL}/api/assignments/queue/ENT/stats`),
      ]);
      setSmbStats(smbResponse.data);
      setEntStats(entResponse.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const handleEdit = (repId, currentCount) => {
    setEditing({ ...editing, [repId]: currentCount });
  };

  const handleSave = async (repId, queue, newCount) => {
    setSaving({ ...saving, [repId]: true });
    try {
      await axios.put(`${API_URL}/api/reps/${repId}/assignment-count`, {
        queue,
        count: parseInt(newCount)
      });
      setEditing({ ...editing, [repId]: undefined });
      fetchStats(); // Refresh stats
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update assignment count');
    } finally {
      setSaving({ ...saving, [repId]: false });
    }
  };

  const handleCancel = (repId) => {
    setEditing({ ...editing, [repId]: undefined });
  };

  const StatCard = ({ title, stats, queue }) => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{title} Queue Statistics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-sm text-gray-600">Active Reps</div>
          <div className="text-2xl font-bold text-gray-900">{stats.reps.active}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-sm text-gray-600">Total Weight</div>
          <div className="text-2xl font-bold text-gray-900">{stats.reps.totalWeight.toFixed(2)}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-sm text-gray-600">Today</div>
          <div className="text-2xl font-bold text-gray-900">{stats.assignments.today}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-sm text-gray-600">This Week</div>
          <div className="text-2xl font-bold text-gray-900">{stats.assignments.week}</div>
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-gray-700 mb-2">Rep Details (Click to Edit Assignment Count)</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Weight</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Score</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Assignments</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.repDetails.map((rep) => {
                const isEditing = editing[rep.id] !== undefined;
                const editValue = isEditing ? editing[rep.id] : rep.assignmentCount;
                return (
                  <tr key={rep.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{rep.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{rep.weight}x</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{rep.currentScore.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editValue}
                          onChange={(e) => setEditing({ ...editing, [rep.id]: e.target.value })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          autoFocus
                        />
                      ) : (
                        <span 
                          className="text-gray-500 cursor-pointer hover:text-blue-600 hover:underline"
                          onClick={() => handleEdit(rep.id, rep.assignmentCount)}
                        >
                          {rep.assignmentCount}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {isEditing ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSave(rep.id, queue, editValue)}
                            disabled={saving[rep.id]}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {saving[rep.id] ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => handleCancel(rep.id)}
                            className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(rep.id, rep.assignmentCount)}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Queue Statistics</h2>
      <p className="text-sm text-gray-600 mb-4">Click on assignment counts to edit and correct them</p>
      {smbStats && <StatCard title="SMB" stats={smbStats} queue="SMB" />}
      {entStats && <StatCard title="ENT" stats={entStats} queue="ENT" />}
    </div>
  );
}

export default QueueStats;

