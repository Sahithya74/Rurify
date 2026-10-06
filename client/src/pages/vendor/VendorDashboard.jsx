import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import * as dashboardService from '../../services/dashboard';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import { ClassificationBadge } from '../../components/ui/Badge';

export default function VendorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getVendorDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading your dashboard..." />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">An overview of your catalog, orders, and regional demand.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total products" value={data.totalProducts} />
        <StatCard label="Inventory units" value={data.currentInventoryUnits} />
        <StatCard label="New requirements" value={data.newRetailerRequirements} accent />
        <StatCard label="Pending orders" value={data.pendingOrders} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[var(--color-dark)]">High-demand products in your region</h2>
            <Link to="/vendor/demand" className="text-xs font-semibold text-[var(--color-accent)]">
              View all
            </Link>
          </div>
          <div className="mt-4 divide-y divide-gray-100">
            {data.highDemandProducts.length === 0 && <p className="py-6 text-center text-sm text-gray-400">Nothing trending yet.</p>}
            {data.highDemandProducts.map((p) => (
              <div key={p.productId} className="flex items-center justify-between py-3">
                <span className="text-sm font-semibold text-[var(--color-dark)]">{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{p.demandScore}/100</span>
                  <ClassificationBadge classification={p.classification} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[var(--color-dark)]">Low stock</h2>
            <Link to="/vendor/inventory" className="text-xs font-semibold text-[var(--color-accent)]">
              Manage inventory
            </Link>
          </div>
          <div className="mt-4 divide-y divide-gray-100">
            {data.lowStockProducts.length === 0 && <p className="py-6 text-center text-sm text-gray-400">Stock levels look healthy.</p>}
            {data.lowStockProducts.map((p) => (
              <div key={p.inventoryId} className="flex items-center justify-between py-3 text-sm">
                <span className="font-semibold text-[var(--color-dark)]">{p.productName}</span>
                <span className="text-gray-500">
                  {p.quantity} left (MOQ {p.moq})
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {data.stockingRecommendations > 0 && (
        <Card className="flex items-center justify-between bg-[var(--color-sand)]">
          <div>
            <p className="font-bold text-[var(--color-dark)]">
              {data.stockingRecommendations} high-priority stocking recommendation{data.stockingRecommendations !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-[var(--color-text-soft)]">Based on real regional demand data.</p>
          </div>
          <Link to="/vendor/recommendations">
            <Button>View recommendations</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
