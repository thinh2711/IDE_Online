import { useEffect, useMemo, useState } from 'react';
import { getSubmission, runSubmission } from '../api/submissions';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { formatCreatedAt } from '../utils/date';

const formatStatus = (status) => String(status || 'unknown').replace(/_/g, ' ').toUpperCase();

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

const formatExtension = (language) => {
  const extensions = {
    c: 'c',
    cpp: 'cpp',
    java: 'java',
    javascript: 'js',
    python: 'py',
  };

  return extensions[language] || 'txt';
};

const formatMemory = (memoryKb) => {
  if (!memoryKb) return 'N/A';

  return `${Math.round(Number(memoryKb) / 102.4) / 10} MB`;
};

const normalizeOutput = (value) => String(value ?? '').replace(/\r\n/g, '\n').trim();

const getVerdict = (submission) => {
  if (!submission) return 'unknown';
  if (submission.status !== 'accepted') return submission.status;
  if (!String(submission.expected_output ?? '').trim()) return submission.status;

  return normalizeOutput(submission.stdout) === normalizeOutput(submission.expected_output)
    ? 'accepted'
    : 'wrong_answer';
};

const getStatusClass = (status) => {
  if (status === 'accepted') return 'accepted';
  if (status === 'time_limit_exceeded') return 'time-limit';
  if (['wrong_answer', 'runtime_error', 'compilation_error'].includes(status)) return 'error';

  return 'neutral';
};

export function SubmissionDetailPage({ id, onBackToDashboard, onBackToHistory, onOpenEditor }) {
  const { signOut, token, user } = useAuth();
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');
  const [submission, setSubmission] = useState(null);

  useEffect(() => {
    loadSubmission().catch(() => {});
  }, [id]);

  const verdict = getVerdict(submission);
  const codeLines = useMemo(() => {
    return String(submission?.source_code || '// No source saved').split('\n');
  }, [submission?.source_code]);

  async function loadSubmission() {
    setStatus('loading');
    setMessage('');

    try {
      const data = await getSubmission(token, id);
      setSubmission(data.submission);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setStatus('idle');
    }
  }

  async function handleRerun() {
    if (!submission) return;

    setStatus('running');
    setMessage('');

    try {
      const data = await runSubmission(token, {
        expectedOutput: submission.expected_output || '',
        language: submission.language,
        questionId: submission.question_id,
        sourceCode: submission.source_code,
        stdin: submission.stdin || '',
      });
      setMessage(`Rerun completed as submission #${data.submission.id}.`);
      await loadSubmission();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setStatus('idle');
    }
  }

  const questionTitle = submission?.question_title || `Question ${submission?.question_id || 'Practice'}`;

  return (
    <main className="submission-detail-shell">
      <header className="submission-navbar">
        <div className="dashboard-brand">
          <span>I</span>
          <strong>IDE ONLINE</strong>
        </div>

        <nav className="dashboard-nav">
          <button type="button" onClick={onBackToDashboard}>DASHBOARD</button>
          <button className="active" type="button" onClick={onBackToHistory}>SUBMISSIONS</button>
        </nav>

        <div className="dashboard-session">
          <button type="button" title="Console"><Icon name="terminal" size={17} /></button>
          <button type="button" title="Settings"><Icon name="settings" size={17} /></button>
          <button className="dashboard-avatar" type="button" onClick={signOut} title="Sign out">
            {user?.username?.slice(0, 1)?.toUpperCase() || 'U'}
          </button>
        </div>
      </header>

      <section className="submission-detail-main">
        <button className="submission-back-link" type="button" onClick={onBackToHistory}>
          <Icon name="arrowLeft" size={14} /> Back to History
        </button>

        {message && <p className="workspace-message">{message}</p>}

        <section className="submission-detail-heading">
          <div>
            <h1>{status === 'loading' && !submission ? 'Loading submission...' : questionTitle}</h1>
            <span>#SUB-{submission?.id || id}</span>
            <em className={`submission-status-badge ${getStatusClass(verdict)}`}>
              <i /> {formatStatus(verdict)}
            </em>
          </div>

          <div>
            <button type="button" onClick={() => onOpenEditor?.({ id: submission?.question_id, title: questionTitle })} disabled={!submission?.question_id}>
              <Icon name="terminal" size={15} /> Edit in IDE
            </button>
            <button className="primary" type="button" onClick={handleRerun} disabled={!submission || status === 'running'}>
              <Icon name="play" size={15} /> {status === 'running' ? 'Rerunning' : 'Rerun'}
            </button>
          </div>
        </section>

        <section className="submission-detail-grid">
          <section className="source-viewer-pane">
            <header>
              <span><Icon name="terminal" size={14} /> solution.{formatExtension(submission?.language)}</span>
              <em>{formatLanguage(submission?.language)}</em>
            </header>
            <div className="source-viewer-body">
              <div className="source-line-numbers">
                {codeLines.map((_, index) => <span key={index + 1}>{index + 1}</span>)}
              </div>
              <pre>{codeLines.join('\n')}</pre>
            </div>
          </section>

          <section className="submission-detail-side">
            <div className="submission-metric-grid">
              <article>
                <span>Runtime</span>
                <strong>{submission?.execution_time ? `${submission.execution_time}s` : 'N/A'}</strong>
              </article>
              <article>
                <span>Memory</span>
                <strong>{formatMemory(submission?.memory_kb)}</strong>
              </article>
              <article>
                <span>Submitted By</span>
                <strong><Icon name="user" size={15} /> {submission?.submitted_by || user?.username || 'Unknown'}</strong>
              </article>
              <article>
                <span>Timestamp</span>
                <strong>{formatCreatedAt(submission?.created_at)}</strong>
              </article>
            </div>

            <section className="execution-log-pane">
              <header><Icon name="terminal" size={14} /> Execution Logs</header>
              <div>
                <section>
                  <h2>Input Buffer:</h2>
                  <pre>{submission?.stdin || '(empty)'}</pre>
                </section>
                <section>
                  <h2>STDOUT:</h2>
                  <pre className={verdict === 'accepted' ? 'success' : 'error'}>{submission?.stdout || '(no stdout)'}</pre>
                </section>
                <section>
                  <h2>Expected Output:</h2>
                  <pre className="success">{submission?.expected_output || '(no expected output)'}</pre>
                </section>
                <hr />
                <p>
                  STDERR: {submission?.stderr || (verdict === 'accepted'
                    ? 'Process exited with code 0.'
                    : 'Process exited with code 0. Test case failed.')}
                </p>
              </div>
            </section>
          </section>
        </section>
      </section>

      <footer className="submission-footer">
        <span>© 2024 IDE ONLINE | Build v2.4.1-stable | Env: <strong>Development</strong></span>
        <div>
          <span>Status</span>
          <span>API Docs</span>
          <span>Privacy</span>
        </div>
      </footer>
    </main>
  );
}
