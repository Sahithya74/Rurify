import { useEffect, useMemo, useState } from 'react';
import * as requirementService from '../../services/requirements';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { ClassificationBadge } from '../../components/ui/Badge';

function AggregateHeader({ productId, productName }) {
  const [agg, setAgg] = useState(null);
  useEffect(() => {
    requirementService.getRequirementAggregate(productId).then(setAgg).catch(() => {});
  }, [productId]);

  if (!agg) return null;
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--color-sand)] px-4 py-3">
      <p className="text-sm font-bold text-[var(--color-dark)]">
        {productName}: {agg.retailersRequesting} retailer{agg.retailersRequesting !== 1 ? 's' : ''} requesting &middot;{' '}
        {agg.totalRequestedQty} {agg.product?.unit} total &middot; {agg.nearbyStock} {agg.product?.unit} nearby stock
      </p>
      <ClassificationBadge classification={agg.demandClassification} />
    </div>
  );
}

export default function VendorRequirements() {
  const toast = useToast();
  const [requirements, setRequirements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);

  const load = () => requirementService.listRequirements().then(setRequirements).finally(() => setLoading(false));
  useEffect(load, []);

  const respond = async (req, response) => {
    setResponding(req.id);
    try {
      await requirementService.respondToRequirement(req.id, { response });
      toast.success('Response sent to the retailer.');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not respond'));
    } finally {
      setResponding(null);
    }
  };

  const grouped = useMemo(() => {
    if (!requirements) return [];
    const map = new Map();
    requirements.forEach((r) => {
      const key = r.productId;
      if (!map.has(key)) map.set(key, { product: r.Product, items: [] });
      map.get(key).items.push(r);
    });
    return Array.from(map.values());
  }, [requirements]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">Retailer requirements</h1>
        <p className="mt-1 text-sm text-gray-500">Real, aggregated demand for products retailers can&rsquo;t find nearby.</p>
      </div>

      {grouped.length === 0 && <EmptyState title="No open requirements" message="When retailers raise requirements, they'll appear here." />}

      <div className="space-y-8">
        {grouped.map((group) => (
          <div key={group.product?.id}>
            <AggregateHeader productId={group.product?.id} productName={group.product?.name} />
            <div className="space-y-3">
              {group.items.map((req) => (
                <Card key={req.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-[var(--color-dark)]">{req.Retailer?.shopName}</p>
                    <p className="text-sm text-gray-500">
                      {req.requiredQty} {group.product?.unit} needed
                      {req.requiredDate ? ` by ${new Date(req.requiredDate).toLocaleDateString()}` : ''}
                      {req.preferredPrice ? ` · preferred ₹${req.preferredPrice}` : ''}
                    </p>
                    {req.notes && <p className="text-xs text-gray-400">&ldquo;{req.notes}&rdquo;</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" loading={responding === req.id} onClick={() => respond(req, 'AVAILABLE')}>
                      Available
                    </Button>
                    <Button size="sm" variant="outline" loading={responding === req.id} onClick={() => respond(req, 'CAN_STOCK')}>
                      Can stock
                    </Button>
                    <Button size="sm" variant="ghost" loading={responding === req.id} onClick={() => respond(req, 'NOT_AVAILABLE')}>
                      Not available
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
