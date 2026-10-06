import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as catalogService from '../../services/catalog';
import * as orderService from '../../services/orders';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Field';

function MatchScoreRing({ score }) {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#e8871e' : '#9ca3af';
  return (
    <div className="flex flex-col items-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-extrabold text-white"
        style={{ background: color }}
      >
        {score}
      </div>
      <span className="mt-1 text-[11px] font-semibold text-gray-400">MATCH SCORE</span>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(null); // inventoryId being ordered
  const [qty, setQty] = useState({});
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    catalogService
      .getSuppliersForProduct(id)
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  const placeOrder = async (supplier) => {
    const quantity = Number(qty[supplier.inventoryId] || supplier.moq);
    setPlacing(true);
    try {
      await orderService.createOrder({ inventoryId: supplier.inventoryId, quantity });
      toast.success(`Order placed for ${quantity} ${supplier.unit} of ${data.product.name}.`);
      navigate('/retailer/orders');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not place order'));
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <Spinner label="Ranking nearby suppliers..." />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <img src={data.product.imageUrl} alt={data.product.name} className="h-20 w-20 rounded-xl object-cover" />
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-dark)]">
            {data.product.name}
            {data.product.variety ? ` — ${data.product.variety}` : ''}
          </h1>
          <p className="text-sm text-gray-500">{data.product.description}</p>
        </div>
      </div>

      {data.unavailable ? (
        <EmptyState
          title="Product currently unavailable nearby"
          message="No connected supplier has stock right now. Raise a requirement and we'll track the demand."
          action={
            <Link to={`/retailer/requirements/new?productId=${data.product.id}`}>
              <Button>Raise requirement</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {data.suppliers.map((s) => (
            <Card key={s.inventoryId} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                <MatchScoreRing score={s.matchScore} />
                <div>
                  <h3 className="font-bold text-[var(--color-dark)]">{s.vendorName}</h3>
                  <p className="text-sm text-gray-500">
                    {s.distanceKm} km &middot; {s.quantity} {s.unit} available &middot; &#8377;{s.price}/{s.unit}
                  </p>
                  <p className="text-xs text-gray-400">
                    MOQ {s.moq} {s.unit} &middot; {s.freshness} &middot;{' '}
                    {s.deliveryAvailable ? 'Delivery available' : 'Pickup only'} &middot; Updated{' '}
                    {new Date(s.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {ordering === s.inventoryId ? (
                  <>
                    <Input
                      type="number"
                      min={s.moq}
                      max={s.quantity}
                      className="w-24"
                      placeholder={`${s.moq}`}
                      value={qty[s.inventoryId] || ''}
                      onChange={(e) => setQty({ ...qty, [s.inventoryId]: e.target.value })}
                    />
                    <Button size="sm" loading={placing} onClick={() => placeOrder(s)}>
                      Confirm
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setOrdering(null)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setOrdering(s.inventoryId)}>Order</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
