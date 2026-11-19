import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function StatCard({ value, label, color }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={color ? { color } : {}}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (user.role !== 'student') {
      axios.get('/api/analytics').then(r => setData(r.data)).catch(() => {});
    }
    axios.get('/api/complaints').then(r => setRecentComplaints(r.data.slice(0, 5))).catch(() => {});
    axios.get('/api/notifications').then(r => setNotifCount(r.data.filter(n => !n.isRead).length)).catch(() => {});
  }, [user]);

  const statusBadge = s => {
    const m = { 'Submitted': 'badge-submitted', 'In Progress': 'badge-inprogress', 'Resolved': 'badge-resolved' };
    return <span className={`badge ${m[s] || 'badge-submitted'}`}>{s}</span>;
  };

  const priorityBadge = p => {
    const m = { 'High': 'badge-high', 'Medium': 'badge-medium', 'Low': 'badge-low' };
    return <span className={`badge ${m[p] || 'badge-medium'}`}>{p}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">👋 Welcome, {user.name}!</div>
        <div className="page-subtitle">
          {user.role === 'student' ? 'Report and track your campus complaints' : 'Manage and resolve campus complaints'}
          {notifCount > 0 && <span style={{ marginLeft: 12, color: 'var(--danger)', fontWeight: 600 }}>🔔 {notifCount} unread notification{notifCount > 1 ? 's' : ''}</span>}
        </div>
      </div>

      {/* Stats */}
      {user.role !== 'student' && data && (
        <div className="stats-grid">
          <StatCard value={data.total} label="Total Complaints" />
          <StatCard value={data.byStatus?.Submitted || 0} label="Submitted" color="var(--gray-600)" />
          <StatCard value={data.byStatus?.['In Progress'] || 0} label="In Progress" color="var(--warning)" />
          <StatCard value={data.byStatus?.Resolved || 0} label="Resolved" color="var(--success)" />
          <StatCard value={data.avgRating ? `${data.avgRating}/5` : '–'} label="Avg Rating" color="var(--warning)" />
          <StatCard value={data.avgResolutionHours ? `${data.avgResolutionHours}h` : '–'} label="Avg Resolution" />
        </div>
      )}

      {user.role === 'student' && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: 500 }}>
          <StatCard value={recentComplaints.length} label="Total Filed" />
          <StatCard value={recentComplaints.filter(c => c.status === 'In Progress').length} label="In Progress" color="var(--warning)" />
          <StatCard value={recentComplaints.filter(c => c.status === 'Resolved').length} label="Resolved" color="var(--success)" />
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {user.role === 'student' && (
          <button className="btn btn-primary" onClick={() => navigate('/new-complaint')}>
            ➕ File a Complaint
          </button>
        )}
        {user.role !== 'student' && (
          <button className="btn btn-primary" onClick={() => navigate('/admin/complaints')}>
            📋 View All Complaints
          </button>
        )}
        <button className="btn btn-secondary" onClick={() => navigate('/notifications')}>
          🔔 Notifications {notifCount > 0 && <span className="badge badge-high">{notifCount}</span>}
        </button>
        {user.role !== 'student' && (
          <button className="btn btn-secondary" onClick={() => navigate('/analytics')}>
            📊 Analytics
          </button>
        )}
      </div>

      {/* Recent complaints */}
      <div className="card">
        <div className="card-title">
          {user.role === 'student' ? '📋 My Recent Complaints' : '📋 Recent Complaints'}
        </div>
        {recentComplaints.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">No complaints yet</div>
            <div className="empty-desc">
              {user.role === 'student' ? 'File your first complaint to get started.' : 'No complaints have been filed yet.'}
            </div>
            {user.role === 'student' && (
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/new-complaint')}>
                ➕ File a Complaint
              </button>
            )}
          </div>
        ) : (
          <div className="complaint-list">
            {recentComplaints.map(c => (
              <div key={c.id} className="complaint-card" onClick={() => navigate(`/complaints/${c.id}`)}>
                <div className="complaint-card-header">
                  <div>
                    <div className="complaint-id">{c.id}</div>
                    <div className="complaint-desc">{c.description.length > 100 ? c.description.slice(0, 100) + '…' : c.description}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    {statusBadge(c.status)}
                    {priorityBadge(c.priority)}
                  </div>
                </div>
                <div className="complaint-meta">
                  <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{c.category}</span>
                  <span className="complaint-location">📍 {c.locationName}</span>
                  <span className="complaint-location">🏢 {c.departmentName}</span>
                  <span className="complaint-location">🕒 {new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
