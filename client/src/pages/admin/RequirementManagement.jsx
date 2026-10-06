import { useEffect, useState } from 'react';
import * as adminService from '../../services/admin';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { Select } from '../../components/ui/Field';

export default function RequirementManagement() {
  const [requirements, setRequirements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setLoading(true);
    adminService.listAdminRequirements(status ? { status } : {}).then(setRequirements).finally(() => setLoading(false));
  }, [status]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">Requirements</h1>
        <Select className="w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="FULFILLED">Fulfilled</option>
          <option value="CLOSED">Closed</option>
        </Select>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="space-y-3">
          {requirements.map((r) => (
            <Card key={r.id} className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[var(--color-dark)]">
                  {r.Product?.name}{r.Product?.variety ? ` — ${r.Product.variety}` : ''}
                </h3>
                <p className="text-sm text-gray-500">
                  {r.Retailer?.shopName} needs {r.requiredQty} {r.Product?.unit}
                </p>
              </div>
              <Badge color={r.status === 'PENDING' ? 'orange' : 'green'}>{r.status}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
