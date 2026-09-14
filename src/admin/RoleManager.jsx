import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUserProfile, deleteUserProfile, ROLES, ALL_PERMISSIONS } from '../utils/roleHelper';

export default function AdminRoleManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    async function load() {
      setUsers(await getAllUsers());
      setLoading(false);
    }
    load();
  }, []);

  const handleRoleChange = async (uid, newRole) => {
    const roleInfo = ROLES[newRole];
    const permissions = roleInfo?.permissions || [];
    await updateUserProfile(uid, { role: newRole, permissions });
    setUsers(users.map(u => u.id === uid ? { ...u, role: newRole, permissions } : u));
  };

  const handlePermissionToggle = async (uid, perm) => {
    const user = users.find(u => u.id === uid);
    const current = user?.permissions || [];
    const updated = current.includes(perm) ? current.filter(p => p !== perm) : [...current, perm];
    await updateUserProfile(uid, { permissions: updated });
    setUsers(users.map(u => u.id === uid ? { ...u, permissions: updated } : u));
  };

  const handleDelete = async (uid) => {
    if (!confirm('Hapus pengguna ini?')) return;
    await deleteUserProfile(uid);
    setUsers(users.filter(u => u.id !== uid));
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gold">Manajemen Role & Hak Akses</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs text-gray-400">
              <th className="p-2">Nama</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Status</th>
              <th className="p-2">Permissions</th>
              <th className="p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const roleInfo = ROLES[u.role] || { label: u.role, color: '#6b7280' };
              return (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-2">{u.name || '-'}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">
                    <select value={u.role || 'member'} onChange={e => handleRoleChange(u.id, e.target.value)} className="px-2 py-1 bg-black/30 border border-white/10 rounded text-sm">
                      {Object.keys(ROLES).map(r => <option key={r} value={r}>{ROLES[r].label}</option>)}
                    </select>
                  </td>
                  <td className="p-2">
                    <span className={`text-xs border px-2 py-1 rounded ${u.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'}`}>
                      {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      {ALL_PERMISSIONS.map(p => (
                        <label key={p.id} className="text-xs flex items-center gap-1 bg-black/30 border border-white/10 rounded px-2 py-1 cursor-pointer">
                          <input type="checkbox" checked={u.permissions?.includes(p.id)} onChange={() => handlePermissionToggle(u.id, p.id)} />
                          <span className="truncate max-w-[120px]">{p.label}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                  <td className="p-2">
                    <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-300 text-xs">Hapus</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}