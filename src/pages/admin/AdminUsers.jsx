import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Avatar from '../../components/Avatar.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Icon from '../../components/Icons.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { usersAPI } from '../../services/api.js';
import Select from '../../components/Select.jsx';
import { formatDate, timeAgo } from '../../utils/helpers.js';
import { useToast } from '../../hooks/useToast.jsx';

/** Admin Users */
export default function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [suspended, setSuspended] = useState({});

  useEffect(() => {
    let alive = true;
    setLoading(true);
    usersAPI.list()
      .then((res) => { if (alive && res.success) setUsers(res.data || []); })
      .catch((err) => toast.show({ kind: 'error', title: 'Unable to load users', message: err.message }))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(u => {
      const roleOk = role === 'all' || u.role === role;
      const text = `${u.name} ${u.email} ${u.phone} ${u.id}`.toLowerCase();
      return roleOk && (!q || text.includes(q));
    });
  }, [users, query, role]);

  const toggleRole = (id, nextRole) => {
    const current = users.find(u => u.id === id);
    if (!current) return;
    if (current.role === 'admin' && nextRole !== 'admin') {
      toast.show({ kind: 'error', title: 'Admin protected', message: 'The system keeps exactly one administrator.' });
      return;
    }
    usersAPI.updateRole(id, nextRole)
      .then((res) => {
        if (!res.success) throw new Error(res.message || 'Role update failed.');
        setUsers(prev => prev.map(u => u.id === id ? res.data : u));
        toast.show({ kind: 'success', title: 'Role updated', message: `${current.name} is now a ${nextRole}.` });
      })
      .catch((err) => toast.show({ kind: 'error', title: 'Role update failed', message: err.message }));
  };

  return (
    <div className="page">
      <PageHeader eyebrow="Admin Panel" title="Users" subtitle={`${users.length} registered accounts.`} />
      <div className="search-toolbar">
        <div className="table-search">
          <Icon name="search" size={16} />
          <input placeholder="Search by name, email or phone…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="search-toolbar__right">
          <Select
            wrapperClassName="mb-0 width-200"
            options={[{ value: 'all', label: 'All roles' }, { value: 'student', label: 'Students' }, { value: 'teacher', label: 'Teachers' }, { value: 'admin', label: 'Admins' }]}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <span className="results-count"><strong>{filtered.length}</strong> shown</span>
        </div>
      </div>
      <Card>
        <div className="card__body" style={{ padding: 0 }}>
          {loading ? <div className="pad-lg"><LoadingSpinner label="Loading users…" /></div> : filtered.length === 0 ? <div className="pad-lg"><EmptyState icon="users" title="No users found" message="Try a different search." /></div> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>User</th><th>Role</th><th>Joined</th><th>Status</th><th className="ta-r">Action</th></tr></thead>
                <tbody>{filtered.map(u => (
                  <tr key={u.id}>
                    <td><span className="user-cell"><Avatar name={u.name} size={38} /><span><strong>{u.name}{u.role === 'admin' && <em className="tag-admin">Admin</em>}</strong><em>{u.email} · {u.phone}</em></span></span></td>
                    <td><StatusBadge status={u.role === 'admin' ? 'Admin' : u.role === 'teacher' ? 'Teacher' : 'Student'} /></td>
                    <td>{formatDate(u.createdAt?.slice(0,10))}<em className="block-muted">{timeAgo(u.createdAt)}</em></td>
                    <td><span className={`status-dot ${suspended[u.id] ? 'status-dot--off' : 'status-dot--on'}`}>{suspended[u.id] ? 'Suspended' : 'Active'}</span></td>
                    <td className="ta-r"><div className="row-actions">
                      <button type="button" className="btn btn--outline btn--sm" onClick={() => toast.show({ kind:'info', title:'User details', message:`${u.name} · ${u.email} · ${u.department || 'General'}` })}>View</button>
                      {u.role !== 'admin' && <button type="button" className="btn btn--outline btn--sm" onClick={() => toggleRole(u.id, u.role === 'teacher' ? 'student' : 'teacher')}>{u.role === 'teacher' ? 'Make Student' : 'Make Teacher'}</button>}
                      <button type="button" className={`btn btn--sm ${suspended[u.id] ? 'btn--primary' : 'btn--ghost btn--danger-text'}`} onClick={() => setSuspended(s => ({ ...s, [u.id]: !s[u.id] }))}>{suspended[u.id] ? 'Reactivate' : 'Suspend'}</button>
                    </div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
