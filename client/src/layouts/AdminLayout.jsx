import DashboardShell from './DashboardShell';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: '⌂', end: true },
  { to: '/admin/users', label: 'Users', icon: '\u{1F465}' },
  { to: '/admin/vendors', label: 'Vendors', icon: '\u{1F3EA}' },
  { to: '/admin/retailers', label: 'Retailers', icon: '\u{1F3EC}' },
  { to: '/admin/products', label: 'Products', icon: '\u{1F966}' },
  { to: '/admin/orders', label: 'Orders', icon: '\u{1F4E6}' },
  { to: '/admin/requirements', label: 'Requirements', icon: '\u{1F4CB}' },
  { to: '/admin/demand', label: 'Demand', icon: '\u{1F4C8}' },
  { to: '/admin/regional', label: 'Regional', icon: '\u{1F5FA}' },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: '\u{1F4DC}' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙' },
];

export default function AdminLayout() {
  return <DashboardShell navItems={navItems} roleLabel="Administrator" basePath="/admin" />;
}
