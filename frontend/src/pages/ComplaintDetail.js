import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STEPS = ['Submitted', 'In Progress', 'Resolved'];

function StatusStepper({ status }) {
  const idx = STEPS.indexOf(status);
  return (
    <div className="status-steps">
      {STEPS.map((s, i) => (
        <div key={s} className={`step ${i < idx ? 'done' : i === idx ? 'active' : ''}`}>
          <div className="step-dot">
            {i < idx ? '✓' : i === idx ? '●' : '○'}
          </div>
          <div className="step-label">{s}</div>
        </div>
      ))}
    </div>
  );
}

function FeedbackForm({ complaintId, existing, onDone }) {
  const [rating, setRating] = useState(existing?.rating || 0);
  const [comment, setComment] = useState(existing?.comment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (existing) {
    return (
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">⭐ Your Feedback</div>
        <div className="stars">
          {[1, 2, 3, 4, 5].map(i => (
            <span key={i} className="star-btn" style={{ color: i <= existing.rating ? '#f59e0b' : 'var(--gray-200)', fontSize: '1.5rem' }}>★</span>
          ))}
        </div>
        {existing.comment && <p style={{ marginTop: 8, fontSize: '0.875rem', color: 'var(--gray-600)' }}>{existing.comment}</p>}
      </div>
    );
  }

  const submit = async () => {
    if (!rating) { setError('Please select a rating'); return; }
    setLoading(true); setError('');
    try {
      await axios.post(`/api/complaints/${complaintId}/feedback`, { rating, comment });
      onDone({ rating, comment });
    } catch (err) {
      setError(err.response?.data?.error || 'Error submitting feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-title">⭐ Rate the Resolution</div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="stars" style={{ marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i} className={`star-btn ${i <= rating ? 'filled' : ''}`} onClick={() => setRating(i)}>★</button>
        ))}
      </div>
      <div className="form-group">
        <label className="form-label">Comment (optional)</label>
        <textarea className="form-control" value={comment} onChange={e => setComment(e.target.value)} rows={2} placeholder="How was the resolution?" />
      </div>
      <button className="btn btn-primary" onClick={submit} disabled={loading}>
        {loading ? <><span className="spinner" /> Submitting…</> : 'Submit Feedback'}
      </button>
    </div>
  );
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [assignForm, setAssignForm] = useState({ departmentId: '', priority: '', category: '' });

  useEffect(() => {
    axios.get(`/api/complaints/${id}`)
      .then(r => { setComplaint(r.data); setFeedback(r.data.feedback); })
      .catch(() => setError('Complaint not found'))
      .finally(() => setLoading(false));
    if (user.role === 'admin') {
      axios.get('/api/departments').then(r => setDepartments(r.data)).catch(() => {});
    }
  }, [id, user]);

  const updateStatus = async newStatus => {
    setStatusLoading(true); setStatusError('');
    try {
      const r = await axios.patch(`/api/complaints/${id}/status`, { status: newStatus });
      setComplaint(c => ({ ...c, ...r.data }));
      // Reload for history
      const full = await axios.get(`/api/complaints/${id}`);
      setComplaint(full.data);
    } catch (err) {
      setStatusError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const assign = async () => {
    try {
      const r = await axios.patch(`/api/complaints/${id}/assign`, assignForm);
      setComplaint(c => ({ ...c, ...r.data }));
    } catch (err) {
      setStatusError(err.response?.data?.error || 'Failed to assign');
    }
  };

  if (loading) return <div className="loading-center"><span className="spinner" /> Loading…</div>;
  if (error) return <div className="card"><div className="alert alert-error">{error}</div></div>;
  if (!complaint) return null;

  const c = complaint;
  const priorityColor = { High: '#dc2626', Medium: '#d97706', Low: '#16a34a' };
  const nextStatus = { 'Submitted': 'In Progress', 'In Progress': 'Resolved' };
  const statusBadge = s => {
    const m = { 'Submitted': 'badge-submitted', 'In Progress': 'badge-inprogress', 'Resolved': 'badge-resolved' };
    return <span className={`badge ${m[s]}`}>{s}</span>;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Back</button>
        <div>
          <div className="page-title">Complaint #{c.id}</div>
          <div className="page-subtitle">Filed on {new Date(c.createdAt).toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Left column */}
        <div>
          <div className="card">
            <div className="card-title">📝 Complaint Description</div>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--gray-800)' }}>{c.description}</p>

            {/* Status stepper */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 4 }}>Status Progress</div>
              <StatusStepper status={c.status} />
            </div>

            {/* Staff/admin controls */}
            {(user.role === 'staff' || user.role === 'admin') && nextStatus[c.status] && (
              <div style={{ marginTop: 16 }}>
                {statusError && <div className="alert alert-error">{statusError}</div>}
                <button
                  className="btn btn-success"
                  onClick={() => updateStatus(nextStatus[c.status])}
                  disabled={statusLoading}
                >
                  {statusLoading ? <><span className="spinner" /> Updating…</> : `✅ Mark as ${nextStatus[c.status]}`}
                </button>
              </div>
            )}

            {/* Feedback */}
            {user.role === 'student' && c.status === 'Resolved' && (
              <FeedbackForm complaintId={c.id} existing={feedback} onDone={fb => setFeedback(fb)} />
            )}
          </div>

          {/* Timeline */}
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-title">🕒 Status Timeline</div>
            {(c.history || []).map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: h.status === 'Resolved' ? 'var(--success-light)' : h.status === 'In Progress' ? 'var(--warning-light)' : 'var(--gray-100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'
                }}>
                  {h.status === 'Resolved' ? '✅' : h.status === 'In Progress' ? '⚙' : '📤'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{statusBadge(h.status)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 2 }}>
                    {new Date(h.updatedAt).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div>
          <div className="card">
            <div className="card-title">📊 Details</div>
            {[
              ['Status', statusBadge(c.status)],
              ['Priority', <span className="badge" style={{ background: priorityColor[c.priority] + '22', color: priorityColor[c.priority] }}>{c.priority}</span>],
              ['Category', <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{c.category}</span>],
              ['Department', c.departmentName],
              ['Location', c.locationName],
              ['Filed by', c.userName],
              ['AI Confidence', c.confidence ? `${Math.round(c.confidence * 100)}%` : 'N/A'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--gray-400)', fontWeight: 500 }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            {c.needsManualRouting && (
              <div className="alert alert-warning" style={{ marginTop: 12 }}>⚠ Needs manual routing review</div>
            )}
          </div>

          {/* Admin assign panel */}
          {user.role === 'admin' && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-title">🛡 Admin: Override</div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-control" value={assignForm.departmentId} onChange={e => setAssignForm(f => ({ ...f, departmentId: e.target.value }))}>
                  <option value="">— Keep current —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-control" value={assignForm.priority} onChange={e => setAssignForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="">— Keep current —</option>
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
              <button className="btn btn-primary btn-sm" onClick={assign}>Apply Override</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
