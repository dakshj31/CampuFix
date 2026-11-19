/**
 * Complaints routes – submit, list, detail, status update
 */

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/inMemoryDb');
const { authMiddleware, requireRole } = require('../middleware/auth');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
const VALID_STATUSES = ['Submitted', 'In Progress', 'Resolved'];
const VALID_TRANSITIONS = {
  'Submitted': ['In Progress'],
  'In Progress': ['Resolved'],
  'Resolved': [],
};

// Helper: get department by name
function getDeptByName(name) {
  return db.departments.find(d => d.name === name) || db.departments[2]; // fallback: Administration
}

// Helper: add notification
function addNotification(userId, complaintId, message) {
  db.notifications.push({
    id: uuidv4(),
    userId, complaintId, message,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
}

// GET /api/complaints – list (student sees own, staff/admin see all)
router.get('/', authMiddleware, (req, res) => {
  let list = db.complaints;
  if (req.user.role === 'student') {
    list = list.filter(c => c.userId === req.user.id);
  }
  // Enrich with location and department names
  const enriched = list.map(c => enrichComplaint(c));
  res.json(enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// GET /api/complaints/:id
router.get('/:id', authMiddleware, (req, res) => {
  const c = db.complaints.find(c => c.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Complaint not found' });
  if (req.user.role === 'student' && c.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const history = db.statusHistory
    .filter(h => h.complaintId === c.id)
    .sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));

  const feedback = db.feedbacks.find(f => f.complaintId === c.id) || null;

  res.json({ ...enrichComplaint(c), history, feedback });
});

// POST /api/complaints – submit new complaint
router.post('/', authMiddleware, async (req, res) => {
  const { description, locationId } = req.body;
  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'description is required' });
  }
  if (description.trim().length < 10) {
    return res.status(400).json({ error: 'description must be at least 10 characters' });
  }
  if (description.trim().length > 1000) {
    return res.status(400).json({ error: 'description must be under 1000 characters' });
  }
  if (!locationId) {
    return res.status(400).json({ error: 'locationId is required' });
  }

  const location = db.locations.find(l => l.id === locationId);
  if (!location) return res.status(400).json({ error: 'Invalid locationId' });

  // Call AI service
  let aiResult = {
    category: 'Other',
    priority: 'Medium',
    department: 'Administration',
    confidence: 0,
    needs_manual_routing: true,
  };
  try {
    const aiRes = await fetch(`${AI_SERVICE_URL}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: description, location: location.name }),
      timeout: 5000,
    });
    if (aiRes.ok) {
      aiResult = await aiRes.json();
    }
  } catch (err) {
    console.warn('AI service unavailable, using fallback:', err.message);
  }

  const dept = getDeptByName(aiResult.department);
  const id = 'cmp-' + uuidv4().slice(0, 8);

  const complaint = {
    id,
    userId: req.user.id,
    locationId,
    departmentId: dept.id,
    description: description.trim(),
    category: aiResult.category,
    priority: aiResult.needs_manual_routing ? 'Medium' : aiResult.priority,
    status: 'Submitted',
    needsManualRouting: aiResult.needs_manual_routing,
    confidence: aiResult.confidence,
    createdAt: new Date().toISOString(),
  };

  db.complaints.push(complaint);
  db.statusHistory.push({
    id: uuidv4(),
    complaintId: id,
    status: 'Submitted',
    updatedBy: req.user.id,
    updatedAt: new Date().toISOString(),
  });

  res.status(201).json(enrichComplaint(complaint));
});

// PATCH /api/complaints/:id/status – update status (staff/admin)
router.patch('/:id/status', authMiddleware, requireRole('staff', 'admin'), (req, res) => {
  const { status } = req.body;
  const c = db.complaints.find(c => c.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Complaint not found' });

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  const allowed = VALID_TRANSITIONS[c.status] || [];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Cannot transition from ${c.status} to ${status}` });
  }

  c.status = status;
  db.statusHistory.push({
    id: uuidv4(),
    complaintId: c.id,
    status,
    updatedBy: req.user.id,
    updatedAt: new Date().toISOString(),
  });

  const statusMsg = status === 'Resolved'
    ? `Your complaint #${c.id} has been Resolved! Please rate the service.`
    : `Your complaint #${c.id} is now ${status}.`;
  addNotification(c.userId, c.id, statusMsg);

  res.json(enrichComplaint(c));
});

// PATCH /api/complaints/:id/assign – assign department (admin)
router.patch('/:id/assign', authMiddleware, requireRole('admin'), (req, res) => {
  const { departmentId, priority, category } = req.body;
  const c = db.complaints.find(c => c.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Complaint not found' });

  if (departmentId) {
    if (!db.departments.find(d => d.id === departmentId)) {
      return res.status(400).json({ error: 'Invalid departmentId' });
    }
    c.departmentId = departmentId;
    c.needsManualRouting = false;
  }
  if (priority && ['High', 'Medium', 'Low'].includes(priority)) c.priority = priority;
  if (category) c.category = category;

  res.json(enrichComplaint(c));
});

// POST /api/complaints/:id/feedback
router.post('/:id/feedback', authMiddleware, requireRole('student'), (req, res) => {
  const c = db.complaints.find(c => c.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Complaint not found' });
  if (c.userId !== req.user.id) return res.status(403).json({ error: 'Access denied' });
  if (c.status !== 'Resolved') return res.status(400).json({ error: 'Can only rate resolved complaints' });
  if (db.feedbacks.find(f => f.complaintId === c.id)) {
    return res.status(409).json({ error: 'Feedback already submitted for this complaint' });
  }

  const { rating, comment = '' } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'rating must be 1–5' });
  }

  const fb = { id: uuidv4(), complaintId: c.id, userId: req.user.id, rating, comment, createdAt: new Date().toISOString() };
  db.feedbacks.push(fb);
  res.status(201).json(fb);
});

// Helper: enrich a complaint with location/dept names
function enrichComplaint(c) {
  const loc = db.locations.find(l => l.id === c.locationId);
  const dept = db.departments.find(d => d.id === c.departmentId);
  const user = db.users.find(u => u.id === c.userId);
  return {
    ...c,
    locationName: loc ? loc.name : 'Unknown',
    departmentName: dept ? dept.name : 'Unknown',
    userName: user ? user.name : 'Unknown',
  };
}

module.exports = router;
