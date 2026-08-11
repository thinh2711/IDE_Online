import { useEffect, useMemo, useState } from 'react';
import { listTestCases } from '../api/questions';
import { createSession, endSession, joinSession } from '../api/sessions';
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

export function ReviewerSessionPage({ initialJoinCode = '', onBackToDashboard, onOpenEditor, question = null }) {
  const { signOut, token, user } = useAuth();
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [message, setMessage] = useState('');
  const [session, setSession] = useState(null);
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
            <h1>{headingTitle}</h1>
            {displayQuestion?.difficulty && (
              <span className={`challenge-difficulty ${displayQuestion.difficulty}`}>
                {displayQuestion.difficulty.toUpperCase()}
              </span>
            )}
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
            {canStartCoding && (
              <button className="dashboard-primary" type="button" onClick={handleStartCoding}>
                <Icon name="terminal" size={15} /> Start Coding
              </button>
            )}
          </form>
        </section>

        {message && <p className="workspace-message">{message}</p>}

        <section className="reviewer-session-grid">
          <section className="source-viewer-pane">
            <header>
              <span><Icon name="terminal" size={14} /> {latestSubmission ? `readonly-session.${latestSubmission.language}` : 'question-brief.md'}</span>
              <em>{session?.join_code || 'NO SESSION'}</em>
            </header>
            <div className="source-viewer-body">
              <div className="source-line-numbers">
                {codeLines.map((_, index) => <span key={index + 1}>{index + 1}</span>)}
              </div>
              <pre>{displayedSource}</pre>
            </div>
          </section>

          <aside className="reviewer-session-side">
            {question?.id && ['admin', 'viewer'].includes(user?.role) && (
              <form className="interview-create-form" onSubmit={handleCreateSession}>
                <h2>Create Interview Session</h2>
                <p>Any coder with the join code can enter this room and submit code for the selected question.</p>
                <button className="dashboard-primary" type="submit" disabled={status === 'creating'}>
                  <Icon name="plus" size={15} /> {status === 'creating' ? 'Creating' : 'Create Session'}
                </button>
              </form>
            )}

            <section className="execution-log-pane">
              <header><Icon name="book" size={14} /> Question Description</header>
              <div>
                <pre>{displayQuestion?.description || 'No description is available for this question.'}</pre>
              </div>
            </section>

            <section className="submission-metric-grid">
              <article>
                <span>Coders Joined</span>
                <strong><Icon name="user" size={15} /> {uniqueCoderCount}</strong>
              </article>
              <article>
                <span>Question</span>
                <strong>{displayQuestion?.title || 'N/A'}</strong>
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
              <header><Icon name="book" size={14} /> Visible Test Cases</header>
              <div>
                {testCases.map((testCase, index) => (
                  <article className="reviewer-testcase-row" key={testCase.id}>
                    <strong>Case #{index + 1}</strong>
                    <span>{testCase.is_hidden ? 'Hidden' : 'Visible'}</span>
                    <pre>Input: {testCase.input || '(empty)'}{'\n'}Expected: {testCase.expected_output || '(empty)'}</pre>
                  </article>
                ))}
                {testCases.length === 0 && <p>No visible test cases are available for this question.</p>}
              </div>
            </section>

            {canViewSessionHistory && (
              <section className="execution-log-pane">
                <header><Icon name="clock" size={14} /> Session Submissions</header>
                <div>
                  {submissions.map((submission) => (
                    <article className="reviewer-submission-row" key={submission.id}>
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
