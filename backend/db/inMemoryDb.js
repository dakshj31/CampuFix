/**
 * CampusFix – In-memory database
 * Stores users, complaints, notifications, feedback in-memory for the prototype.
 * Reset on server restart; replace with PostgreSQL for production.
 */

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// ── Seed departments ──────────────────────────────────────────────────────────
const departments = [
  { id: 'dept-1', name: 'IT Department' },
  { id: 'dept-2', name: 'Maintenance' },
  { id: 'dept-3', name: 'Administration' },
];

// ── Seed locations ────────────────────────────────────────────────────────────
const locations = [
  { id: 'loc-1', block: 'A', areaType: 'Classroom', name: 'Block A – Classroom' },
  { id: 'loc-2', block: 'A', areaType: 'Lab', name: 'Block A – Computer Lab' },
  { id: 'loc-3', block: 'B', areaType: 'Classroom', name: 'Block B – Classroom' },
  { id: 'loc-4', block: 'B', areaType: 'Lab', name: 'Block B – Electronics Lab' },
  { id: 'loc-5', block: 'C', areaType: 'Lecture Hall', name: 'Block C – Lecture Hall' },
  { id: 'loc-6', block: 'D', areaType: 'Hostel', name: 'Hostel Block D' },
  { id: 'loc-7', block: 'E', areaType: 'Hostel', name: 'Hostel Block E' },
  { id: 'loc-8', block: '', areaType: 'Library', name: 'Central Library' },
  { id: 'loc-9', block: '', areaType: 'Common Area', name: 'Main Canteen' },
  { id: 'loc-10', block: '', areaType: 'Common Area', name: 'Sports Complex' },
  { id: 'loc-11', block: '', areaType: 'Washroom', name: 'Ground Floor Washrooms' },
  { id: 'loc-12', block: '', areaType: 'Washroom', name: 'First Floor Washrooms' },
];

// ── Seed users ────────────────────────────────────────────────────────────────
const SALT = bcrypt.genSaltSync(10);
const users = [
  {
    id: 'user-1',
    name: 'Daksh Joshi',
    email: 'student@kiet.edu',
    passwordHash: bcrypt.hashSync('student123', SALT),
    role: 'student',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-2',
    name: 'Staff User',
    email: 'staff@kiet.edu',
    passwordHash: bcrypt.hashSync('staff123', SALT),
    role: 'staff',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-3',
    name: 'Admin User',
    email: 'admin@kiet.edu',
    passwordHash: bcrypt.hashSync('admin123', SALT),
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
];

// ── Seed complaints ───────────────────────────────────────────────────────────
const complaints = [
  {
    id: 'cmp-001',
    userId: 'user-1',
    locationId: 'loc-2',
    departmentId: 'dept-1',
    description: 'WiFi is not working in the computer lab. Cannot access study material.',
    category: 'Wi-Fi / Network',
    priority: 'High',
    status: 'In Progress',
    needsManualRouting: false,
    confidence: 0.91,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'cmp-002',
    userId: 'user-1',
    locationId: 'loc-1',
    departmentId: 'dept-2',
    description: 'AC stopped working in classroom. Very hot.',
    category: 'AC / Cooling',
    priority: 'High',
    status: 'Submitted',
    needsManualRouting: false,
    confidence: 0.88,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'cmp-003',
    userId: 'user-1',
    locationId: 'loc-5',
    departmentId: 'dept-1',
    description: 'Projector not working. Lecture disrupted.',
    category: 'Projector / AV',
    priority: 'Medium',
    status: 'Resolved',
    needsManualRouting: false,
    confidence: 0.85,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

// ── Status history ────────────────────────────────────────────────────────────
const statusHistory = [
  { id: uuidv4(), complaintId: 'cmp-001', status: 'Submitted', updatedBy: 'user-1', updatedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: uuidv4(), complaintId: 'cmp-001', status: 'In Progress', updatedBy: 'user-2', updatedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: uuidv4(), complaintId: 'cmp-002', status: 'Submitted', updatedBy: 'user-1', updatedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: uuidv4(), complaintId: 'cmp-003', status: 'Submitted', updatedBy: 'user-1', updatedAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: uuidv4(), complaintId: 'cmp-003', status: 'In Progress', updatedBy: 'user-2', updatedAt: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: uuidv4(), complaintId: 'cmp-003', status: 'Resolved', updatedBy: 'user-2', updatedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
];

// ── Notifications ─────────────────────────────────────────────────────────────
const notifications = [
  { id: uuidv4(), userId: 'user-1', complaintId: 'cmp-001', message: 'Your complaint #cmp-001 is now In Progress.', isRead: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: uuidv4(), userId: 'user-1', complaintId: 'cmp-003', message: 'Your complaint #cmp-003 has been Resolved!', isRead: true, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
];

// ── Feedback ──────────────────────────────────────────────────────────────────
const feedbacks = [
  { id: uuidv4(), complaintId: 'cmp-003', userId: 'user-1', rating: 4, comment: 'Fixed quickly. Thanks!', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
];

module.exports = {
  users, complaints, departments, locations,
  statusHistory, notifications, feedbacks,
  uuidv4,
};
