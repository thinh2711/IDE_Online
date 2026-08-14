import { useEffect, useMemo, useState } from 'react';
import { listTestCases } from '../api/questions';
import { createSession, endSession, getSession, joinSession, listSessions } from '../api/sessions';
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

const formatRuntimeMs = (submissions) => {
  const runtimes = submissions
    .map((submission) => Number(submission.execution_time))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (runtimes.length === 0) return 'N/A';

  const averageSeconds = runtimes.reduce((total, value) => total + value, 0) / runtimes.length;
  return `${Math.round(averageSeconds * 1000)}ms`;
};

const formatUptime = (createdAt) => {
  if (!createdAt) return 'N/A';

  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) return 'N/A';

  const totalSeconds = Math.max(0, Math.floor((Date.now() - createdDate.getTime()) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}m ${seconds}s`;
};

const getFileName = (submission) => {
  const extensions = {
    cpp: 'solution.cpp',
    python: 'solution.py',
  };

  return extensions[submission?.language] || 'question-brief.md';
};

export function ReviewerSessionPage({ initialJoinCode = '', onBackToDashboard, onOpenEditor, question = null }) {
  const { signOut, token, user } = useAuth();
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [message, setMessage] = useState('');
  const [session, setSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [status, setStatus] = useState('idle');
  const [submissions, setSubmissions] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const questionIdForTestCases = question?.id || session?.question_id;

  useEffect(() => {
    if (!questionIdForTestCases) {
      setTestCases([]);
      return;
    }

    listTestCases(token, questionIdForTestCases)
      .then((data) => setTestCases(data.testCases || []))
      .catch((error) => setMessage(error.message));
  }, [questionIdForTestCases, token]);

  const latestSubmission = submissions[0] || null;

  useEffect(() => {
    if (!['admin', 'viewer'].includes(user?.role)) {
      setSessions([]);
      return;
    }

    loadSavedSessions().catch(() => {});
  }, [token, user?.role]);

  async function loadSavedSessions() {
    const data = await listSessions(token);
    setSessions(data.sessions || []);
  }

  async function handleJoin(event) {
    event.preventDefault();
    setStatus('joining');
    setMessage('');

    try {
      const data = await joinSession(token, joinCode);
      setSession(data.session);
      setSubmissions(data.submissions || []);
      setMessage(`Joined session ${data.session.join_code}.`);
      if (['admin', 'viewer'].includes(user?.role)) {
        await loadSavedSessions();
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setStatus('idle');
    }
  }

  async function handleCreateSession(event) {
    event.preventDefault();

    if (!question?.id) {
      setMessage('Select a question before creating a session.');
      return;
    }

    setStatus('creating');
    setMessage('');

    try {
      const data = await createSession(token, {
        questionId: question.id,
      });
      setJoinCode(data.session.join_code);
      setSession(data.session);
      setSubmissions([]);
      setMessage(`Session ${data.session.join_code} created for this question.`);
      await loadSavedSessions();
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
      await loadSavedSessions();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setStatus('idle');
    }
  }

  async function handleOpenSavedSession(id) {
    setStatus('loading-session');
    setMessage('');

    try {
      const data = await getSession(token, id);
      setSession(data.session);
      setJoinCode(data.session.join_code);
      setSubmissions(data.submissions || []);
      setMessage(`Opened saved session ${data.session.join_code}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setStatus('idle');
    }
  }

  const canEndSession = session && ['admin', 'viewer'].includes(user?.role);
  const canStartCoding = session?.status === 'active' && user?.role === 'coder';
  const canViewSessionHistory = ['admin', 'viewer'].includes(user?.role);
  const uniqueCoderCount = new Set(submissions.map((submission) => submission.user_id)).size;
  const displayQuestion = session
    ? {
        description: session.question_description,
        difficulty: session.question_difficulty,
        id: session.question_id,
        sample_input: session.question_sample_input,
        sample_output: session.question_sample_output,
        title: session.question_title,
      }
    : question;
  const headingTitle = displayQuestion?.title || 'Join Review Session';
  const displayedSource = latestSubmission?.source_code
    || displayQuestion?.description
    || '// Select a question or join an active session to view candidate code.';
  const codeLines = useMemo(() => {
    return String(displayedSource).split('\n');
  }, [displayedSource]);
  const activeSessionCount = sessions.filter((item) => item.status === 'active').length;
  const sessionMetrics = [
    { label: 'CODERS', value: `${uniqueCoderCount} Active` },
    { label: 'TOTAL SUBMISSIONS', value: String(submissions.length) },
    { label: 'UPTIME', value: formatUptime(session?.created_at) },
    { label: 'AVG RUNTIME', value: formatRuntimeMs(submissions) },
  ];

  function handleStartCoding() {
    if (!session?.question_id) return;

    onOpenEditor?.({
      description: session.question_description,
      difficulty: session.question_difficulty || 'easy',
      id: session.question_id,
      sample_input: session.question_sample_input || '',
      sample_output: session.question_sample_output || '',
      title: session.question_title || 'Session Question',
    }, session);
  }

  return (
    <main className="review-shell">
      <header className="review-topbar">
        <div className="review-brand">Lumina Review</div>
        <nav className="review-topnav" aria-label="Review navigation">
          <button className="active" type="button">Sessions</button>
          <button type="button">Candidates</button>
          <button type="button">Library</button>
        </nav>
        <div className="review-top-actions">
          <button type="button" title="Settings"><Icon name="settings" size={18} /></button>
          <button type="button" title="Help"><Icon name="helpCircle" size={18} /></button>
          {canEndSession && (
            <button className="review-primary-button" type="button" onClick={handleEndSession} disabled={status === 'ending'}>
              {status === 'ending' ? 'Ending' : 'End Session'}
            </button>
          )}
          <button className="review-avatar" type="button" onClick={signOut} title="Sign out">
            {user?.username?.slice(0, 1)?.toUpperCase() || 'U'}
          </button>
        </div>
      </header>

      <aside className="review-sidebar">
        <div>
          <section className="review-context">
            <span><Icon name="terminal" size={18} /></span>
            <div>
              <strong>Tech Interview</strong>
              <em>{session ? 'Live Session' : 'Review Setup'}</em>
            </div>
          </section>

          <section className="review-sidebar-action">
            {question?.id && ['admin', 'viewer'].includes(user?.role) ? (
              <button type="button" onClick={handleCreateSession} disabled={status === 'creating'}>
                {status === 'creating' ? 'Creating' : 'Quick Action'}
              </button>
            ) : (
              <button type="button" onClick={onBackToDashboard}>Dashboard</button>
            )}
          </section>

          <nav className="review-side-nav" aria-label="Session sections">
            <button className="active" type="button"><Icon name="terminal" size={16} /> Code</button>
            <button type="button"><Icon name="user" size={16} /> Candidate</button>
            <button type="button"><Icon name="book" size={16} /> Notes</button>
            <button type="button"><Icon name="terminal" size={16} /> Terminal</button>
            <button type="button"><Icon name="clock" size={16} /> History</button>
          </nav>
        </div>

        <div className="review-sidebar-bottom">
          <button type="button"><Icon name="settings" size={16} /> Settings</button>
          <button type="button"><Icon name="helpCircle" size={16} /> Support</button>
        </div>
      </aside>

      <section className="review-workspace">
        <section className="review-heading">
          <div>
            <h1>{headingTitle}</h1>
            <div className="review-badges">
              <span>ID: Q-{displayQuestion?.id || '----'}</span>
              {displayQuestion?.difficulty && <span className="difficulty">{displayQuestion.difficulty.toUpperCase()}</span>}
              {session?.join_code && <span>JOIN: {session.join_code}</span>}
            </div>
          </div>
          <span className={`review-status ${getStatusClass(session?.status)}`}>
            <i /> {formatStatus(session?.status || 'waiting')}
          </span>
        </section>

        {message && <p className="workspace-message">{message}</p>}

        <section className="review-layout-grid">
          <section className="review-code-panel">
            <header>
              <div className="review-window-dots" aria-hidden="true">
                <i /><i /><i />
              </div>
              <span>{getFileName(latestSubmission)}</span>
              <div>
                <button type="button" title="Copy"><Icon name="download" size={15} /></button>
                <button type="button" title="Fullscreen"><Icon name="maximize" size={15} /></button>
              </div>
            </header>
            <div className="review-code-body">
              <div className="review-line-numbers">
                {codeLines.map((_, index) => <span key={index + 1}>{index + 1}</span>)}
              </div>
              <pre>{displayedSource}</pre>
            </div>
          </section>

          <aside className="review-panel-stack">
            <section className="review-panel">
              <h2>Session Metrics</h2>
              <div className="review-metrics">
                {sessionMetrics.map((metric) => (
                  <article key={metric.label}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </article>
                ))}
                <article>
                  <span>ACTIVE ROOMS</span>
                  <strong>{activeSessionCount}</strong>
                </article>
              </div>
            </section>

            <section className="review-panel">
              <h2>Join Session</h2>
              <form className="review-join-inline" onSubmit={handleJoin}>
                <input
                  placeholder="Enter Join Code"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                />
                <button type="submit" disabled={status === 'joining'}>
                  {status === 'joining' ? 'Joining' : 'Join'}
                </button>
              </form>
              {question?.id && ['admin', 'viewer'].includes(user?.role) && (
                <button className="review-secondary-wide" type="button" onClick={handleCreateSession} disabled={status === 'creating'}>
                  <Icon name="plus" size={15} /> {status === 'creating' ? 'Creating' : 'Create New Session'}
                </button>
              )}
              {canStartCoding && (
                <button className="review-primary-wide" type="button" onClick={handleStartCoding}>
                  <Icon name="terminal" size={15} /> Start Coding
                </button>
              )}
            </section>

            <section className="review-panel">
              <h2>Question Description</h2>
              <p className="review-description">{displayQuestion?.description || 'No description is available for this question.'}</p>
            </section>

            {canViewSessionHistory && (
              <section className="review-panel">
                <header>
                  <h2>Saved Sessions</h2>
                  <button type="button" onClick={loadSavedSessions} disabled={status === 'loading-session'}>
                    <Icon name="refresh" size={14} /> Refresh
                  </button>
                </header>
                <div className="review-session-list">
                  {sessions.map((savedSession) => (
                    <article className={session?.id === savedSession.id ? 'active' : ''} key={savedSession.id}>
                      <div>
                        <strong>{savedSession.join_code}</strong>
                        <span>{savedSession.question_title || 'Question'} · {formatStatus(savedSession.status)}</span>
                      </div>
                      <button type="button" onClick={() => handleOpenSavedSession(savedSession.id)}>Open</button>
                    </article>
                  ))}
                  {sessions.length === 0 && <p>No saved sessions yet.</p>}
                </div>
              </section>
            )}

            <section className="review-panel">
              <h2>Visible Test Cases</h2>
              <div className="review-test-list">
                {testCases.map((testCase, index) => (
                  <article key={testCase.id}>
                    <strong>Case #{index + 1}</strong>
                    <pre>Input: {testCase.input || '(empty)'}{'\n'}Expected: {testCase.expected_output || '(empty)'}</pre>
                  </article>
                ))}
                {testCases.length === 0 && <p>No visible test cases are available for this question.</p>}
              </div>
            </section>

            {canViewSessionHistory && (
              <section className="review-panel">
                <h2>Session Submissions</h2>
                <div className="review-submission-list">
                  {submissions.map((submission) => (
                    <article key={submission.id}>
                      <strong>#{submission.id} {formatStatus(submission.status)}</strong>
                      <span>{submission.submitted_by || 'Coder'} · {submission.language} · {formatCreatedAt(submission.created_at)}</span>
                      <pre>{submission.stdout || submission.stderr || '(no output)'}</pre>
                    </article>
                  ))}
                  {submissions.length === 0 && <p>No submissions have been attached to this session yet.</p>}
                </div>
              </section>
            )}
          </aside>
        </section>
      </section>
    </main>
  );
}
