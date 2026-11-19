import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function MyComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    axios.get('/api/complaints')
      .then(r => setComplaints(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statuses = ['All', 'Submitted', 'In Progress', 'Resolved'];
  const filtered = filter === 'All' ? complaints : complaints.filter(c => c.status === filter);

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
        <div className="page-title">📋 My Complaints</div>
        <div className="page-subtitle">{complaints.length} complaint{complaints.length !== 1 ? 's' : ''} filed</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}>
            {s} {s !== 'All' && <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'inherit', marginLeft: 2 }}>
              {complaints.filter(c => c.status === s).length}
            </span>}
          </button>
        ))}
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/new-complaint')} style={{ marginLeft: 'auto' }}>
          ➕ New Complaint
        </button>
      </div>

      {loading ? (
        <div className="loading-center"><span className="spinner" /> Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">No complaints found</div>
          <div className="empty-desc">{filter !== 'All' ? `No ${filter} complaints.` : 'File your first complaint.'}</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/new-complaint')}>
            ➕ File a Complaint
          </button>
        </div>
      ) : (
        <div className="complaint-list">
          {filtered.map(c => (
            <div key={c.id} className="complaint-card" onClick={() => navigate(`/complaints/${c.id}`)}>
              <div className="complaint-card-header">
                <div style={{ flex: 1 }}>
                  <div className="complaint-id">{c.id}</div>
                  <div className="complaint-desc">{c.description.length > 120 ? c.description.slice(0, 120) + '…' : c.description}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                  {statusBadge(c.status)}
                  {priorityBadge(c.priority)}
                </div>
              </div>
              <div className="complaint-meta">
                <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{c.category}</span>
                <span className="complaint-location">📍 {c.locationName}</span>
                <span className="complaint-location">🏢 {c.departmentName}</span>
                <span className="complaint-location">🕒 {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                {c.needsManualRouting && <span className="badge badge-manual">⚠ Manual Review</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
