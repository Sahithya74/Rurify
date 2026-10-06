import { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

import PublicLayout from './layouts/PublicLayout';
import RetailerLayout from './layouts/RetailerLayout';
import VendorLayout from './layouts/VendorLayout';
import AdminLayout from './layouts/AdminLayout';

import Landing from './pages/public/Landing';

// Everything past the landing page is split per route, so Recharts and
// Leaflet only download for the pages that use them.
const About = lazy(() => import('./pages/public/About'));
const HowItWorks = lazy(() => import('./pages/public/HowItWorks'));
const Login = lazy(() => import('./pages/public/Login'));
const Register = lazy(() => import('./pages/public/Register'));

const RetailerDashboard = lazy(() => import('./pages/retailer/RetailerDashboard'));
const ProductSearch = lazy(() => import('./pages/retailer/ProductSearch'));
const ProductDetail = lazy(() => import('./pages/retailer/ProductDetail'));
const RequirementCreate = lazy(() => import('./pages/retailer/RequirementCreate'));
const MyRequirements = lazy(() => import('./pages/retailer/MyRequirements'));
const MyOrders = lazy(() => import('./pages/retailer/MyOrders'));
const ConnectedSuppliers = lazy(() => import('./pages/retailer/ConnectedSuppliers'));

const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));
const VendorInventory = lazy(() => import('./pages/vendor/VendorInventory'));
const VendorOrders = lazy(() => import('./pages/vendor/VendorOrders'));
const VendorRequirements = lazy(() => import('./pages/vendor/VendorRequirements'));
const DemandIntelligence = lazy(() => import('./pages/vendor/DemandIntelligence'));
const StockingRecommendations = lazy(() => import('./pages/vendor/StockingRecommendations'));
const VendorConnections = lazy(() => import('./pages/vendor/VendorConnections'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const VendorManagement = lazy(() => import('./pages/admin/VendorManagement'));
const RetailerManagement = lazy(() => import('./pages/admin/RetailerManagement'));
const ProductManagement = lazy(() => import('./pages/admin/ProductManagement'));
const OrderManagement = lazy(() => import('./pages/admin/OrderManagement'));
const RequirementManagement = lazy(() => import('./pages/admin/RequirementManagement'));
const DemandAnalytics = lazy(() => import('./pages/admin/DemandAnalytics'));
const RegionalAnalytics = lazy(() => import('./pages/admin/RegionalAnalytics'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const Settings = lazy(() => import('./pages/admin/Settings'));

const NotificationsPage = lazy(() => import('./pages/shared/NotificationsPage'));
const ProfilePage = lazy(() => import('./pages/shared/ProfilePage'));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/about" element={<About />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            <Route
              path="/retailer"
              element={
                <ProtectedRoute roles={['retailer']}>
                  <RetailerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RetailerDashboard />} />
              <Route path="search" element={<ProductSearch />} />
              <Route path="products/:id" element={<ProductDetail />} />
              <Route path="requirements/new" element={<RequirementCreate />} />
              <Route path="requirements" element={<MyRequirements />} />
              <Route path="orders" element={<MyOrders />} />
              <Route path="suppliers" element={<ConnectedSuppliers />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route
              path="/vendor"
              element={
                <ProtectedRoute roles={['vendor']}>
                  <VendorLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<VendorDashboard />} />
              <Route path="inventory" element={<VendorInventory />} />
              <Route path="orders" element={<VendorOrders />} />
              <Route path="requirements" element={<VendorRequirements />} />
              <Route path="demand" element={<DemandIntelligence />} />
              <Route path="recommendations" element={<StockingRecommendations />} />
              <Route path="connections" element={<VendorConnections />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="vendors" element={<VendorManagement />} />
              <Route path="retailers" element={<RetailerManagement />} />
              <Route path="products" element={<ProductManagement />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="requirements" element={<RequirementManagement />} />
              <Route path="demand" element={<DemandAnalytics />} />
              <Route path="regional" element={<RegionalAnalytics />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
