import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Use empty string for relative paths in production, localhost for development
const API_URL = process.env.REACT_APP_API_URL !== undefined 
  ? process.env.REACT_APP_API_URL 
  : 'http://localhost:3001';

function ManualAssignment() {
  const [reps, setReps] = useState([]);
  const [formData, setFormData] = useState({
    repId: '',
    queue: 'SMB',
    companyName: '',
    companyDomain: '',
    hubspotContactId: '',
    hubspotDealId: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchReps();
  }, [formData.queue]);

  const fetchReps = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/reps?queue=${formData.queue}`);
      setReps(response.data.reps.filter(r => r.active));
    } catch (error) {
      console.error('Error fetching reps:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      await axios.post(`${API_URL}/api/assignments/manual`, {
        repId: formData.repId,
        queue: formData.queue,
        companyName: formData.companyName,
        companyDomain: formData.companyDomain,
        hubspotContactId: formData.hubspotContactId || null,
        hubspotDealId: formData.hubspotDealId || null,
        metadata: formData.notes ? { notes: formData.notes } : null
      });

      setSuccess(true);
      setFormData({
        repId: '',
        queue: formData.queue,
        companyName: '',
        companyDomain: '',
        hubspotContactId: '',
        hubspotDealId: '',
        notes: ''
      });

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to assign lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Manual Lead Assignment</h2>
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-green-800 font-medium">✓ Lead assigned successfully!</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Queue</label>
            <select
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={formData.queue}
              onChange={(e) => setFormData({ ...formData, queue: e.target.value, repId: '' })}
            >
              <option value="SMB">SMB</option>
              <option value="ENT">ENT</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To Rep</label>
            <select
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={formData.repId}
              onChange={(e) => setFormData({ ...formData, repId: e.target.value })}
            >
              <option value="">Select Rep</option>
              {reps.map(rep => (
                <option key={rep.id} value={rep.id}>
                  {rep.name} ({rep.queue})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="e.g., Acme Corp"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Domain</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={formData.companyDomain}
              onChange={(e) => setFormData({ ...formData, companyDomain: e.target.value })}
              placeholder="e.g., acme.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HubSpot Contact ID (Optional)</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={formData.hubspotContactId}
              onChange={(e) => setFormData({ ...formData, hubspotContactId: e.target.value })}
              placeholder="12345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HubSpot Deal ID (Optional)</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={formData.hubspotDealId}
              onChange={(e) => setFormData({ ...formData, hubspotDealId: e.target.value })}
              placeholder="12345678"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
          <textarea
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            rows="3"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes about this assignment..."
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Assigning...' : 'Assign Lead'}
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">About Manual Assignments</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Manual assignments do not affect round robin scores</li>
          <li>• If company name/domain matches existing assignment, future leads will auto-assign to same rep</li>
          <li>• Company matches are tracked but don't count in round robin distribution</li>
        </ul>
      </div>
    </div>
  );
}

export default ManualAssignment;

