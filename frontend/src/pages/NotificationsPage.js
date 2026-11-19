import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/notifications')
      .then(r => setNotifications(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await axios.patch('/api/notifications/read-all').catch(() => {});
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
  };

  const markRead = async id => {
    await axios.patch(`/api/notifications/${id}/read`).catch(() => {});
    setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">🔔 Notifications</div>
          <div className="page-subtitle">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</div>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>Mark all as read</button>
        )}
      </div>

      {loading ? (
        <div className="loading-center"><span className="spinner" /> Loading…</div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <div className="empty-title">No notifications</div>
          <div className="empty-desc">You'll be notified when your complaint status changes.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notifications.map(n => (
            <div key={n.id}
              className="card"
              style={{
                padding: '14px 18px',
                borderLeft: `4px solid ${n.isRead ? 'var(--gray-200)' : 'var(--primary)'}`,
                cursor: 'pointer',
                opacity: n.isRead ? 0.7 : 1,
              }}
              onClick={() => { markRead(n.id); navigate(`/complaints/${n.complaintId}`); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  {!n.isRead && <span className="badge badge-high" style={{ marginBottom: 6 }}>NEW</span>}
                  <div style={{ fontSize: '0.875rem', fontWeight: n.isRead ? 400 : 600 }}>{n.message}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 4 }}>
                    {new Date(n.createdAt).toLocaleString('en-IN')}
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>View →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
