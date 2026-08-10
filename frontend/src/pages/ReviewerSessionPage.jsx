import { useMemo, useState } from 'react';
import { endSession, joinSession } from '../api/sessions';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { formatCreatedAt } from '../utils/date';

const formatStatus = (status) => String(status || 'unknown').replace(/_/g, ' ').toUpperCase();

const getStatusClass = (status) => {
  if (status === 'active' || status === 'accepted') return 'accepted';
  if (status === 'time_limit_exceeded') return 'time-limit';
  if (['ended', 'wrong_answer', 'runtime_error', 'compilation_error'].includes(status)) return 'error';

  return 'neutral';
};

export function ReviewerSessionPage({ initialJoinCode = '', onBackToDashboard }) {
  const { signOut, token, user } = useAuth();
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [message, setMessage] = useState('');
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('idle');
  const [submissions, setSubmissions] = useState([]);

  const latestSubmission = submissions[0] || null;
  const codeLines = useMemo(() => {
    return String(latestSubmission?.source_code || '// No session submission yet').split('\n');
  }, [latestSubmission?.source_code]);

  async function handleJoin(event) {
    event.preventDefault();
    setStatus('joining');
    setMessage('');

    try {
      const data = await joinSession(token, joinCode);
      setSession(data.session);
      setSubmissions(data.submissions || []);
      setMessage(`Joined session ${data.session.join_code}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setStatus('idle');
    }
  }

  async function handleEndSession() {
    if (!session) return;

    setStatus('ending');
    setMessage('');

    try {
      const data = await endSession(token, session.id);
      setSession(data.session);
      setMessage(data.message || 'Session ended.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setStatus('idle');
    }
  }

  const canEndSession = session && (user?.role === 'admin' || session.coder_id === user?.id);

  return (
    <main className="reviewer-session-shell">
      <header className="submission-navbar">
        <div className="dashboard-brand">
          <span>I</span>
          <strong>IDE ONLINE</strong>
        </div>

        <nav className="dashboard-nav">
          <button type="button" onClick={onBackToDashboard}>DASHBOARD</button>
          <button className="active" type="button">REVIEW SESSION</button>
        </nav>

        <div className="dashboard-session">
          <button type="button" title="Console"><Icon name="terminal" size={17} /></button>
          <button type="button" title="Settings"><Icon name="settings" size={17} /></button>
          <button className="dashboard-avatar" type="button" onClick={signOut} title="Sign out">
            {user?.username?.slice(0, 1)?.toUpperCase() || 'U'}
          </button>
        </div>
      </header>

      <section className="reviewer-session-main">
        <section className="reviewer-session-hero">
          <div>
            <p className="eyebrow">&gt;_ REVIEW_CHANNEL</p>
            <h1>{session ? session.question_title || 'Live Coding Session' : 'Join Review Session'}</h1>
            <span className={`submission-status-badge ${getStatusClass(session?.status)}`}>
              <i /> {formatStatus(session?.status || 'waiting')}
            </span>
          </div>

          <form className="reviewer-join-form" onSubmit={handleJoin}>
            <label>
              <span>JOIN CODE</span>
              <input
                placeholder="ABC12345"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              />
            </label>
            <button className="dashboard-primary" type="submit" disabled={status === 'joining'}>
              <Icon name="users" size={15} /> {status === 'joining' ? 'Joining' : 'Join'}
            </button>
            {canEndSession && (
              <button className="danger-action" type="button" onClick={handleEndSession} disabled={status === 'ending'}>
                <Icon name="lock" size={15} /> {status === 'ending' ? 'Ending' : 'End'}
              </button>
            )}
          </form>
        </section>

        {message && <p className="workspace-message">{message}</p>}

        <section className="reviewer-session-grid">
          <section className="source-viewer-pane">
            <header>
              <span><Icon name="terminal" size={14} /> readonly-session.{latestSubmission?.language || 'txt'}</span>
              <em>{session?.join_code || 'NO SESSION'}</em>
            </header>
            <div className="source-viewer-body">
              <div className="source-line-numbers">
                {codeLines.map((_, index) => <span key={index + 1}>{index + 1}</span>)}
              </div>
              <pre>{codeLines.join('\n')}</pre>
            </div>
          </section>

          <aside className="reviewer-session-side">
            <section className="submission-metric-grid">
              <article>
                <span>Coder</span>
                <strong><Icon name="user" size={15} /> {session?.coder_username || 'N/A'}</strong>
              </article>
              <article>
                <span>Question</span>
                <strong>{session?.question_title || 'N/A'}</strong>
              </article>
              <article>
                <span>Created</span>
                <strong>{formatCreatedAt(session?.created_at)}</strong>
              </article>
              <article>
                <span>Submissions</span>
                <strong>{submissions.length}</strong>
              </article>
            </section>

            <section className="execution-log-pane">
              <header><Icon name="clock" size={14} /> Session Submissions</header>
              <div>
                {submissions.map((submission) => (
                  <article className="reviewer-submission-row" key={submission.id}>
                    <strong>#{submission.id} {formatStatus(submission.status)}</strong>
                    <span>{submission.language} · {formatCreatedAt(submission.created_at)}</span>
                    <pre>{submission.stdout || submission.stderr || '(no output)'}</pre>
                  </article>
                ))}
                {submissions.length === 0 && <p>No submissions have been attached to this session yet.</p>}
              </div>
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}
