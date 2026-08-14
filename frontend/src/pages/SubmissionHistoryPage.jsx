import { useEffect, useMemo, useState } from 'react';
import { listSubmissions } from '../api/submissions';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { formatCreatedAt } from '../utils/date';

const statusOptions = ['all', 'accepted', 'wrong_answer', 'runtime_error', 'compilation_error', 'time_limit_exceeded'];
const languageOptions = ['all', 'python', 'cpp'];

const formatStatus = (status) => {
  return String(status || 'unknown').replace(/_/g, ' ').toUpperCase();
};

const formatLanguage = (language) => {
  const labels = {
    cpp: 'C++',
    python: 'Python 3',
  };

  return labels[language] || language || 'Unknown';
};

const getStatusClass = (status) => {
  if (status === 'accepted') return 'accepted';
  if (status === 'time_limit_exceeded') return 'time-limit';
  if (['wrong_answer', 'runtime_error', 'compilation_error'].includes(status)) return 'error';

  return 'neutral';
};

const formatRuntime = (submission) => {
  if (!submission.execution_time) return 'N/A';

  return `${submission.execution_time}s`;
};

const formatMemory = (submission) => {
  if (!submission.memory_kb) return 'N/A';

  return `${Math.round(Number(submission.memory_kb) / 102.4) / 10} MB`;
};

export function SubmissionHistoryPage({ onBackToDashboard, onOpenProblems, onOpenSubmissionDetail, onOpenUsers }) {
  const { signOut, token, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [dateFilter, setDateFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle');
  const [statusFilter, setStatusFilter] = useState('all');
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    refreshSubmissions().catch(() => {});
  }, []);

  const filteredSubmissions = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();

    return submissions.filter((submission) => {
      const title = submission.question_title || `Question ${submission.question_id || 'practice'}`;
      const submittedBy = submission.submitted_by || `user_${submission.user_id}`;
      const submittedDate = submission.created_at ? new Date(submission.created_at).toISOString().slice(0, 10) : '';
      const matchesQuery = !loweredQuery ||
        title.toLowerCase().includes(loweredQuery) ||
        String(submission.id).includes(loweredQuery) ||
        String(submission.user_id).includes(loweredQuery) ||
        submittedBy.toLowerCase().includes(loweredQuery);
      const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
      const matchesLanguage = languageFilter === 'all' || submission.language === languageFilter;
      const matchesDate = !dateFilter || submittedDate === dateFilter;

      return matchesQuery && matchesStatus && matchesLanguage && matchesDate;
    });
  }, [dateFilter, languageFilter, query, statusFilter, submissions]);

  async function refreshSubmissions() {
    setStatus('loading');
    setMessage('');

    try {
      const data = await listSubmissions(token);
      setSubmissions(data.submissions || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setStatus('idle');
    }
  }

  function handleExportCsv() {
    const rows = [
      ['submission_id', 'user_id', 'username', 'problem', 'status', 'runtime', 'memory_kb', 'language', 'created_at'],
      ...filteredSubmissions.map((submission) => [
        submission.id,
        submission.user_id,
        submission.submitted_by || '',
        submission.question_title || '',
        submission.status || '',
        submission.execution_time || '',
        submission.memory_kb || '',
        submission.language || '',
        submission.created_at || '',
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'submission-log.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  if (isAdmin) {
    return (
      <main className="admin-console-shell">
        <aside className="admin-console-sidebar">
          <div>
            <section className="admin-identity-card">
              <span><Icon name="user" size={18} /></span>
              <div>
                <strong>Admin</strong>
                <em>{user?.username || 'User'}</em>
              </div>
            </section>

            <button className="admin-new-problem" type="button" onClick={onOpenProblems}>
              <Icon name="plus" size={16} /> New Problem
            </button>

            <nav className="admin-side-nav" aria-label="Admin navigation">
              <button type="button" onClick={onBackToDashboard}><Icon name="terminal" size={16} /> Overview</button>
              <button type="button" onClick={onOpenProblems}><Icon name="folder" size={16} /> Manage Problems</button>
              <button type="button" onClick={onOpenUsers}><Icon name="users" size={16} /> Users</button>
              <button className="active" type="button"><Icon name="clock" size={16} /> Submissions</button>
            </nav>
          </div>

          <div className="admin-side-footer">
            <button type="button"><Icon name="book" size={15} /> Documentation</button>
            <button type="button"><Icon name="shield" size={15} /> Support</button>
          </div>
        </aside>

        <section className="admin-console-area">
          <header className="admin-console-topbar">
            <strong>IDE ONLINE</strong>
            <nav>
              <button type="button" onClick={onBackToDashboard}>Dashboard</button>
            </nav>
            <div>
              <button type="button" title="Notifications"><Icon name="bell" size={17} /></button>
              <button type="button" title="Settings"><Icon name="settings" size={17} /></button>
              <button className="admin-avatar" type="button" onClick={signOut} title="Sign out">
                {user?.username?.slice(0, 1)?.toUpperCase() || 'A'}
              </button>
            </div>
          </header>

          <section className="admin-console-content admin-submission-content">
            <section className="admin-submission-heading">
              <div>
                <h1>Admin: Master Submission Log</h1>
              </div>
              <button type="button" onClick={handleExportCsv}><Icon name="upload" size={15} /> Download Export CSV</button>
            </section>

            <section className="admin-submission-filters">
              <label>
                <span>Search</span>
                <input
                  placeholder="User ID, username, submission..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <label>
                <span>Status Filter</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>{formatStatus(option)}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Language</span>
                <select value={languageFilter} onChange={(event) => setLanguageFilter(event.target.value)}>
                  {languageOptions.map((option) => (
                    <option key={option} value={option}>{option === 'all' ? 'ALL LANGUAGES' : formatLanguage(option)}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Date Range</span>
                <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
              </label>
              <button type="button" onClick={refreshSubmissions} disabled={status === 'loading'}>
                <Icon name="search" size={14} /> Apply
              </button>
            </section>

            {message && <p className="workspace-message">{message}</p>}

            <section className="admin-submission-table" aria-label="All submissions">
              <div className="admin-submission-table-header">
                <span>Submission ID</span>
                <span>User</span>
                <span>Problem</span>
                <span>Status</span>
                <span>Runtime</span>
                <span>Memory</span>
                <span>Lang</span>
              </div>
              <div>
                {filteredSubmissions.map((submission) => {
                  const title = submission.question_title || `Question ${submission.question_id || 'Practice'}`;
                  const submittedBy = submission.submitted_by || `user_${submission.user_id}`;

                  return (
                    <article className="admin-submission-table-row" key={submission.id} onClick={() => onOpenSubmissionDetail?.(submission.id)}>
                      <span>#SUB-{submission.id}</span>
                      <span className="admin-submission-user"><i>{submittedBy.slice(0, 1).toUpperCase()}</i>{submittedBy}</span>
                      <strong title={title}>{title}</strong>
                      <span className={`submission-status-badge ${getStatusClass(submission.status)}`}><i /> {formatStatus(submission.status)}</span>
                      <span className={submission.status === 'time_limit_exceeded' ? 'runtime-warning' : ''}>{formatRuntime(submission)}</span>
                      <span>{formatMemory(submission)}</span>
                      <span>{formatLanguage(submission.language)}</span>
                    </article>
                  );
                })}
                {filteredSubmissions.length === 0 && (
                  <p className="dashboard-empty">{status === 'loading' ? 'Loading submissions...' : 'No submissions match the current filters.'}</p>
                )}
              </div>
              <footer>
                <span>Showing {filteredSubmissions.length ? '1' : '0'}-{filteredSubmissions.length} of {submissions.length}</span>
                <div><button type="button">&lt;</button><button className="active" type="button">1</button><button type="button">&gt;</button></div>
              </footer>
            </section>

          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="submission-shell">
      <header className="submission-navbar">
        <div className="dashboard-brand">
          <span>I</span>
          <strong>IDE ONLINE</strong>
        </div>

        <nav className="dashboard-nav">
          <button type="button" onClick={onBackToDashboard}>Dashboard</button>
          <button className="active" type="button">Submissions</button>
        </nav>

        <div className="dashboard-session">
          <button type="button" title="Settings"><Icon name="settings" size={17} /></button>
          <button className="dashboard-avatar" type="button" onClick={signOut} title="Sign out">
            {user?.username?.slice(0, 1)?.toUpperCase() || 'U'}
          </button>
        </div>
      </header>

      <section className="submission-main">
        <section className="submission-headline">
          <h1>Submission History</h1>
        </section>

        <section className="submission-filters" aria-label="Submission filters">
          <label className="submission-search">
            <Icon name="search" size={15} />
            <input
              placeholder="Filter by Problem Name..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <label className="submission-select">
            <span>Status:</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((option) => (
                <option key={option} value={option}>{formatStatus(option)}</option>
              ))}
            </select>
          </label>

          <label className="submission-select">
            <span>Language:</span>
            <select value={languageFilter} onChange={(event) => setLanguageFilter(event.target.value)}>
              {languageOptions.map((option) => (
                <option key={option} value={option}>{option === 'all' ? 'ALL' : formatLanguage(option)}</option>
              ))}
            </select>
          </label>

          <button className="submission-refresh" type="button" onClick={refreshSubmissions} disabled={status === 'loading'}>
            <Icon name="clock" size={15} /> {status === 'loading' ? 'Syncing' : 'Refresh'}
          </button>
        </section>

        {message && <p className="workspace-message">{message}</p>}

        <section className="submission-table" aria-label="Submission history table">
          <div className="submission-table-header">
            <span>Time Submitted</span>
            <span>Problem</span>
            <span>Status</span>
            <span>Runtime</span>
            <span>Memory</span>
            <span>Lang</span>
            <span>Action</span>
          </div>

          <div className="submission-table-body">
            {filteredSubmissions.map((submission) => {
              const title = submission.question_title || `Question ${submission.question_id || 'Practice'}`;
              const statusClass = getStatusClass(submission.status);

              return (
                <article className="submission-table-row" key={submission.id}>
                  <span>{formatCreatedAt(submission.created_at)}</span>
                  <strong title={title}>{title}</strong>
                  <span className={`submission-status-badge ${statusClass}`}>
                    <i /> {formatStatus(submission.status)}
                  </span>
                  <span className={submission.status === 'time_limit_exceeded' ? 'runtime-warning' : ''}>
                    {formatRuntime(submission)}
                  </span>
                  <span>{formatMemory(submission)}</span>
                  <span>{formatLanguage(submission.language)}</span>
                  <button type="button" onClick={() => onOpenSubmissionDetail?.(submission.id)}>
                    <Icon name="terminal" size={13} /> View Code
                  </button>
                </article>
              );
            })}

            {filteredSubmissions.length === 0 && (
              <p className="dashboard-empty">
                {status === 'loading' ? 'Loading submissions...' : 'No submissions match the current filters.'}
              </p>
            )}
          </div>

          <footer className="submission-table-footer">
            <span>{filteredSubmissions.length} of {submissions.length} submissions</span>
            <div>
              <button type="button" disabled>&lt;</button>
              <button type="button" disabled>&gt;</button>
            </div>
          </footer>
        </section>

      </section>

    </main>
  );
}
