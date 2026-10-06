import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as catalogService from '../../services/catalog';
import * as requirementService from '../../services/requirements';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { Field, Input, Textarea } from '../../components/ui/Field';

export default function RequirementCreate() {
  const [params] = useSearchParams();
  const productId = params.get('productId');
  const navigate = useNavigate();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ requiredQty: '', requiredDate: '', preferredPrice: '', notes: '' });

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }
    catalogService
      .getProduct(productId)
      .then(setProduct)
      .finally(() => setLoading(false));
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await requirementService.createRequirement({
        productId: Number(productId),
        requiredQty: Number(form.requiredQty),
        requiredDate: form.requiredDate || null,
        preferredPrice: form.preferredPrice ? Number(form.preferredPrice) : null,
        notes: form.notes || null,
      });
      toast.success('Requirement submitted. We will notify you when a vendor responds.');
      navigate('/retailer/requirements');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not submit requirement'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (!productId || !product) {
    return (
      <Card>
        <p className="text-sm text-gray-500">Search for a product first, then raise a requirement from its page.</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">Raise a requirement</h1>
        <p className="mt-1 text-sm text-gray-500">
          For <span className="font-semibold text-[var(--color-dark)]">{product.name}</span> &mdash; we&rsquo;ll track
          this as regional demand and notify vendors who can fulfill it.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={`Required quantity (${product.unit})`}>
            <Input
              type="number"
              min="0.1"
              step="any"
              required
              value={form.requiredQty}
              onChange={(e) => setForm({ ...form, requiredQty: e.target.value })}
            />
          </Field>
          <Field label="Required by date">
            <Input
              type="date"
              value={form.requiredDate}
              onChange={(e) => setForm({ ...form, requiredDate: e.target.value })}
            />
          </Field>
          <Field label="Preferred price (optional)">
            <Input
              type="number"
              step="any"
              value={form.preferredPrice}
              onChange={(e) => setForm({ ...form, preferredPrice: e.target.value })}
            />
          </Field>
          <Field label="Notes (optional)">
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>

          <Button type="submit" className="w-full justify-center" loading={submitting}>
            Submit requirement
          </Button>
        </form>
      </Card>
    </div>
  );
}
