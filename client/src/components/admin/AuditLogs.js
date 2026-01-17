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

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/audit?limit=100`);
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Audit Logs</h2>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Changes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.action}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.entityType} {log.entityId ? `(${log.entityId.substring(0, 8)}...)` : ''}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.userName || log.userEmail || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-w-md">
                    {JSON.stringify(log.changes, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuditLogs;

