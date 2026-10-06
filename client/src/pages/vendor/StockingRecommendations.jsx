import { useEffect, useState } from 'react';
import * as demandService from '../../services/demand';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { ClassificationBadge } from '../../components/ui/Badge';

const PRIORITY_STYLE = {
  HIGH_PRIORITY: 'border-l-4 border-red-500',
  CONSIDER_INCREASING: 'border-l-4 border-amber-500',
};

const PRIORITY_LABEL = {
  HIGH_PRIORITY: 'HIGH PRIORITY FOR STOCKING',
  CONSIDER_INCREASING: 'CONSIDER INCREASING',
};

export default function StockingRecommendations() {
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    demandService.getRecommendations().then(setRecs).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Analyzing regional demand..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">Stocking recommendations</h1>
        <p className="mt-1 text-sm text-gray-500">Calculated from real search, requirement, and order data in your region.</p>
      </div>

      {recs.length === 0 && (
        <EmptyState title="No recommendations right now" message="Supply currently meets observed demand for every product." />
      )}

      <div className="space-y-4">
        {recs.map((r) => (
          <Card key={r.productId} className={PRIORITY_STYLE[r.priority]}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-[var(--color-dark)]">{r.productName}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-500">{r.demandScore}/100</span>
                <ClassificationBadge classification={r.classification} />
              </div>
            </div>
            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-red-500">{PRIORITY_LABEL[r.priority]}</p>
            <p className="mt-2 text-sm text-[var(--color-text-soft)]">{r.reason}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
