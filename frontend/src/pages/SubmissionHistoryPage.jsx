import { useEffect, useMemo, useState } from 'react';
import { getSubmission, listSubmissions } from '../api/submissions';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { formatCreatedAt } from '../utils/date';

const statusOptions = ['all', 'accepted', 'wrong_answer', 'runtime_error', 'compilation_error', 'time_limit_exceeded'];
const languageOptions = ['all', 'python', 'javascript', 'cpp', 'java', 'c'];

const formatStatus = (status) => {
  return String(status || 'unknown').replace(/_/g, ' ').toUpperCase();
};

const formatLanguage = (language) => {
  const labels = {
    c: 'C',
    cpp: 'C++',
    java: 'Java',
    javascript: 'JavaScript',
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

export function SubmissionHistoryPage({ onBackToDashboard }) {
  const { signOut, token, user } = useAuth();
  const [languageFilter, setLanguageFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
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
      const matchesQuery = !loweredQuery || title.toLowerCase().includes(loweredQuery);
      const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
      const matchesLanguage = languageFilter === 'all' || submission.language === languageFilter;

      return matchesQuery && matchesStatus && matchesLanguage;
    });
  }, [languageFilter, query, statusFilter, submissions]);

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

  async function handleViewCode(id) {
    setMessage('');

    try {
      const data = await getSubmission(token, id);
      setSelectedSubmission(data.submission);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="submission-shell">
      <header className="submission-navbar">
        <div className="dashboard-brand">
          <span>I</span>
          <strong>IDE ONLINE</strong>
        </div>

        <nav className="dashboard-nav">
          <button type="button" onClick={onBackToDashboard}>DASHBOARD</button>
          <button className="active" type="button">SUBMISSIONS</button>
        </nav>

        <div className="dashboard-session">
          <button type="button" title="Console"><Icon name="terminal" size={17} /></button>
          <button type="button" title="Settings"><Icon name="settings" size={17} /></button>
          <button className="dashboard-avatar" type="button" onClick={signOut} title="Sign out">
            {user?.username?.slice(0, 1)?.toUpperCase() || 'U'}
          </button>
        </div>
      </header>

      <section className="submission-main">
        <section className="submission-headline">
          <p className="eyebrow"><Icon name="terminal" size={14} /> &gt;_ SYSTEM_CORE // EXECUTION_HISTORY</p>
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
                  <button type="button" onClick={() => handleViewCode(submission.id)}>
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
            <span>SHOWING {filteredSubmissions.length ? '1' : '0'}-{filteredSubmissions.length} OF {submissions.length} SUBMISSIONS</span>
            <div>
              <button type="button" disabled>&lt;</button>
              <button type="button" disabled>&gt;</button>
            </div>
          </footer>
        </section>

        {selectedSubmission && (
          <section className="submission-code-panel">
            <div>
              <p className="eyebrow">&gt;_ SOURCE SNAPSHOT #{selectedSubmission.id}</p>
              <button type="button" onClick={() => setSelectedSubmission(null)}>Close</button>
            </div>
            <pre>{selectedSubmission.source_code || '// No source saved'}</pre>
          </section>
        )}
      </section>

      <footer className="submission-footer">
        <div>
          <strong>IDE ONLINE</strong>
          <span>Status</span>
          <span>API Docs</span>
          <span>Privacy</span>
        </div>
        <span>BUILD: V4.2.0-STABLE | ENVIRONMENT: <strong>DEVELOPMENT</strong></span>
      </footer>
    </main>
  );
}
