import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';


import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';


import DashboardLayout from './components/layout/DashboardLayout';


import ClientDashboard from './pages/client/Dashboard';
import CreateEvent from './pages/client/CreateEvent';
import MyEvents from './pages/client/MyEvents';
import EventDetail from './pages/client/EventDetail';
import VendorMarketplace from './pages/client/VendorMarketplace';
import VendorDetail from './pages/client/VendorDetail';
import MyBookings from './pages/client/MyBookings';
import BudgetPlanner from './pages/client/BudgetPlanner';
import EventChecklist from './pages/client/EventChecklist';


import VendorDashboard from './pages/vendor/Dashboard';
import VendorProfile from './pages/vendor/Profile';
import VendorServices from './pages/vendor/MyServices';
import BookingRequests from './pages/vendor/BookingRequests';
import VendorReviews from './pages/vendor/Reviews';


import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminVendors from './pages/admin/Vendors';
import AdminEvents from './pages/admin/Events';
import AdminCategories from './pages/admin/Categories';
import AdminBookings from './pages/admin/Bookings';
import LogsDashboard from './pages/admin/LogsDashboard';
import SessionsDashboard from './pages/admin/SessionsDashboard';


const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '12px', padding: '12px 16px' } }} />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route path="/vendors" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
                <Route index element={<VendorMarketplace />} />
              </Route>
              <Route path="/vendors/:id" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
                <Route index element={<VendorDetail />} />
              </Route>

              <Route path="/notifications" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
                <Route index element={<Notifications />} />
              </Route>

              <Route path="/messages" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
                <Route index element={<Messages />} />
              </Route>

              <Route path="/dashboard" element={<PrivateRoute roles={['client']}><DashboardLayout /></PrivateRoute>}>
                <Route index element={<ClientDashboard />} />
                <Route path="events" element={<MyEvents />} />
                <Route path="events/:id" element={<EventDetail />} />
                <Route path="create-event" element={<CreateEvent />} />
                <Route path="bookings" element={<MyBookings />} />
                <Route path="budget" element={<BudgetPlanner />} />
                <Route path="checklist" element={<EventChecklist />} />
              </Route>

              <Route path="/vendor" element={<PrivateRoute roles={['vendor']}><DashboardLayout /></PrivateRoute>}>
                <Route index element={<VendorDashboard />} />
                <Route path="profile" element={<VendorProfile />} />
                <Route path="services" element={<VendorServices />} />
                <Route path="bookings" element={<BookingRequests />} />
                <Route path="reviews" element={<VendorReviews />} />
              </Route>

              <Route path="/admin" element={<PrivateRoute roles={['admin']}><DashboardLayout /></PrivateRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="vendors" element={<AdminVendors />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="analytics" element={<AdminDashboard />} />
                <Route path="logs" element={<LogsDashboard />} />
                <Route path="sessions" element={<SessionsDashboard />} />
              </Route>

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
