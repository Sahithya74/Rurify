import { useEffect, useState } from 'react';
import * as orderService from '../../services/orders';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/Badge';

const NEXT_STATUSES = {
  PENDING: [['ACCEPTED', 'primary'], ['REJECTED', 'danger']],
  ACCEPTED: [['PROCESSING', 'primary']],
  PROCESSING: [['READY', 'primary']],
  READY: [['OUT_FOR_DELIVERY', 'primary'], ['COMPLETED', 'outline']],
  OUT_FOR_DELIVERY: [['COMPLETED', 'primary']],
};

export default function VendorOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const load = () => orderService.listOrders().then(setOrders).finally(() => setLoading(false));
  useEffect(load, []);

  const updateStatus = async (order, status) => {
    setUpdating(order.id);
    try {
      await orderService.updateOrderStatus(order.id, status);
      toast.success(`Order #${order.id} moved to ${status.replace(/_/g, ' ')}`);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not update order'));
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">Accept, process, and fulfill retailer orders.</p>
      </div>

      {orders.length === 0 && <EmptyState title="No orders yet" message="Orders from retailers will show up here." />}

      <div className="space-y-4">
        {orders.map((o) => (
          <Card key={o.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-[var(--color-dark)]">
                {o.Product?.name} &middot; {o.quantity} {o.Product?.unit}
              </h3>
              <p className="text-sm text-gray-500">
                {o.Retailer?.shopName} &middot; &#8377;{o.totalPrice} total &middot; Order #{o.id}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={o.status} />
              {(NEXT_STATUSES[o.status] || []).map(([status, variant]) => (
                <Button
                  key={status}
                  size="sm"
                  variant={variant}
                  loading={updating === o.id}
                  onClick={() => updateStatus(o, status)}
                >
                  {status.replace(/_/g, ' ')}
                </Button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
