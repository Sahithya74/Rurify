import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as catalogService from '../../services/catalog';
import * as orderService from '../../services/orders';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { Field, Input } from '../../components/ui/Field';

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
  const [filters, setFilters] = useState({ requestedQty: '', maxDistance: '', maxPrice: '', deliveryOnly: false });
  const hasFilters = Object.values(filters).some(Boolean);
  const latestRequest = useRef(0);

  const load = (f = filters) => {
    const params = {};
    if (f.requestedQty) params.requestedQty = f.requestedQty;
    if (f.maxDistance) params.maxDistance = f.maxDistance;
    if (f.maxPrice) params.maxPrice = f.maxPrice;
    if (f.deliveryOnly) params.deliveryOnly = true;
    const requestId = ++latestRequest.current;
    setLoading(true);
    catalogService
      .getSuppliersForProduct(id, params)
      .then((result) => {
        if (requestId === latestRequest.current) setData(result);
      })
      .catch((err) => {
        if (requestId === latestRequest.current) toast.error(apiErrorMessage(err, 'Could not load suppliers'));
      })
      .finally(() => {
        if (requestId === latestRequest.current) setLoading(false);
      });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const clearFilters = () => {
    const empty = { requestedQty: '', maxDistance: '', maxPrice: '', deliveryOnly: false };
    setFilters(empty);
    load(empty);
  };

  const placeOrder = async (supplier) => {
    const quantity = Number(qty[supplier.inventoryId] || filters.requestedQty || supplier.moq);
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

  if (loading && !data) return <Spinner label="Ranking nearby suppliers..." />;
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

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="grid grid-cols-2 items-end gap-3 md:grid-cols-5"
        >
          <Field label={`Quantity (${data.product.unit})`}>
            <Input type="number" min="0" step="any" value={filters.requestedQty} onChange={(e) => setFilters({ ...filters, requestedQty: e.target.value })} />
          </Field>
          <Field label="Max distance (km)">
            <Input type="number" min="0" value={filters.maxDistance} onChange={(e) => setFilters({ ...filters, maxDistance: e.target.value })} />
          </Field>
          <Field label="Max price (₹)">
            <Input type="number" min="0" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 pb-3 text-sm text-gray-600">
            <input type="checkbox" checked={filters.deliveryOnly} onChange={(e) => setFilters({ ...filters, deliveryOnly: e.target.checked })} />
            Delivery only
          </label>
          <div className="flex gap-2">
            <Button type="submit" loading={loading} className="flex-1 justify-center">Apply</Button>
            {hasFilters && <Button type="button" variant="ghost" onClick={clearFilters}>Clear</Button>}
          </div>
        </form>
        <p className="mt-3 text-xs text-gray-400">
          Entering a quantity re-ranks suppliers by whether they can cover it and meet their MOQ.
        </p>
      </Card>

      {data.unavailable && hasFilters ? (
        <EmptyState
          title="No suppliers match these filters"
          message="Try widening the distance or price, or clear the filters."
          action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
        />
      ) : data.unavailable ? (
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
                      placeholder={`${filters.requestedQty || s.moq}`}
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
