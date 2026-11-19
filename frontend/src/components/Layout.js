import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_STUDENT = [
  { path: '/', icon: '🏠', label: 'Dashboard' },
  { path: '/new-complaint', icon: '➕', label: 'New Complaint' },
  { path: '/my-complaints', icon: '📋', label: 'My Complaints' },
  { path: '/notifications', icon: '🔔', label: 'Notifications' },
];

const NAV_STAFF_ADMIN = [
  { path: '/', icon: '🏠', label: 'Dashboard' },
  { path: '/admin/complaints', icon: '📋', label: 'All Complaints' },
  { path: '/analytics', icon: '📊', label: 'Analytics' },
  { path: '/notifications', icon: '🔔', label: 'Notifications' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = user?.role === 'student' ? NAV_STUDENT : NAV_STAFF_ADMIN;

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>🎓 CampusFix</h1>
          <span>Smart Campus Management</span>
        </div>

        <nav className="nav-links">
          {navLinks.map(link => (
            <button
              key={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={() => navigate(link.path)}
            >
              <span className="nav-icon">{link.icon}</span>
              <span>{link.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button onClick={logout} className="btn btn-sm btn-secondary" title="Logout">⬅</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
