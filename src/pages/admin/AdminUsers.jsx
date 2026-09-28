import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Avatar from '../../components/Avatar.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Icon from '../../components/Icons.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Select from '../../components/Select.jsx';
import { usersAPI } from '../../services/api.js';
import { formatDate, timeAgo } from '../../utils/helpers.js';
import { useToast } from '../../hooks/useToast.jsx';

/** Admin Users — now backed by MySQL */
export default function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [suspended, setSuspended] = useState({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.list({ search: query, role, limit: 100 });
      if (res.success) setUsers(res.data);
    } catch (err) {
      toast.show({ kind: 'error', title: 'Failed', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchUsers(), 400);
    return () => clearTimeout(t);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => `${u.name} ${u.email} ${u.phone} ${u.id}`.toLowerCase().includes(q));
  }, [users, query]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Admin Panel"
        title="Users"
        subtitle={`${users.length} accounts on FindIt — live from MySQL.`}
      />

      <div className="search-toolbar">
        <div className="table-search">
          <Icon name="search" size={16} />
          <input
            placeholder="Search by name, email or phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="search-toolbar__right">
          <Select
            wrapperClassName="mb-0 width-200"
            options={[
              { value: 'all', label: 'All roles' },
              { value: 'student', label: 'Students' },
              { value: 'admin', label: 'Admins' }
            ]}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <span className="results-count"><strong>{filtered.length}</strong> shown</span>
        </div>
      </div>

      <Card>
        <div className="card__body" style={{ padding: 0 }}>
          {loading ? (
            <div className="pad-lg"><LoadingSpinner label="Loading users…" /></div>
          ) : filtered.length === 0 ? (
            <div className="pad-lg">
              <EmptyState icon="users" title="No users found" message="Try a different search." />
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th className="ta-r">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <span className="user-cell">
                          <Avatar name={u.name} size={38} />
                          <span>
                            <strong>{u.name}{u.role === 'admin' && <em className="tag-admin">Admin</em>}</strong>
                            <em>{u.email} · {u.phone}</em>
                          </span>
                        </span>
                      </td>
                      <td><StatusBadge status={u.role === 'admin' ? 'Admin' : 'Student'} /></td>
                      <td>{formatDate(u.created_at?.slice(0,10) || u.createdAt?.slice(0,10))}<em className="block-muted">{timeAgo(u.created_at || u.createdAt)}</em></td>
                      <td>
                        <span className={`status-dot ${suspended[u.id] ? 'status-dot--off' : 'status-dot--on'}`}>
                          {suspended[u.id] ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="ta-r">
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn--outline btn--sm"
                            onClick={() => toast.show({ kind: 'info', title: 'User details', message: `${u.name} · joined ${formatDate(u.created_at?.slice(0,10))}` })}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className={`btn btn--sm ${suspended[u.id] ? 'btn--primary' : 'btn--ghost btn--danger-text'}`}
                            onClick={() => {
                              setSuspended((s) => ({ ...s, [u.id]: !s[u.id] }));
                              toast.show({
                                kind: suspended[u.id] ? 'success' : 'error',
                                title: suspended[u.id] ? 'Account reactivated' : 'Account suspended',
                                message: `${u.name}'s account was ${suspended[u.id] ? 'reactivated' : 'suspended'} (demo).`
                              });
                            }}
                          >
                            {suspended[u.id] ? 'Reactivate' : 'Suspend'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
