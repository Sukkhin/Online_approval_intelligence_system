import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import PrincipalLogin from './pages/PrincipalLogin';
import PrincipalOverview from './pages/PrincipalOverview';
import Dashboard from './pages/Dashboard';
import SubmitRequest from './pages/SubmitRequest';
import MyRequests from './pages/MyRequests';
import ManageApprovals from './pages/ManageApprovals';
import UserManagement from './pages/UserManagement';
import RequestDetail from './pages/RequestDetail';
import Notifications from './pages/Notifications';
import Analytics from './pages/Analytics';
import { getDefaultRoute } from './utils/roleRoutes';

function DefaultRouteRedirect() {
    const { user } = useAuth();
    return <Navigate to={getDefaultRoute(user?.role)} replace />;
}

export default function App() {
    return (
        <AuthProvider>
            <NotificationProvider>
                <Router>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/principal-login" element={<PrincipalLogin />} />

                        {/* Protected Routes with Sidebar Layout */}
                        <Route
                            element={
                                <ProtectedRoute>
                                    <Layout />
                                </ProtectedRoute>
                            }
                        >
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route
                                path="/principal-overview"
                                element={
                                    <ProtectedRoute roles={['principal']}>
                                        <PrincipalOverview />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/submit-request" element={<SubmitRequest />} />
                            <Route path="/my-requests" element={<MyRequests />} />
                            <Route path="/request/:id" element={<RequestDetail />} />
                            <Route path="/notifications" element={<Notifications />} />

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
                            <Route
                                path="/analytics"
                                element={
                                    <ProtectedRoute roles={['admin', 'principal']}>
                                        <Analytics />
                                    </ProtectedRoute>
                                }
                            />
                        </Route>

                        {/* Default redirect */}
                        <Route path="/" element={<DefaultRouteRedirect />} />
                        <Route path="*" element={<DefaultRouteRedirect />} />
                    </Routes>
                </Router>
            </NotificationProvider>
        </AuthProvider>
    );
}
