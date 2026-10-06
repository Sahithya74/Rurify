import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as catalogService from '../../services/catalog';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Field';

export default function ProductSearch() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    catalogService.listCategories().then(setCategories).catch(() => {});
  }, []);

  const runSearch = (q) => {
    setLoading(true);
    catalogService
      .searchProducts({ q })
      .then(setResults)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    runSearch(params.get('q') || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setParams(query ? { q: query } : {});
    runSearch(query);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">Find a product</h1>
        <p className="mt-1 text-sm text-gray-500">Search by name, category, or variety.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          autoFocus
          placeholder="Try Avocado, Kiwi, Celery, Oregano..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">Search</Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setQuery('');
              setLoading(true);
              catalogService.searchProducts({ categoryId: c.id }).then(setResults).finally(() => setLoading(false));
            }}
            className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-[var(--color-accent)] hover:text-[var(--color-dark)]"
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading && <Spinner label="Searching suppliers near you..." />}

      {!loading && results && results.length === 0 && (
        <EmptyState title="No matching products" message="Try a different search term or browse by category." />
      )}

      {!loading && results && results.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r) => (
            <Card key={r.product.id} className="flex flex-col">
              <img
                src={r.product.imageUrl}
                alt={r.product.name}
                className="mb-3 h-32 w-full rounded-xl object-cover"
              />
              <h3 className="font-bold text-[var(--color-dark)]">
                {r.product.name}
                {r.product.variety ? ` — ${r.product.variety}` : ''}
              </h3>
              <p className="text-xs text-gray-400">{r.product.Category?.name}</p>

              {r.available ? (
                <div className="mt-3 space-y-1 text-sm">
                  <p className="text-gray-600">
                    {r.supplierCount} supplier{r.supplierCount !== 1 ? 's' : ''} nearby
                  </p>
                  <p className="text-gray-600">From &#8377;{r.minPrice}/{r.product.unit}</p>
                  {r.bestMatchScore != null && (
                    <p className="font-semibold text-[var(--color-accent)]">Best match: {r.bestMatchScore}/100</p>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm font-semibold text-red-500">Unavailable nearby</p>
              )}

              <div className="mt-4">
                {r.available ? (
                  <Button className="w-full justify-center" onClick={() => navigate(`/retailer/products/${r.product.id}`)}>
                    View suppliers
                  </Button>
                ) : (
                  <Link to={`/retailer/requirements/new?productId=${r.product.id}`} className="block">
                    <Button variant="outline" className="w-full justify-center">
                      Raise requirement
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
