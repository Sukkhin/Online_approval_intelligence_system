import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SubmitRequest from './pages/SubmitRequest';
import MyRequests from './pages/MyRequests';
import ManageApprovals from './pages/ManageApprovals';
import UserManagement from './pages/UserManagement';

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected Routes with Sidebar Layout */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/submit-request" element={<SubmitRequest />} />
                        <Route path="/my-requests" element={<MyRequests />} />

                        {/* Admin only routes */}
                        <Route
                            path="/manage-approvals"
                            element={
                                <ProtectedRoute roles={['admin', 'principal']}>
                                    <ManageApprovals />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/user-management"
                            element={
                                <ProtectedRoute roles={['admin', 'principal']}>
                                    <UserManagement />
                                </ProtectedRoute>
                            }
                        />
                    </Route>

                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}
