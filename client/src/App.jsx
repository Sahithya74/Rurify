import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

import PublicLayout from './layouts/PublicLayout';
import RetailerLayout from './layouts/RetailerLayout';
import VendorLayout from './layouts/VendorLayout';
import AdminLayout from './layouts/AdminLayout';

import Landing from './pages/public/Landing';
import About from './pages/public/About';
import HowItWorks from './pages/public/HowItWorks';
import Login from './pages/public/Login';
import Register from './pages/public/Register';

import RetailerDashboard from './pages/retailer/RetailerDashboard';
import ProductSearch from './pages/retailer/ProductSearch';
import ProductDetail from './pages/retailer/ProductDetail';
import RequirementCreate from './pages/retailer/RequirementCreate';
import MyRequirements from './pages/retailer/MyRequirements';
import MyOrders from './pages/retailer/MyOrders';
import ConnectedSuppliers from './pages/retailer/ConnectedSuppliers';

import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorInventory from './pages/vendor/VendorInventory';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorRequirements from './pages/vendor/VendorRequirements';
import DemandIntelligence from './pages/vendor/DemandIntelligence';
import StockingRecommendations from './pages/vendor/StockingRecommendations';
import VendorConnections from './pages/vendor/VendorConnections';

import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import VendorManagement from './pages/admin/VendorManagement';
import RetailerManagement from './pages/admin/RetailerManagement';
import ProductManagement from './pages/admin/ProductManagement';
import OrderManagement from './pages/admin/OrderManagement';
import RequirementManagement from './pages/admin/RequirementManagement';
import DemandAnalytics from './pages/admin/DemandAnalytics';
import RegionalAnalytics from './pages/admin/RegionalAnalytics';
import AuditLogs from './pages/admin/AuditLogs';

import NotificationsPage from './pages/shared/NotificationsPage';
import ProfilePage from './pages/shared/ProfilePage';

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
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
