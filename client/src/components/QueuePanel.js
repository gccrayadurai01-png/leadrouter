import React from 'react';

function QueuePanel({ queue, nextRep, loading, assigning, onAssign }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!nextRep || !nextRep.success) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{queue} Queue</h2>
        <div className="text-gray-500">
          {nextRep?.message || 'No active reps available'}
        </div>
      </div>
    );
  }

  const { rep, totalActiveReps, totalActiveWeight } = nextRep;

  const borderColor = queue === 'SMB' ? 'border-blue-500' : 'border-purple-500';
  const bgGradient = queue === 'SMB' 
    ? 'from-blue-500 to-blue-600' 
    : 'from-purple-500 to-purple-600';
  const badgeColor = queue === 'SMB' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  const buttonColor = queue === 'SMB' 
    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' 
    : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500';

  return (
    <div className={`bg-white rounded-xl shadow-xl p-6 border-l-4 ${borderColor} transform transition-all hover:shadow-2xl hover:scale-105`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${bgGradient} rounded-lg flex items-center justify-center shadow-md`}>
            <span className="text-white font-bold text-lg">{queue}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{queue} Queue</h2>
            <p className="text-xs text-gray-500">Sales Lead Assignment</p>
          </div>
        </div>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badgeColor} shadow-sm`}>
          {totalActiveReps} Active
        </span>
      </div>

      <div className="mb-6">
        <div className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
          Next Lead Will Go To:
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-dashed border-gray-300 shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <div className="text-2xl font-bold text-gray-900">{rep.name}</div>
            <div className={`px-3 py-1 rounded-lg ${badgeColor} text-xs font-semibold`}>
              {rep.weight}x Weight
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white rounded-lg p-2">
              <div className="text-xs text-gray-500 mb-1">Current Score</div>
              <div className="font-bold text-gray-900">{rep.currentScore.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-lg p-2">
              <div className="text-xs text-gray-500 mb-1">Projected</div>
              <div className={`font-bold ${queue === 'SMB' ? 'text-blue-600' : 'text-purple-600'}`}>
                {rep.projectedScore.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <button
          onClick={onAssign}
          disabled={assigning}
          className={`w-full px-4 py-4 ${buttonColor} text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg`}
        >
          {assigning ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Assigning...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Assign Next Lead
            </span>
          )}
        </button>
      </div>

      <div className="text-xs text-gray-500 pt-4 border-t border-gray-200 flex justify-between">
        <div>
          <div className="font-medium">Total Weight: {totalActiveWeight.toFixed(2)}</div>
        </div>
        <div className="text-gray-400">Queue: {queue}</div>
      </div>
    </div>
  );
}

export default QueuePanel;

