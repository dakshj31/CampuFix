import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777'];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/analytics')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><span className="spinner" /> Loading analytics…</div>;
  if (!data) return <div className="alert alert-error">Failed to load analytics.</div>;

  const categoryData = Object.entries(data.byCategory).map(([k, v]) => ({ name: k, count: v }));
  const deptData = Object.entries(data.byDept).map(([k, v]) => ({ name: k, count: v }));
  const statusData = Object.entries(data.byStatus).map(([k, v]) => ({ name: k, value: v }));
  const priorityData = Object.entries(data.byPriority).map(([k, v]) => ({ name: k, count: v }));

  return (
    <div>
      <div className="page-header">
        <div className="page-title">📊 Analytics Dashboard</div>
        <div className="page-subtitle">Campus complaint trends and resolution performance</div>
      </div>

      {/* KPI cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{data.total}</div>
          <div className="stat-label">Total Complaints</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#dc2626' }}>{data.byStatus?.Submitted || 0}</div>
          <div className="stat-label">Pending (Submitted)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#d97706' }}>{data.byStatus?.['In Progress'] || 0}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#16a34a' }}>{data.byStatus?.Resolved || 0}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#f59e0b' }}>{data.avgRating ? `${data.avgRating}/5` : '–'}</div>
          <div className="stat-label">Avg Rating ({data.totalFeedbacks} reviews)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.avgResolutionHours != null ? `${data.avgResolutionHours}h` : '–'}</div>
          <div className="stat-label">Avg Resolution Time</div>
        </div>
      </div>

      <div className="chart-row">
        {/* Category bar chart */}
        <div className="card">
          <div className="card-title">Complaints by Category</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        <div className="card">
          <div className="card-title">Status Distribution</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                {statusData.map((_, i) => <Cell key={i} fill={['#9ca3af', '#d97706', '#16a34a'][i] || COLORS[i]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-row">
        {/* Priority bar */}
        <div className="card">
          <div className="card-title">Complaints by Priority</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {priorityData.map((entry, i) => (
                  <Cell key={i} fill={entry.name === 'High' ? '#dc2626' : entry.name === 'Medium' ? '#d97706' : '#16a34a'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department bar */}
        <div className="card">
          <div className="card-title">Complaints by Department</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
