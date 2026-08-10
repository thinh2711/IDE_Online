// frontend/src/pages/UserManagementPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { changeUserRole, listUsers } from '../api/users';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';

const roleStatus = {
  admin: {
    className: 'active',
    label: 'Privileged',
  },
  coder: {
    className: 'inactive',
    label: 'Coding',
  },
  viewer: {
    className: 'viewer',
    label: 'Review',
  },
};

function formatCreatedAt(value) {
  if (!value) return 'N/A';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';

  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function getInitials(user) {
  const source = user.full_name || user.username || 'User';
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
}

function escapeCsvValue(value) {
  const text = String(value ?? '');
  if (!/[",\n]/.test(text)) return text;

  return `"${text.replaceAll('"', '""')}"`;
}

function AdminSidebar({ onBackToDashboard, onManageProblems, onOpenSubmissionHistory }) {
  return (
    <aside className="admin-console-sidebar user-management-sidebar">
      <div>
        <section className="admin-identity-card">
          <span><Icon name="user" size={18} /></span>
          <div>
            <strong>ADMIN CONSOLE</strong>
            <em>SYSTEM ARCHITECT</em>
          </div>
        </section>

        <button className="admin-new-problem" type="button" onClick={onManageProblems}>
          <Icon name="plus" size={16} /> New Problem
        </button>

        <nav className="admin-side-nav" aria-label="Admin navigation">
          <button type="button" onClick={onBackToDashboard}>
            <Icon name="terminal" size={16} /> Overview
          </button>
          <button type="button" onClick={onManageProblems}>
            <Icon name="folder" size={16} /> Manage Problems
          </button>
          <button className="active" type="button">
            <Icon name="users" size={16} /> Users
          </button>
          <button type="button" onClick={onOpenSubmissionHistory}>
            <Icon name="clock" size={16} /> Submissions
          </button>
        </nav>
      </div>

      <div className="admin-side-footer">
        <button type="button"><Icon name="book" size={15} /> Documentation</button>
        <button type="button"><Icon name="shield" size={15} /> Support</button>
      </div>
    </aside>
  );
}

function Topbar({ onSignOut, user }) {
  return (
    <header className="user-management-topbar">
      <label className="user-management-global-search">
        <Icon name="search" size={15} />
        <input placeholder="Search..." />
      </label>

      <div className="user-management-topbar-actions">
        <button type="button" title="Notifications"><Icon name="bell" size={18} /></button>
        <button type="button" title="Settings"><Icon name="settings" size={18} /></button>
        <button type="button" title="Help"><Icon name="helpCircle" size={18} /></button>
        <button className="user-management-avatar" type="button" onClick={onSignOut} title="Sign out">
          {user?.username?.slice(0, 1)?.toUpperCase() || 'A'}
        </button>
      </div>
    </header>
  );
}

function MetricCard({ metric }) {
  return (
    <article className="user-management-metric-card">
      <span>{metric.label}</span>
      <div>
        <strong>{metric.value}</strong>
        {metric.note && <em>{metric.note}</em>}
      </div>
    </article>
  );
}

function UserRow({ currentUserId, onRoleChange, status, user }) {
  const access = roleStatus[user.role] || roleStatus.coder;
  const isCurrentUser = Number(currentUserId) === Number(user.id);

  return (
    <article className="user-management-table-row">
      <div className="user-management-user-cell">
        <span>{getInitials(user)}</span>
        <div>
          <strong>{user.full_name || user.username}</strong>
          <em>@{user.username}</em>
        </div>
      </div>
      <div>
        <label className="user-management-role-select">
          <select
            aria-label={`Change role for ${user.full_name || user.username}`}
            disabled={isCurrentUser || status === 'saving'}
            value={user.role}
            onChange={(event) => onRoleChange(user.id, event.target.value)}
          >
            <option value="admin">Admin</option>
            <option value="coder">Coder</option>
            <option value="viewer">Viewer</option>
          </select>
          <Icon name="chevronDown" size={14} />
        </label>
      </div>
      <div>
        <span className={`user-management-status-badge ${access.className}`}>
          <i /> {access.label}
        </span>
      </div>
      <time>{formatCreatedAt(user.created_at)}</time>
      <div className="user-management-actions-cell">
        <button type="button" title={`Manage ${user.full_name || user.username}`}>
          <Icon name="moreHorizontal" size={17} />
        </button>
      </div>
    </article>
  );
}

export function UserManagementPage({
  onBackToDashboard,
  onManageProblems,
  onOpenSubmissionHistory,
}) {
  const { signOut, token, user } = useAuth();
  const [roleFilter, setRoleFilter] = useState('all-roles');
  const [status, setStatus] = useState('idle');
  const [systemUsers, setSystemUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    refreshUsers().catch(() => {});
  }, []);

  async function refreshUsers() {
    setStatus('loading');
    setMessage('');

    try {
      const data = await listUsers(token);
      setSystemUsers(data.users || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setStatus('idle');
    }
  }

  async function handleRoleChange(userId, role) {
    setStatus('saving');
    setMessage('');

    try {
      const data = await changeUserRole(token, userId, role);
      setSystemUsers((current) =>
        current.map((item) => (Number(item.id) === Number(userId) ? data.user : item))
      );
      setMessage(`Role updated for ${data.user.full_name || data.user.username}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setStatus('idle');
    }
  }

  function handleExportCsv() {
    const rows = [
      ['id', 'full_name', 'username', 'role', 'created_at'],
      ...filteredUsers.map((item) => [
        item.id,
        item.full_name || '',
        item.username || '',
        item.role || '',
        item.created_at || '',
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = 'users.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }


  const filteredUsers = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();

    return systemUsers.filter((item) => {
      const matchesQuery = !loweredQuery
        || String(item.full_name || '').toLowerCase().includes(loweredQuery)
        || String(item.username || '').toLowerCase().includes(loweredQuery)
        || String(item.role || '').toLowerCase().includes(loweredQuery);
      const matchesRole = roleFilter === 'all-roles' || item.role === roleFilter;

      return matchesQuery && matchesRole;
    });
  }, [query, roleFilter, systemUsers]);

  const metrics = useMemo(() => {
    const countByRole = systemUsers.reduce(
      (counts, item) => ({
        ...counts,
        [item.role]: (counts[item.role] || 0) + 1,
      }),
      {}
    );

    return [
      { label: 'TOTAL USERS', value: String(systemUsers.length), note: 'From database' },
      { label: 'ADMINS', value: String(countByRole.admin || 0), note: 'Can manage system' },
      { label: 'CODERS', value: String(countByRole.coder || 0), note: 'Can solve problems' },
      { label: 'VIEWERS', value: String(countByRole.viewer || 0), note: 'Can review sessions' },
    ];
  }, [systemUsers]);

  return (
    <main className="admin-console-shell user-management-shell">
      <AdminSidebar
        onBackToDashboard={onBackToDashboard}
        onManageProblems={onManageProblems}
        onOpenSubmissionHistory={onOpenSubmissionHistory}
      />

      <section className="user-management-area">
        <Topbar onSignOut={signOut} user={user} />

        <section className="user-management-main">
          <section className="user-management-page-header">
            <div>
              <h1>User Management</h1>
              <p>Manage system access, roles, and user profiles.</p>
            </div>
            <button type="button" onClick={refreshUsers} disabled={status === 'loading'}>
              <Icon name="refresh" size={16} /> Refresh Users
            </button>
          </section>

          {message && <p className="workspace-message">{message}</p>}

          <section className="user-management-metrics" aria-label="User metrics">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </section>

          <section className="user-management-table-panel">
            <div className="user-management-toolbar">
              <div>
                <label className="user-management-filter-search">
                  <Icon name="search" size={15} />
                  <input
                    placeholder="Search users by name or username..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
                <label className="user-management-select">
                  <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                    <option value="all-roles">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="coder">Coder</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <Icon name="chevronDown" size={15} />
                </label>
              </div>
              <button type="button" onClick={handleExportCsv} disabled={filteredUsers.length === 0}>
                <Icon name="download" size={16} /> Export CSV
              </button>
            </div>

            <div className="user-management-table-header">
              <span>USER</span>
              <span>ROLE</span>
              <span>ACCESS</span>
              <span>CREATED AT</span>
              <span>ACTIONS</span>
            </div>

            <div className="user-management-table-body">
              {filteredUsers.map((row) => (
                <UserRow
                  currentUserId={user?.id}
                  key={row.id}
                  status={status}
                  user={row}
                  onRoleChange={handleRoleChange}
                />
              ))}
              {status === 'loading' && <p className="user-management-empty-state">Loading users from database...</p>}
              {status !== 'loading' && filteredUsers.length === 0 && (
                <p className="user-management-empty-state">
                  {systemUsers.length === 0 ? 'No users found in database.' : 'No users match the current filters.'}
                </p>
              )}
            </div>

            <footer className="user-management-pagination">
              <span>
                Showing {filteredUsers.length ? 1 : 0} to {filteredUsers.length} of {systemUsers.length} users
              </span>
              <div>
                <button type="button"><Icon name="chevronLeft" size={15} /></button>
                <button className="active" type="button">1</button>
                <button type="button"><Icon name="chevronRight" size={15} /></button>
              </div>
            </footer>
          </section>
        </section>

        <footer className="user-management-footer">
          <span>(c) 2024 DevEngine Systems. All services operational.</span>
          <nav aria-label="System links">
            <a href="#build">Build 8821</a>
            <a href="#security">Security Policy</a>
            <a href="#uptime">Uptime Status</a>
          </nav>
        </footer>
      </section>
    </main>
  );
}
