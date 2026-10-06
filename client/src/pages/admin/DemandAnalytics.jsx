import { useEffect, useState } from 'react';
import * as adminService from '../../services/admin';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { ClassificationBadge } from '../../components/ui/Badge';

function ProductList({ title, items, valueLabel, valueKey }) {
  return (
    <Card>
      <h2 className="font-bold text-[var(--color-dark)]">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">No data yet.</p>
      ) : (
        <div className="mt-3 divide-y divide-gray-100">
          {items.map((p) => (
            <div key={p.productId} className="flex items-center justify-between py-2.5 text-sm">
              <span className="font-semibold text-[var(--color-dark)]">{p.name}</span>
              <span className="text-gray-500">{p[valueKey]} {valueLabel}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function DemandAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDemandAnalytics().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Crunching platform-wide demand data..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">Demand analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Platform-wide view of what retailers want and where supply falls short.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ProductList title="Most searched" items={data.mostSearched} valueLabel="searches" valueKey="searches" />
        <ProductList title="Most requested" items={data.mostRequested} valueLabel="requests" valueKey="requirementRequests" />
        <ProductList title="Most ordered" items={data.mostOrdered} valueLabel="completed orders" valueKey="completedOrders" />

        <Card>
          <h2 className="font-bold text-[var(--color-dark)]">Frequently unavailable</h2>
          {data.mostUnavailable.length === 0 ? (
            <p className="mt-4 text-sm text-gray-400">Everything searched has nearby stock.</p>
          ) : (
            <div className="mt-3 divide-y divide-gray-100">
              {data.mostUnavailable.map((p) => (
                <div key={p.productId} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-semibold text-[var(--color-dark)]">{p.name}</span>
                  <ClassificationBadge classification={p.classification} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="font-bold text-[var(--color-dark)]">Supply gaps (demand exceeds nearby stock)</h2>
        {data.supplyGaps.length === 0 ? (
          <EmptyState title="No supply gaps" message="Nearby stock currently meets requested quantities for every product." />
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-xs uppercase text-gray-500">
              <tr>
                <th className="py-2">Product</th>
                <th className="py-2">Requested</th>
                <th className="py-2">Nearby stock</th>
                <th className="py-2">Demand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.supplyGaps.map((p) => (
                <tr key={p.productId}>
                  <td className="py-2.5 font-semibold text-[var(--color-dark)]">{p.name}</td>
                  <td className="py-2.5">{p.totalRequestedQty} {p.unit}</td>
                  <td className="py-2.5">{p.nearbyStock} {p.unit}</td>
                  <td className="py-2.5"><ClassificationBadge classification={p.classification} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
