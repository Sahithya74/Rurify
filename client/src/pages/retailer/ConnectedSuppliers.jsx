import { useEffect, useState } from 'react';
import * as connectionService from '../../services/connections';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';

export default function ConnectedSuppliers() {
  const [vendors, setVendors] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    connectionService.listMyConnections().then(setVendors).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">Connected suppliers</h1>
        <p className="mt-1 text-sm text-gray-500">Vendors you&rsquo;ve ordered from &mdash; their inventory syncs to you automatically.</p>
      </div>

      {vendors.length === 0 && (
        <EmptyState title="No connected suppliers yet" message="Placing an order with a vendor connects you automatically." />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {vendors.map((v) => (
          <Card key={v.id} className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[var(--color-dark)]">{v.businessName}</h3>
              <p className="text-sm text-gray-500">{v.address}</p>
              <p className="text-xs text-gray-400">{v.Region?.name}</p>
            </div>
            {v.verified && <Badge color="green">Verified</Badge>}
          </Card>
        ))}
      </div>
    </div>
  );
}
