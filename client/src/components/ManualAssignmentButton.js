import React, { useState } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';

// Use empty string for relative paths in production, localhost for development
const API_URL = process.env.REACT_APP_API_URL !== undefined 
  ? process.env.REACT_APP_API_URL 
  : 'http://localhost:3001';

function ManualAssignmentButton({ queue, reps, onSuccess }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    repName: '',
    count: '1'
  });
  const { success, error } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.repName.trim()) {
      error('Please enter rep name');
      return;
    }

    const countNum = parseInt(formData.count);
    if (isNaN(countNum) || countNum < 1) {
      error('Count must be a positive number');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/assignments/record-manual`, {
        queue,
        repName: formData.repName.trim(),
        count: countNum
      });

      success(`✓ Recorded ${countNum} manual assignment(s) for ${response.data.rep.name}!`);
      setShowModal(false);
      setFormData({
        repName: '',
        count: '1'
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to record manual assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-sm flex items-center space-x-2"
      >
        <span>+</span>
        <span>Record Manual Assignment</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Record Manual Assignment ({queue})
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Record manual assignments already done in HubSpot. Enter rep name and number of leads.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rep Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.repName}
                  onChange={(e) => setFormData({ ...formData, repName: e.target.value })}
                  placeholder="Enter rep name"
                  list={`rep-names-${queue}`}
                />
                <datalist id={`rep-names-${queue}`}>
                  {reps.map(rep => (
                    <option key={rep.id} value={rep.name} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-500 mt-1">Start typing to see suggestions</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Leads *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.count}
                  onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                  placeholder="1"
                />
                <p className="text-xs text-gray-500 mt-1">How many leads were manually assigned?</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Recording...' : 'Record Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default ManualAssignmentButton;

