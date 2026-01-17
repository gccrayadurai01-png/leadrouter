import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
const INACTIVE_COLOR = '#9ca3af'; // Gray for inactive reps

function AssignmentCharts({ smbData, entData, loading, onFilterChange }) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  if (loading) {
    return <div className="text-center py-8">Loading charts...</div>;
  }

  // Prepare data for bar charts
  const smbRepData = smbData?.repBreakdown || [];
  const entRepData = entData?.repBreakdown || [];

  // Prepare pie chart data
  const smbPieData = [
    { name: 'Round Robin', value: parseInt(smbData?.round_robin || 0) },
    { name: 'Manual', value: parseInt(smbData?.manual || 0) },
    { name: 'Company Match', value: parseInt(smbData?.company_match || 0) }
  ].filter(item => item.value > 0);

  const entPieData = [
    { name: 'Round Robin', value: parseInt(entData?.round_robin || 0) },
    { name: 'Manual', value: parseInt(entData?.manual || 0) },
    { name: 'Company Match', value: parseInt(entData?.company_match || 0) }
  ].filter(item => item.value > 0);

  const handleDateChange = (newFromDate, newToDate) => {
    const from = newFromDate !== undefined ? newFromDate : fromDate;
    const to = newToDate !== undefined ? newToDate : toDate;
    if (onFilterChange && (from || to)) {
      onFilterChange({ fromDate: from, toDate: to });
    }
  };

  const handleQuickFilter = (days) => {
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - days);
    const to = today.toISOString().split('T')[0];
    const fromStr = from.toISOString().split('T')[0];
    setFromDate(fromStr);
    setToDate(to);
    if (onFilterChange) {
      onFilterChange({ fromDate: fromStr, toDate: to });
    }
  };

  return (
    <div>
      {/* Date Range Filter */}
      <div className="mb-4 bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                const newFrom = e.target.value;
                setFromDate(newFrom);
                handleDateChange(newFrom, toDate);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                const newTo = e.target.value;
                setToDate(newTo);
                handleDateChange(fromDate, newTo);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => handleQuickFilter(7)}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handleQuickFilter(30)}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => {
                setFromDate('');
                setToDate('');
                if (onFilterChange) {
                  onFilterChange({ fromDate: '', toDate: '' });
                }
              }}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* SMB Charts */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">SMB Team Assignments</h3>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{smbData?.total || 0}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{smbData?.today || 0}</div>
            <div className="text-sm text-gray-600">Today</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{smbData?.week || 0}</div>
            <div className="text-sm text-gray-600">This Week</div>
          </div>
        </div>

        {/* Rep Breakdown Bar Chart */}
        {smbRepData.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">By Rep</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={smbRepData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  <LabelList dataKey="count" position="top" fill="#374151" fontSize={12} fontWeight="bold" />
                  {smbRepData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.active ? '#3b82f6' : INACTIVE_COLOR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center space-x-4 mt-2 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
                <span>Active</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-400 rounded mr-1"></div>
                <span>Inactive</span>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Type Pie Chart */}
        {smbPieData.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">By Type</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={smbPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {smbPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        </div>

        {/* ENT Charts */}
        <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">ENT Team Assignments</h3>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{entData?.total || 0}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{entData?.today || 0}</div>
            <div className="text-sm text-gray-600">Today</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{entData?.week || 0}</div>
            <div className="text-sm text-gray-600">This Week</div>
          </div>
        </div>

        {/* Rep Breakdown Bar Chart */}
        {entRepData.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">By Rep</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={entRepData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  <LabelList dataKey="count" position="top" fill="#374151" fontSize={12} fontWeight="bold" />
                  {entRepData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.active ? '#8b5cf6' : INACTIVE_COLOR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center space-x-4 mt-2 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded mr-1"></div>
                <span>Active</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-400 rounded mr-1"></div>
                <span>Inactive</span>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Type Pie Chart */}
        {entPieData.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">By Type</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={entPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {entPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default AssignmentCharts;

