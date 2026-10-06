import { useEffect, useState } from 'react';
import * as requirementService from '../../services/requirements';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';

const RESPONSE_COLOR = { AVAILABLE: 'green', CAN_STOCK: 'orange', NOT_AVAILABLE: 'red' };

export default function MyRequirements() {
  const [requirements, setRequirements] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requirementService
      .listRequirements()
      .then(setRequirements)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">My requirements</h1>
        <p className="mt-1 text-sm text-gray-500">Products you&rsquo;ve requested that weren&rsquo;t available nearby.</p>
      </div>

      {requirements.length === 0 && (
        <EmptyState title="No requirements yet" message="When a product isn't available nearby, raise a requirement from its page." />
      )}

      <div className="space-y-4">
        {requirements.map((req) => (
          <Card key={req.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-[var(--color-dark)]">
                {req.Product?.name}
                {req.Product?.variety ? ` — ${req.Product.variety}` : ''}
              </h3>
              <p className="text-sm text-gray-500">
                {req.requiredQty} {req.Product?.unit} needed
                {req.requiredDate ? ` by ${new Date(req.requiredDate).toLocaleDateString()}` : ''}
              </p>
              {req.VendorResponses?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {req.VendorResponses.map((v) => (
                    <Badge key={v.id} color={RESPONSE_COLOR[v.response]}>
                      {v.response.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <Badge color={req.status === 'PENDING' ? 'orange' : 'green'}>{req.status}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
