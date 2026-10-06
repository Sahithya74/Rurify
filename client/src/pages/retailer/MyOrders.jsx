import { useEffect, useState } from 'react';
import * as orderService from '../../services/orders';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../services/api';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function MyOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);

  const load = () => orderService.listOrders().then(setOrders).finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);

  const cancelOrder = async () => {
    try {
      await orderService.updateOrderStatus(cancelTarget.id, 'CANCELLED');
      toast.success('Order cancelled');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not cancel order'));
    } finally {
      setCancelTarget(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">My orders</h1>
        <p className="mt-1 text-sm text-gray-500">Track every order from placement to delivery.</p>
      </div>

      {orders.length === 0 && <EmptyState title="No orders yet" message="Search for a product to place your first order." />}

      <div className="space-y-4">
        {orders.map((o) => (
          <Card key={o.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-[var(--color-dark)]">
                {o.Product?.name} &middot; {o.quantity} {o.Product?.unit}
              </h3>
              <p className="text-sm text-gray-500">
                {o.Vendor?.businessName} &middot; &#8377;{o.totalPrice} total &middot; Order #{o.id}
              </p>
              <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={o.status} />
              {o.status === 'PENDING' && (
                <Button variant="danger" size="sm" onClick={() => setCancelTarget(o)}>
                  Cancel
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel this order?"
        message="This cannot be undone. The vendor will be notified."
        confirmLabel="Cancel order"
        danger
        onConfirm={cancelOrder}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
