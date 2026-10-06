import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import * as demandService from '../../services/demand';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { ClassificationBadge } from '../../components/ui/Badge';

const COLORS = { searches: '#cfe0ce', requirementRequests: '#e8871e', completedOrders: '#16241c' };

export default function DemandIntelligence() {
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    demandService.getTopProducts({ limit: 10 }).then(setProducts).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Computing demand intelligence..." />;

  const chartData = products.map((p) => ({
    name: p.name,
    searches: p.searches,
    requirementRequests: p.requirementRequests,
    completedOrders: p.completedOrders,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">Demand Intelligence</h1>
        <p className="mt-1 text-sm text-gray-500">
          A transparent, rule-based score from real activity &mdash; not a prediction, not AI.
        </p>
      </div>

      <Card>
        <h2 className="font-bold text-[var(--color-dark)]">Top demanded products</h2>
        <p className="mt-1 text-xs text-gray-400">
          Raw activity per product. The Demand Intelligence Score in the table weights these (requests count 3×) and adds
          a bonus when nearby supply is short.
        </p>
        <div className="mt-4 h-80 w-full">
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{ value: 'Events recorded', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#6b7280' }}
              />
              <Tooltip />
              <Legend formatter={(value) => <span style={{ color: '#3f4a3d' }}>{value}</span>} />
              <Bar dataKey="searches" stackId="a" fill={COLORS.searches} name="Searches" />
              <Bar dataKey="requirementRequests" stackId="a" fill={COLORS.requirementRequests} name="Requirement requests" />
              <Bar dataKey="completedOrders" stackId="a" fill={COLORS.completedOrders} name="Completed orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Searches</th>
              <th className="px-4 py-3">Requests</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Nearby stock</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Demand</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.productId}>
                <td className="px-4 py-3 font-semibold text-[var(--color-dark)]">{p.name}</td>
                <td className="px-4 py-3">{p.searches}</td>
                <td className="px-4 py-3">{p.requirementRequests}</td>
                <td className="px-4 py-3">{p.completedOrders}</td>
                <td className="px-4 py-3">{p.nearbyStock} {p.unit}</td>
                <td className="px-4 py-3 font-bold">{p.demandScore}/100</td>
                <td className="px-4 py-3"><ClassificationBadge classification={p.classification} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
