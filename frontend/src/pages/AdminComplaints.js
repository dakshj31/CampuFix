import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PRIORITIES = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
const STATUSES = { 'Submitted': 'badge-submitted', 'In Progress': 'badge-inprogress', 'Resolved': 'badge-resolved' };

export default function AdminComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('/api/complaints')
      .then(r => setComplaints(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...new Set(complaints.map(c => c.category))];
  const filtered = complaints.filter(c => {
    if (filterStatus !== 'All' && c.status !== filterStatus) return false;
    if (filterPriority !== 'All' && c.priority !== filterPriority) return false;
    if (filterCategory !== 'All' && c.category !== filterCategory) return false;
    if (search && !c.description.toLowerCase().includes(search.toLowerCase()) && !c.id.includes(search)) return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">📋 All Complaints</div>
        <div className="page-subtitle">{filtered.length} of {complaints.length} complaints shown</div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="form-control" placeholder="🔍 Search complaints…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 220 }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['All', 'Submitted', 'In Progress', 'Resolved'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`}>{s}</button>
            ))}
          </div>
          <select className="form-control" value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ maxWidth: 140 }}>
            {['All', 'High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
          </select>
          <select className="form-control" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ maxWidth: 180 }}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><span className="spinner" /> Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">No complaints match your filters</div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Filed by</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td><code style={{ fontSize: '0.72rem' }}>{c.id}</code></td>
                    <td style={{ maxWidth: 220 }}>
                      <div style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                        {c.description}
                      </div>
                      {c.needsManualRouting && <span className="badge badge-manual" style={{ marginTop: 2 }}>⚠ Manual</span>}
                    </td>
                    <td><span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.72rem' }}>{c.category}</span></td>
                    <td><span className={`badge ${PRIORITIES[c.priority]}`}>{c.priority}</span></td>
                    <td><span className={`badge ${STATUSES[c.status]}`}>{c.status}</span></td>
                    <td style={{ fontSize: '0.8rem' }}>{c.departmentName}</td>
                    <td style={{ fontSize: '0.8rem' }}>{c.locationName}</td>
                    <td style={{ fontSize: '0.8rem' }}>{c.userName}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                      {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/complaints/${c.id}`)}>View →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
