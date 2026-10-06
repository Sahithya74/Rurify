import { useEffect, useRef, useState } from 'react';
import * as inventoryService from '../../services/inventory';
import * as catalogService from '../../services/catalog';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Field, Input, Select } from '../../components/ui/Field';

const EMPTY_FORM = {
  productName: '',
  categoryId: '',
  variety: '',
  description: '',
  imageUrl: '',
  unit: 'kg',
  quantity: '',
  price: '',
  moq: '1',
  freshness: 'FRESH',
  expiryDate: '',
  deliveryAvailable: true,
};

function AddProductModal({ categories, onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await inventoryService.createInventory({
        ...form,
        categoryId: Number(form.categoryId),
        quantity: Number(form.quantity),
        price: Number(form.price),
        moq: Number(form.moq),
        imageUrl: form.imageUrl || `https://placehold.co/600x400/png?text=${encodeURIComponent(form.productName)}`,
      });
      toast.success(`${form.productName} added to your catalog.`);
      onCreated();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not add product'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto">
      <div className="reveal-scale is-visible w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-[var(--color-dark)]">Add product</h3>
        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Product name">
            <Input required value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
          </Field>
          <Field label="Variety (optional)">
            <Input value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} />
          </Field>
          <Field label="Category">
            <Select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Select...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Unit">
            <Input required value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </Field>
          <Field label="Quantity">
            <Input type="number" min="0" step="any" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </Field>
          <Field label="Price (per unit)">
            <Input type="number" min="0.01" step="any" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </Field>
          <Field label="MOQ">
            <Input type="number" min="0.1" step="any" required value={form.moq} onChange={(e) => setForm({ ...form, moq: e.target.value })} />
          </Field>
          <Field label="Freshness">
            <Select value={form.freshness} onChange={(e) => setForm({ ...form, freshness: e.target.value })}>
              <option value="FRESH">Fresh</option>
              <option value="GOOD">Good</option>
              <option value="AVERAGE">Average</option>
            </Select>
          </Field>
          <Field label="Expiry date (optional)">
            <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
          </Field>
          <Field label="Image URL (optional)">
            <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
          </Field>
          <label className="col-span-2 flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={form.deliveryAvailable}
              onChange={(e) => setForm({ ...form, deliveryAvailable: e.target.checked })}
            />
            Delivery available
          </label>

          <div className="col-span-2 mt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={submitting}>Add product</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditInventoryModal({ item, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    quantity: item.quantity,
    price: item.price,
    moq: item.moq,
    freshness: item.freshness,
    expiryDate: item.expiryDate || '',
    deliveryAvailable: item.deliveryAvailable,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await inventoryService.updateInventory(item.id, {
        ...form,
        quantity: Number(form.quantity),
        price: Number(form.price),
        moq: Number(form.moq),
        expiryDate: form.expiryDate || null,
      });
      toast.success('Inventory updated — connected retailers will see it automatically.');
      onSaved();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not update inventory'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="reveal-scale is-visible w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-[var(--color-dark)]">
          Edit {item.Product?.name}
          {item.Product?.variety ? ` — ${item.Product.variety}` : ''}
        </h3>
        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Quantity"><Input type="number" min="0" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field>
          <Field label="Price"><Input type="number" min="0.01" step="any" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
          <Field label="MOQ"><Input type="number" min="0.1" step="any" value={form.moq} onChange={(e) => setForm({ ...form, moq: e.target.value })} /></Field>
          <Field label="Freshness">
            <Select value={form.freshness} onChange={(e) => setForm({ ...form, freshness: e.target.value })}>
              <option value="FRESH">Fresh</option>
              <option value="GOOD">Good</option>
              <option value="AVERAGE">Average</option>
            </Select>
          </Field>
          <Field label="Expiry date"><Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></Field>
          <label className="col-span-2 flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.deliveryAvailable} onChange={(e) => setForm({ ...form, deliveryAvailable: e.target.checked })} />
            Delivery available
          </label>
          <div className="col-span-2 mt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={submitting}>Save changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VendorInventory() {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [items, setItems] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [importSummary, setImportSummary] = useState(null);
  const [importing, setImporting] = useState(false);

  const load = () => inventoryService.listMyInventory().then(setItems).finally(() => setLoading(false));

  useEffect(() => {
    load();
    catalogService.listCategories().then(setCategories).catch(() => {});
  }, []);

  const handleDeactivate = async () => {
    try {
      await inventoryService.deactivateInventory(deactivateTarget.id);
      toast.success('Product deactivated');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not deactivate product'));
    } finally {
      setDeactivateTarget(null);
    }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportSummary(null);
    try {
      const result = await inventoryService.importInventoryCsv(file);
      setImportSummary(result);
      toast.success(`Imported ${result.summary.success} of ${result.summary.totalRows} rows.`);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'CSV import failed'));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) return <Spinner label="Loading your inventory..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-dark)]">Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">Changes sync to connected retailers automatically.</p>
        </div>
        <div className="flex gap-3">
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
          <Button variant="outline" loading={importing} onClick={() => fileInputRef.current?.click()}>
            Import CSV
          </Button>
          <Button onClick={() => setShowAdd(true)}>Add product</Button>
        </div>
      </div>

      {importSummary && (
        <Card className="bg-[var(--color-sand)]">
          <p className="font-semibold text-[var(--color-dark)]">
            Import summary: {importSummary.summary.success} succeeded, {importSummary.summary.failed} failed out of{' '}
            {importSummary.summary.totalRows} rows.
          </p>
          {importSummary.errors.length > 0 && (
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-red-600">
              {importSummary.errors.map((e, i) => (
                <li key={i}>Row {e.row}: {e.message}</li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {items.length === 0 ? (
        <EmptyState title="No products yet" message="Add your first product or import a CSV to get started." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">MOQ</th>
                <th className="px-4 py-3">Freshness</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className={item.isActive ? '' : 'opacity-50'}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[var(--color-dark)]">
                      {item.Product?.name}
                      {item.Product?.variety ? ` — ${item.Product.variety}` : ''}
                    </p>
                    <p className="text-xs text-gray-400">{item.Product?.Category?.name}</p>
                  </td>
                  <td className="px-4 py-3">{item.quantity} {item.Product?.unit}</td>
                  <td className="px-4 py-3">&#8377;{item.price}</td>
                  <td className="px-4 py-3">{item.moq}</td>
                  <td className="px-4 py-3">{item.freshness}</td>
                  <td className="px-4 py-3">
                    <Badge color={item.isActive ? 'green' : 'gray'}>{item.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="font-semibold text-[var(--color-accent)]" onClick={() => setEditItem(item)}>Edit</button>
                    {item.isActive && (
                      <button className="ml-3 font-semibold text-red-500" onClick={() => setDeactivateTarget(item)}>
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {showAdd && (
        <AddProductModal
          categories={categories}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}
      {editItem && (
        <EditInventoryModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSaved={() => {
            setEditItem(null);
            load();
          }}
        />
      )}
      <ConfirmDialog
        open={!!deactivateTarget}
        title="Deactivate this product?"
        message="It will no longer appear to retailers until reactivated."
        confirmLabel="Deactivate"
        danger
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}
