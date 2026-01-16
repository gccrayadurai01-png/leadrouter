import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Toggle rep active status
async function toggleRepActive(repId, active) {
  try {
    await axios.put(`${API_URL}/api/reps/${repId}`, { active });
    return true;
  } catch (error) {
    console.error('Error toggling rep:', error);
    return false;
  }
}

function RepsManagement() {
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRep, setEditingRep] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    hubspot_owner_id: '',
    queue: 'SMB',
    weight: 1.0,
    active: true,
  });

  useEffect(() => {
    fetchReps();
  }, []);

  const fetchReps = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/reps`);
      setReps(response.data.reps);
    } catch (error) {
      console.error('Error fetching reps:', error);
      alert('Failed to fetch reps');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRep(null);
    setFormData({
      name: '',
      email: '',
      hubspot_owner_id: '',
      queue: 'SMB',
      weight: 1.0,
      active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (rep) => {
    setEditingRep(rep);
    setFormData({
      name: rep.name,
      email: rep.email,
      hubspot_owner_id: rep.hubspot_owner_id || '',
      queue: rep.queue,
      weight: rep.weight,
      active: rep.active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRep) {
        await axios.put(`${API_URL}/api/reps/${editingRep.id}`, formData);
      } else {
        await axios.post(`${API_URL}/api/reps`, formData);
      }
      setShowModal(false);
      fetchReps();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save rep');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rep?')) return;
    try {
      await axios.delete(`${API_URL}/api/reps/${id}`);
      fetchReps();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete rep');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const smbReps = reps.filter((r) => r.queue === 'SMB');
  const entReps = reps.filter((r) => r.queue === 'ENT');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Sales Reps Management</h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          + Add Rep
        </button>
      </div>

      {/* SMB Queue */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">SMB Queue</h3>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {smbReps.map((rep) => (
                <tr key={rep.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rep.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rep.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rep.weight}x</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rep.currentScore.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rep.assignmentCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rep.active}
                        onChange={async (e) => {
                          const newActive = e.target.checked;
                          const success = await toggleRepActive(rep.id, newActive);
                          if (success) {
                            fetchReps();
                          } else {
                            alert('Failed to update rep status');
                          }
                        }}
                        className="mr-2 w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className={`px-2 py-1 text-xs rounded-full ${rep.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {rep.active ? 'Active' : 'Inactive'}
                      </span>
                    </label>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => handleEdit(rep)} className="text-primary-600 hover:text-primary-900">Edit</button>
                    <button onClick={() => handleDelete(rep.id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ENT Queue */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">ENT Queue</h3>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entReps.map((rep) => (
                <tr key={rep.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rep.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rep.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rep.weight}x</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rep.currentScore.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rep.assignmentCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rep.active}
                        onChange={async (e) => {
                          const newActive = e.target.checked;
                          const success = await toggleRepActive(rep.id, newActive);
                          if (success) {
                            fetchReps();
                          } else {
                            alert('Failed to update rep status');
                          }
                        }}
                        className="mr-2 w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className={`px-2 py-1 text-xs rounded-full ${rep.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {rep.active ? 'Active' : 'Inactive'}
                      </span>
                    </label>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => handleEdit(rep)} className="text-primary-600 hover:text-primary-900">Edit</button>
                    <button onClick={() => handleDelete(rep.id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingRep ? 'Edit Rep' : 'Create Rep'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">HubSpot Owner ID</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.hubspot_owner_id}
                  onChange={(e) => setFormData({ ...formData, hubspot_owner_id: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Queue</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.queue}
                  onChange={(e) => setFormData({ ...formData, queue: e.target.value })}
                >
                  <option value="SMB">SMB</option>
                  <option value="ENT">ENT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Weight</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  {editingRep ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RepsManagement;

