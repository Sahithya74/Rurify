import { useEffect, useState } from 'react';
import * as adminService from '../../services/admin';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { StatusBadge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Field';

const STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'PROCESSING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'];

export default function OrderManagement() {
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setLoading(true);
    adminService.listAdminOrders(status ? { status } : {}).then(setOrders).finally(() => setLoading(false));
  }, [status]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">Orders</h1>
        <Select className="w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Retailer</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 text-gray-400">{o.id}</td>
                  <td className="px-4 py-3 font-semibold text-[var(--color-dark)]">{o.Product?.name}</td>
                  <td className="px-4 py-3 text-gray-500">{o.Retailer?.shopName}</td>
                  <td className="px-4 py-3 text-gray-500">{o.Vendor?.businessName}</td>
                  <td className="px-4 py-3">&#8377;{o.totalPrice}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
