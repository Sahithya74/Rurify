import DashboardShell from './DashboardShell';

const navItems = [
  { to: '/vendor', label: 'Dashboard', icon: '⌂', end: true },
  { to: '/vendor/inventory', label: 'Inventory', icon: '\u{1F4E6}' },
  { to: '/vendor/orders', label: 'Orders', icon: '\u{1F69A}' },
  { to: '/vendor/requirements', label: 'Requirements', icon: '\u{1F4CB}' },
  { to: '/vendor/demand', label: 'Demand', icon: '\u{1F4C8}' },
  { to: '/vendor/recommendations', label: 'Stocking', icon: '✅' },
  { to: '/vendor/connections', label: 'Retailers', icon: '\u{1F91D}' },
  { to: '/vendor/notifications', label: 'Alerts', icon: '\u{1F514}' },
  { to: '/vendor/profile', label: 'Profile', icon: '\u{1F464}' },
];

export default function VendorLayout() {
  return <DashboardShell navItems={navItems} roleLabel="Vendor" basePath="/vendor" />;
}
