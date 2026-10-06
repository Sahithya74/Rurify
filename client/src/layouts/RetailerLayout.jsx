import DashboardShell from './DashboardShell';

const navItems = [
  { to: '/retailer', label: 'Dashboard', icon: '⌂', end: true },
  { to: '/retailer/search', label: 'Search', icon: '\u{1F50D}' },
  { to: '/retailer/requirements', label: 'Requirements', icon: '\u{1F4CB}' },
  { to: '/retailer/orders', label: 'Orders', icon: '\u{1F4E6}' },
  { to: '/retailer/suppliers', label: 'Suppliers', icon: '\u{1F91D}' },
  { to: '/retailer/notifications', label: 'Alerts', icon: '\u{1F514}' },
  { to: '/retailer/profile', label: 'Profile', icon: '\u{1F464}' },
];

export default function RetailerLayout() {
  return <DashboardShell navItems={navItems} roleLabel="Retailer" basePath="/retailer" />;
}
