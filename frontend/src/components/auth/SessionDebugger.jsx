import { formatCreatedAt } from '../../utils/date';
import { Icon } from '../ui/Icon';

// Widget debug cố định, phản ánh profile session hiện tại từ backend.
export function SessionDebugger({ user }) {
  return (
    <aside className="session-debugger" aria-label="Session debugger">
      <div className="debugger-topline">
        <span>&gt;_ SESSION DEBUGGER</span>
        <span className="status-dot" />
      </div>

      {/* Ưu tiên full name trong DB, nếu record cũ chưa có thì dùng username. */}
      <div className="debugger-section">
        <div className="debugger-label">
          <Icon name="user" size={14} />
          <span>User Identity</span>
        </div>
        <div className="readonly-box">{user ? user.full_name || user.username || 'active' : 'null'}</div>
      </div>

      <div className="debugger-grid">
        <div>
          <div className="debugger-label">
            <Icon name="shield" size={14} />
            <span>Status</span>
          </div>
          <strong>{user ? 'AUTHENTICATED' : 'UNAUTHENTICATED'}</strong>
        </div>
        <div>
          <div className="debugger-label">
            <Icon name="clock" size={14} />
            <span>Last Sync</span>
          </div>
          <strong>{user ? 'LIVE' : 'N/A'}</strong>
        </div>
        <div>
          <div className="debugger-label">
            <Icon name="clock" size={14} />
            <span>Created At</span>
          </div>
          <strong>{formatCreatedAt(user?.created_at)}</strong>
        </div>
      </div>

      <div className="debugger-footer">
        <em>Ready</em>
        <span>v1.0.0</span>
      </div>
    </aside>
  );
}
