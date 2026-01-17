import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

function AssignmentsHistory() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ queue: '', rep_id: '' });

  useEffect(() => {
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchAssignments = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.queue) params.append('queue', filters.queue);
      if (filters.rep_id) params.append('rep_id', filters.rep_id);
      params.append('limit', '100');

      const response = await axios.get(`${API_URL}/api/assignments?${params}`);
      setAssignments(response.data.assignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Assignment History</h2>
        <div className="flex space-x-4">
          <select
            className="border border-gray-300 rounded-md px-3 py-2"
            value={filters.queue}
            onChange={(e) => setFilters({ ...filters, queue: e.target.value })}
          >
            <option value="">All Queues</option>
            <option value="SMB">SMB</option>
            <option value="ENT">ENT</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Queue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rep</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">HubSpot ID</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(assignment.assignedAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.queue}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{assignment.repName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.weightAtAssignment}x</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.scoreAtAssignment.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {assignment.hubspotContactId || assignment.hubspotDealId || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AssignmentsHistory;

