import { useEffect, useState } from 'react';
import * as adminService from '../../services/admin';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { Input } from '../../components/ui/Field';

export default function ProductManagement() {
  const toast = useToast();
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([adminService.listAdminProducts(), adminService.listAdminCategories()]).then(([p, c]) => {
      setProducts(p);
      setCategories(c);
    }).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      await adminService.createCategory(newCategory.trim());
      toast.success('Category added');
      setNewCategory('');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not add category'));
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">Products &amp; categories</h1>
        <p className="mt-1 text-sm text-gray-500">The full product catalog across every vendor.</p>
      </div>

      <Card>
        <h2 className="font-bold text-[var(--color-dark)]">Categories</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.id} className="rounded-full bg-[var(--color-sand)] px-3 py-1.5 text-xs font-semibold text-[var(--color-dark)]">
              {c.name}
            </span>
          ))}
        </div>
        <form onSubmit={addCategory} className="mt-4 flex gap-3">
          <Input placeholder="New category name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
          <Button type="submit">Add</Button>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Unit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-semibold text-[var(--color-dark)]">
                  {p.name}{p.variety ? ` — ${p.variety}` : ''}
                </td>
                <td className="px-4 py-3 text-gray-500">{p.Category?.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
