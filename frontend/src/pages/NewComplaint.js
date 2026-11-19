import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function NewComplaint() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({ description: '', locationId: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    axios.get('/api/locations').then(r => setLocations(r.data)).catch(() => {});
  }, []);

  const handle = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(e => ({ ...e, [name]: '' }));
    // Reset AI result when description changes
    if (name === 'description') setAiResult(null);
  };

  const validate = () => {
    const errs = {};
    if (!form.description.trim()) errs.description = 'Description is required';
    else if (form.description.trim().length < 10) errs.description = 'At least 10 characters required';
    if (!form.locationId) errs.locationId = 'Please select a location';
    return errs;
  };

  const previewAI = async () => {
    if (!form.description.trim() || form.description.trim().length < 10) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      // We submit a lightweight classify request directly (via backend in prod)
      // For the prototype, we'll just submit and read the AI result from the complaint
      const loc = locations.find(l => l.id === form.locationId);
      const res = await axios.post('/api/complaints', {
        description: form.description,
        locationId: form.locationId || (locations[0]?.id),
      });
      setAiResult(res.data);
      setSubmitted(res.data);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Error classifying complaint');
    } finally {
      setAiLoading(false);
    }
  };

  const submit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setSubmitError('');
    try {
      const res = await axios.post('/api/complaints', form);
      setSubmitted(res.data);
      setAiResult(res.data);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  const priorityColor = { High: '#dc2626', Medium: '#d97706', Low: '#16a34a' };

  if (submitted) {
    return (
      <div>
        <div className="page-header">
          <div className="page-title">✅ Complaint Submitted!</div>
          <div className="page-subtitle">Your complaint has been received and classified by AI.</div>
        </div>
        <div className="card" style={{ maxWidth: 600 }}>
          <div className="alert alert-success">🎉 Complaint #{submitted.id} filed successfully!</div>
          <div className="ai-label">🤖 AI Classification Result</div>
          <div className="ai-result">
            <div className="ai-result-item">
              <label>Category</label>
              <value style={{ color: 'var(--primary)' }}>{submitted.category}</value>
            </div>
            <div className="ai-result-item">
              <label>Priority</label>
              <value style={{ color: priorityColor[submitted.priority] }}>{submitted.priority}</value>
            </div>
            <div className="ai-result-item">
              <label>Department</label>
              <value>{submitted.departmentName}</value>
            </div>
            <div className="ai-result-item">
              <label>Confidence</label>
              <value>{submitted.confidence ? `${Math.round(submitted.confidence * 100)}%` : 'N/A'}</value>
            </div>
          </div>
          {submitted.needsManualRouting && (
            <div className="alert alert-warning" style={{ marginTop: 12 }}>
              ⚠ AI confidence was low — an admin will manually review and route this complaint.
            </div>
          )}
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => navigate(`/complaints/${submitted.id}`)}>View Complaint</button>
            <button className="btn btn-secondary" onClick={() => { setSubmitted(null); setAiResult(null); setForm({ description: '', locationId: '' }); }}>
              File Another
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/my-complaints')}>My Complaints</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">➕ File a Complaint</div>
        <div className="page-subtitle">Describe your campus issue — AI will classify and route it automatically.</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div className="card">
            <div className="card-title">Complaint Details</div>
            {submitError && <div className="alert alert-error">⚠ {submitError}</div>}
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">📝 Describe the issue <span style={{ color: 'var(--danger)' }}>*</span></label>
                <textarea
                  name="description"
                  className={`form-control ${errors.description ? 'error' : ''}`}
                  value={form.description}
                  onChange={handle}
                  placeholder="e.g. WiFi is not working in the computer lab. I cannot access study material for my exam tomorrow."
                  rows={5}
                />
                {errors.description && <div className="form-error">{errors.description}</div>}
                <div className="form-hint">{form.description.length}/1000 characters</div>
              </div>

              <div className="form-group">
                <label className="form-label">📍 Location <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select name="locationId" className={`form-control ${errors.locationId ? 'error' : ''}`} value={form.locationId} onChange={handle}>
                  <option value="">— Select location —</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name} ({l.areaType})</option>)}
                </select>
                {errors.locationId && <div className="form-error">{errors.locationId}</div>}
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? <><span className="spinner" /> Submitting…</> : '🚀 Submit Complaint'}
              </button>
            </form>
          </div>
        </div>

        {/* Guide panel */}
        <div>
          <div className="card">
            <div className="card-title">💡 How it works</div>
            {[
              ['1️⃣', 'Describe', 'Write what the issue is in your own words.'],
              ['2️⃣', 'AI Analyses', 'Our AI reads your complaint, detects category and priority.'],
              ['3️⃣', 'Auto-Routed', 'Sent straight to the right department (IT / Maintenance / Admin).'],
              ['4️⃣', 'Track it', 'Follow the status: Submitted → In Progress → Resolved.'],
              ['5️⃣', 'Feedback', 'Rate the resolution after the issue is fixed.'],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title">🤖 AI Categories Detected</div>
            {[
              { cat: '📶 Wi-Fi / Network', dept: 'IT Department' },
              { cat: '❄ AC / Cooling', dept: 'Maintenance' },
              { cat: '📽 Projector / AV', dept: 'IT Department' },
              { cat: '🧹 Cleanliness', dept: 'Administration' },
              { cat: '⚡ Electrical', dept: 'Maintenance' },
              { cat: '🪑 Furniture', dept: 'Maintenance' },
              { cat: '💧 Water / Plumbing', dept: 'Maintenance' },
            ].map(({ cat, dept }) => (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--gray-100)', fontSize: '0.8rem' }}>
                <span>{cat}</span>
                <span style={{ color: 'var(--gray-400)' }}>{dept}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
