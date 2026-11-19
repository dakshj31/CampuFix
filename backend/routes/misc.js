/**
 * Notifications, Analytics, Locations routes
 */

const express = require('express');
const router = express.Router();
const db = require('../db/inMemoryDb');
const { authMiddleware, requireRole } = require('../middleware/auth');

// ── Notifications ─────────────────────────────────────────────────────────────
router.get('/notifications', authMiddleware, (req, res) => {
  const list = db.notifications
    .filter(n => n.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

router.patch('/notifications/:id/read', authMiddleware, (req, res) => {
  const n = db.notifications.find(n => n.id === req.params.id && n.userId === req.user.id);
  if (!n) return res.status(404).json({ error: 'Notification not found' });
  n.isRead = true;
  res.json(n);
});

router.patch('/notifications/read-all', authMiddleware, (req, res) => {
  db.notifications.filter(n => n.userId === req.user.id).forEach(n => n.isRead = true);
  res.json({ message: 'All notifications marked as read' });
});

// ── Analytics (admin/staff) ───────────────────────────────────────────────────
router.get('/analytics', authMiddleware, requireRole('admin', 'staff'), (req, res) => {
  const total = db.complaints.length;
  const byStatus = { Submitted: 0, 'In Progress': 0, Resolved: 0 };
  const byCategory = {};
  const byDept = {};
  const byPriority = { High: 0, Medium: 0, Low: 0 };

  db.complaints.forEach(c => {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    byPriority[c.priority] = (byPriority[c.priority] || 0) + 1;
    const dept = db.departments.find(d => d.id === c.departmentId);
    const dname = dept ? dept.name : 'Unknown';
    byDept[dname] = (byDept[dname] || 0) + 1;
  });

  // Avg resolution time
  let totalResTime = 0, resCount = 0;
  db.complaints.filter(c => c.status === 'Resolved').forEach(c => {
    const start = db.statusHistory.find(h => h.complaintId === c.id && h.status === 'Submitted');
    const end = db.statusHistory.filter(h => h.complaintId === c.id && h.status === 'Resolved').pop();
    if (start && end) {
      totalResTime += (new Date(end.updatedAt) - new Date(start.updatedAt));
      resCount++;
    }
  });
  const avgResolutionHours = resCount ? Math.round(totalResTime / resCount / 3600000 * 10) / 10 : null;

  // Average rating
  const avgRating = db.feedbacks.length
    ? Math.round(db.feedbacks.reduce((s, f) => s + f.rating, 0) / db.feedbacks.length * 10) / 10
    : null;

  res.json({ total, byStatus, byCategory, byDept, byPriority, avgResolutionHours, avgRating, totalFeedbacks: db.feedbacks.length });
});

// ── Locations ─────────────────────────────────────────────────────────────────
router.get('/locations', authMiddleware, (req, res) => {
  res.json(db.locations);
});

// ── Departments ───────────────────────────────────────────────────────────────
router.get('/departments', authMiddleware, (req, res) => {
  res.json(db.departments);
});

module.exports = router;
