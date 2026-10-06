import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as dashboardService from '../../services/dashboard';
import * as inventoryService from '../../services/inventory';
import usePolling from '../../hooks/usePolling';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { ClassificationBadge } from '../../components/ui/Badge';

const FIELD_LABEL = {
  quantity: 'Stock updated',
  price: 'Price updated',
  created: 'New product listed',
  isActive: 'Availability changed',
};

export default function RetailerDashboard() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastSeenRef = useRef(new Date().toISOString());
  const isFirstSync = useRef(true);

  const load = () => {
    dashboardService
      .getRetailerDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  usePolling(() => {
    inventoryService.getSyncFeed(lastSeenRef.current).then((res) => {
      if (!isFirstSync.current && res.data.length > 0) {
        res.data.forEach((u) => {
          toast.info(`${FIELD_LABEL[u.field] || 'Update'}: ${u.productName} — ${u.vendorName}`);
        });
        load();
      }
      isFirstSync.current = false;
      lastSeenRef.current = res.serverTime;
    });
  }, 10000);

  if (loading) return <Spinner label="Loading your dashboard..." />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Supply is synced automatically from your connected vendors.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Connected suppliers" value={data.totalConnectedSuppliers} />
        <StatCard label="Pending requirements" value={data.pendingRequirements} accent />
        <StatCard label="Active orders" value={data.activeOrders} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[var(--color-dark)]">Recent supplier updates</h2>
          </div>
          <div className="mt-4 divide-y divide-gray-100">
            {data.recentSupplierUpdates.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-400">No supplier activity yet.</p>
            )}
            {data.recentSupplierUpdates.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-semibold text-[var(--color-dark)]">{u.productName}</p>
                  <p className="text-xs text-gray-400">{FIELD_LABEL[u.field] || u.changeType}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="font-bold text-[var(--color-dark)]">Quick actions</h2>
          <Link to="/retailer/search" className="block">
            <Button className="w-full justify-center">Search products</Button>
          </Link>
          <Link to="/retailer/requirements" className="block">
            <Button variant="outline" className="w-full justify-center">My requirements</Button>
          </Link>
          <Link to="/retailer/orders" className="block">
            <Button variant="outline" className="w-full justify-center">My orders</Button>
          </Link>
        </Card>
      </div>

      {data.stillUnavailable?.length > 0 && (
        <Card>
          <h2 className="font-bold text-[var(--color-dark)]">Still unavailable nearby</h2>
          <p className="mt-1 text-xs text-gray-400">
            Products you requested that no supplier stocks yet. Vendors can see this demand.
          </p>
          <div className="mt-3 divide-y divide-gray-100">
            {data.stillUnavailable.map((p) => (
              <div key={p.productId} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-semibold text-[var(--color-dark)]">{p.name}</p>
                  <p className="text-xs text-gray-400">
                    {p.retailersRequesting} request{p.retailersRequesting !== 1 ? 's' : ''} across the platform
                  </p>
                </div>
                <ClassificationBadge classification={p.classification} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {data.totalConnectedSuppliers === 0 && (
        <EmptyState
          title="No connected suppliers yet"
          message="Search for a product and place an order to automatically connect with a vendor."
          action={
            <Link to="/retailer/search">
              <Button>Start searching</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
