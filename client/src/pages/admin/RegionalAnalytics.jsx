import { useEffect, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as demandService from '../../services/demand';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { ClassificationBadge } from '../../components/ui/Badge';

const CLASS_COLOR = { LOW: '#9ca3af', MEDIUM: '#f59e0b', HIGH: '#e8871e', VERY_HIGH: '#dc2626' };

export default function RegionalAnalytics() {
  const [regions, setRegions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    demandService.getRegionalDemand().then(setRegions).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Mapping regional demand..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">Regional demand</h1>
        <p className="mt-1 text-sm text-gray-500">Click a region to see its top demanded products.</p>
      </div>

      <Card className="overflow-hidden p-0">
        <div style={{ height: 480 }}>
          <MapContainer center={[17.9, 74.8]} zoom={8} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {regions.map(({ region, topProducts }) => {
              const topScore = topProducts[0]?.demandScore || 0;
              const color = CLASS_COLOR[topProducts[0]?.classification || 'LOW'];
              return (
                <CircleMarker
                  key={region.id}
                  center={[region.lat, region.lng]}
                  radius={12 + topScore / 6}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.5 }}
                >
                  <Popup>
                    <p className="font-bold">{region.name}, {region.state}</p>
                    {topProducts.length === 0 && <p className="text-xs text-gray-500">No notable demand yet.</p>}
                    <ul className="mt-1 space-y-1 text-xs">
                      {topProducts.map((p) => (
                        <li key={p.productId}>
                          {p.name} &mdash; {p.demandScore}/100 ({p.classification.replace('_', ' ')})
                        </li>
                      ))}
                    </ul>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {regions.map(({ region, topProducts }) => (
          <Card key={region.id}>
            <h3 className="font-bold text-[var(--color-dark)]">{region.name}, {region.state}</h3>
            <div className="mt-3 divide-y divide-gray-100">
              {topProducts.length === 0 && <p className="py-3 text-sm text-gray-400">No notable demand recorded.</p>}
              {topProducts.map((p) => (
                <div key={p.productId} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-semibold text-[var(--color-dark)]">{p.name}</span>
                  <ClassificationBadge classification={p.classification} />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
