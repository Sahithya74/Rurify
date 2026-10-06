import { useEffect, useState } from 'react';
import * as adminService from '../../services/admin';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { Select } from '../../components/ui/Field';

export default function UserManagement() {
  const toast = useToast();
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');

  const load = () => adminService.listUsers(roleFilter ? { role: roleFilter } : {}).then(setUsers).finally(() => setLoading(false));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const toggleActive = async (user) => {
    await adminService.setUserActive(user.id, !user.isActive);
    toast.success(`${user.name} is now ${!user.isActive ? 'active' : 'inactive'}`);
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">Users</h1>
        <Select className="w-44" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="retailer">Retailers</option>
          <option value="vendor">Vendors</option>
          <option value="admin">Admins</option>
        </Select>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-semibold text-[var(--color-dark)]">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3">
                  <Badge color={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="font-semibold text-[var(--color-accent)]" onClick={() => toggleActive(u)}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
