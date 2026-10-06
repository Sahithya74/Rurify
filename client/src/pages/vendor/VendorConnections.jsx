import { useEffect, useState } from 'react';
import * as connectionService from '../../services/connections';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';

export default function VendorConnections() {
  const [retailers, setRetailers] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    connectionService.listMyConnections().then(setRetailers).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">Connected retailers</h1>
        <p className="mt-1 text-sm text-gray-500">Retailers who automatically receive your inventory updates.</p>
      </div>

      {retailers.length === 0 && <EmptyState title="No connected retailers yet" message="A retailer connects to you automatically after placing an order." />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {retailers.map((r) => (
          <Card key={r.id} className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[var(--color-dark)]">{r.shopName}</h3>
              <p className="text-sm text-gray-500">{r.address}</p>
              <p className="text-xs text-gray-400">{r.Region?.name}</p>
            </div>
            {r.verified && <Badge color="green">Verified</Badge>}
          </Card>
        ))}
      </div>
    </div>
  );
}
