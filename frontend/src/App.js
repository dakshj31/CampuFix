import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NewComplaint from './pages/NewComplaint';
import MyComplaints from './pages/MyComplaints';
import ComplaintDetail from './pages/ComplaintDetail';
import AdminComplaints from './pages/AdminComplaints';
import Analytics from './pages/Analytics';
import NotificationsPage from './pages/NotificationsPage';

function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="new-complaint" element={<PrivateRoute roles={['student']}><NewComplaint /></PrivateRoute>} />
            <Route path="my-complaints" element={<PrivateRoute roles={['student']}><MyComplaints /></PrivateRoute>} />
            <Route path="complaints/:id" element={<ComplaintDetail />} />
            <Route path="admin/complaints" element={<PrivateRoute roles={['admin','staff']}><AdminComplaints /></PrivateRoute>} />
            <Route path="analytics" element={<PrivateRoute roles={['admin','staff']}><Analytics /></PrivateRoute>} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
