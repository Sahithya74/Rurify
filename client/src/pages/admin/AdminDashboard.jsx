import { useEffect, useState } from 'react';
import * as adminService from '../../services/admin';
import * as demandService from '../../services/demand';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { ClassificationBadge } from '../../components/ui/Badge';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.listUsers(),
      adminService.listVendors(),
      adminService.listRetailers(),
      adminService.listAdminOrders(),
      adminService.listAdminRequirements({ status: 'PENDING' }),
      demandService.getTopProducts({ limit: 5 }),
    ])
      .then(([users, vendors, retailers, orders, requirements, top]) => {
        setStats({
          users: users.length,
          vendors: vendors.length,
          retailers: retailers.length,
          orders: orders.length,
          pendingRequirements: requirements.length,
        });
        setTopProducts(top);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading platform overview..." />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">Platform overview</h1>
        <p className="mt-1 text-sm text-gray-500">A live snapshot of the entire Rurify ecosystem.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Users" value={stats.users} />
        <StatCard label="Vendors" value={stats.vendors} />
        <StatCard label="Retailers" value={stats.retailers} />
        <StatCard label="Orders" value={stats.orders} />
        <StatCard label="Open requirements" value={stats.pendingRequirements} accent />
      </div>

      <Card>
        <h2 className="font-bold text-[var(--color-dark)]">Top demanded products (platform-wide)</h2>
        <div className="mt-4 divide-y divide-gray-100">
          {topProducts.map((p) => (
            <div key={p.productId} className="flex items-center justify-between py-3 text-sm">
              <span className="font-semibold text-[var(--color-dark)]">{p.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-gray-500">{p.demandScore}/100</span>
                <ClassificationBadge classification={p.classification} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
