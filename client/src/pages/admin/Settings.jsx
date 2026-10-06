import { useEffect, useState } from 'react';
import * as adminService from '../../services/admin';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';

const LABELS = {
  distance: 'Distance',
  price: 'Price',
  availability: 'Availability',
  moq: 'MOQ fit',
  freshness: 'Freshness',
  delivery: 'Delivery',
  reliability: 'Vendor reliability',
  search: 'Search',
  requirementRequest: 'Requirement request',
  orderAttempt: 'Order attempt',
  completedOrder: 'Completed order',
};

function WeightTable({ weights, format }) {
  return (
    <table className="mt-3 w-full text-sm">
      <tbody className="divide-y divide-gray-100">
        {Object.entries(weights).map(([key, value]) => (
          <tr key={key}>
            <td className="py-2 text-gray-600">{LABELS[key] || key}</td>
            <td className="py-2 text-right font-semibold text-[var(--color-dark)]">{format(value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    adminService.getPlatformSettings().then(setSettings).catch(() => setSettings({}));
  }, []);

  if (!settings) return <Spinner />;
  if (!settings.matchScoreWeights) return <p className="text-sm text-gray-500">Could not load settings.</p>;

  const { matchScoreWeights, demandScore, inventorySync, demandAlerts, database } = settings;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          The scoring configuration the platform is running with right now. Read-only: editing these from the UI is
          future functionality.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <h2 className="font-bold text-[var(--color-dark)]">Supplier match score weights</h2>
          <p className="mt-1 text-xs text-gray-400">Each factor is scored 0–100, then combined with these weights.</p>
          <WeightTable weights={matchScoreWeights} format={(v) => `${Math.round(v * 100)}%`} />
        </Card>

        <Card>
          <h2 className="font-bold text-[var(--color-dark)]">Demand Intelligence Score</h2>
          <p className="mt-1 text-xs text-gray-400">
            Points per event, scaled to 0–100 against a cap of {demandScore.rawScoreCap}. Rule-based, not machine learning.
          </p>
          <WeightTable weights={demandScore.weights} format={(v) => `× ${v}`} />
          <p className="mt-3 text-xs text-gray-500">
            Availability-gap bonus: +{demandScore.availabilityGapBonus.noNearbyStock} with no nearby stock, +
            {demandScore.availabilityGapBonus.stockBelowRequested} when stock is below the requested quantity.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {Object.entries(demandScore.classification).map(([label, range]) => (
              <span key={label} className="rounded-full bg-[var(--color-sand)] px-2.5 py-1 font-semibold">
                {label.replace('_', ' ')}: {range}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-bold text-[var(--color-dark)]">Platform</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Inventory sync</dt>
              <dd className="font-semibold">
                {inventorySync.mechanism}, every {inventorySync.clientIntervalSeconds}s
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Demand alerts</dt>
              <dd className="font-semibold">
                {demandAlerts.channel}, max once per {demandAlerts.cooldownHours}h per product
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Database</dt>
              <dd className="font-semibold">{database}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
