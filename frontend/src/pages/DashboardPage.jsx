import { useEffect, useMemo, useState } from 'react';
import { listQuestions } from '../api/questions';
import { joinSession } from '../api/sessions';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';

const acceptanceByDifficulty = {
  easy: '75.3%',
  hard: '35.7%',
  medium: '40.1%',
};

const tagByDifficulty = {
  easy: 'Array, Hash Table',
  hard: 'Binary Search, Divide and Conquer',
  medium: 'Dynamic Programming, Hash Table',
};

function normalizeQuestion(question, index) {
  return {
    ...question,
    acceptance: question.acceptance || acceptanceByDifficulty[question.difficulty] || '49.2%',
    displayIndex: index + 1,
    solved: question.solved ?? index % 3 === 0,
    tags: question.tags || tagByDifficulty[question.difficulty] || 'Algorithm, Data Structure',
  };
}

export function DashboardPage({
  onManageProblems,
  onOpenEditor,
  onOpenReviewSession,
  onOpenSubmissionHistory,
  onOpenUsers,
}) {
  const { signOut, token, user } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [questions, setQuestions] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const isAdmin = user?.role === 'admin';
  const isCoder = user?.role === 'coder';
  const isViewer = user?.role === 'viewer';

  useEffect(() => {
    refreshQuestions().catch(() => {});
  }, []);

  async function refreshQuestions() {
    setStatus('loading');
    setMessage('');

    try {
      const data = await listQuestions(token);
      setQuestions(data.questions || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setStatus('idle');
    }
  }

  async function handleJoinSession(event) {
    event.preventDefault();
    setStatus('joining-session');
    setMessage('');

    try {
      const data = await joinSession(token, joinCode);
      const session = data.session;

      onOpenEditor?.({
        description: session.question_description || '',
        difficulty: session.question_difficulty || 'easy',
        id: session.question_id,
        sample_input: session.question_sample_input || '',
        sample_output: session.question_sample_output || '',
        title: session.question_title || 'Session Question',
      }, session);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setStatus('idle');
    }
  }

  const challengeRows = useMemo(() => {
    const normalized = questions.map(normalizeQuestion);
    const loweredQuery = query.trim().toLowerCase();

    if (!loweredQuery) return normalized;

    return normalized.filter((question) => {
      return (
        String(question.id).toLowerCase().includes(loweredQuery) ||
        question.title.toLowerCase().includes(loweredQuery) ||
        question.difficulty.toLowerCase().includes(loweredQuery)
      );
    });
  }, [query, questions]);

  const totalQuestions = questions.length;
  const solvedCount = challengeRows.filter((question) => question.solved).length;

  const renderDashboardContent = () => (
    <section className="dashboard-main admin-dashboard-main">
      <section className="dashboard-headline">
        <div>
          <h1>Coding Challenges</h1>
          <div className="dashboard-actions">
            <label className="dashboard-search">
              <Icon name="search" size={15} />
              <input
                placeholder="Filter by ID or Name..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            {isAdmin && (
              <button className="dashboard-primary" type="button" onClick={onManageProblems}>
                <Icon name="plus" size={15} /> EDIT TASK
              </button>
            )}
          </div>
        </div>
      </section>

      {message && <p className="workspace-message">{message}</p>}

      <section className="dashboard-stats">
        <article>
          <span>TOTAL SOLVED</span>
          <strong>{solvedCount} / {totalQuestions}</strong>
        </article>
        <article>
          <span>GLOBAL RANK</span>
          <strong>#{isAdmin ? 'ADMIN' : '1,042'}</strong>
        </article>
        <article>
          <span>ACCEPTANCE RATE</span>
          <strong>84.2%</strong>
        </article>
        <article>
          <span>STREAK</span>
          <strong>12 FIRE</strong>
        </article>
      </section>

      <section className="challenge-table" aria-label="Coding challenges">
        <div className="challenge-header">
          <span>STATUS</span>
          <span>TITLE</span>
          <span>DIFFICULTY</span>
          <span>ACCEPTANCE</span>
          <span>ACTION</span>
        </div>

        <div className="challenge-body">
          {challengeRows.map((question) => (
            <article className="challenge-row" key={question.id}>
              <span className={question.solved ? 'challenge-status solved' : 'challenge-status'}>
                <Icon name={question.solved ? 'checkCircle' : 'clock'} size={17} />
              </span>
              <div className="challenge-title">
                <strong>{question.displayIndex}. {question.title}</strong>
                <em>Tags: {question.tags}</em>
              </div>
              <span className={`challenge-difficulty ${question.difficulty}`}>
                {question.difficulty.toUpperCase()}
              </span>
              <span className="challenge-acceptance">{question.acceptance}</span>
              <div className="challenge-action">
                {isViewer || isAdmin ? (
                  <button type="button" onClick={() => onOpenReviewSession?.('', question)}>
                    Review <Icon name="users" size={14} />
                  </button>
                ) : (
                  <button type="button" onClick={() => onOpenEditor?.(question)}>
                    Solve <Icon name="arrowRight" size={14} />
                  </button>
                )}
              </div>
            </article>
          ))}
          {challengeRows.length === 0 && (
            <p className="dashboard-empty">
              {questions.length === 0 ? 'No real questions in database yet.' : 'No challenges match the current filter.'}
            </p>
          )}
        </div>

        <footer className="challenge-footer">
          <span>
            {status === 'loading'
              ? 'Loading challenges'
              : `${challengeRows.length} of ${totalQuestions} challenges`}
          </span>
          <div>
            <button type="button">&lt;</button>
            <button className="active" type="button">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button">&gt;</button>
          </div>
        </footer>
      </section>

      <section className="dashboard-widgets">
        <article className="quick-navigation">
          <h2>Quick Links</h2>
          <div>
            <button type="button" onClick={onOpenSubmissionHistory}><Icon name="folder" size={16} /> My Submissions</button>
            <button type="button" onClick={() => onOpenReviewSession?.()}><Icon name="users" size={16} /> Review Session</button>
          </div>
        </article>
      </section>
    </section>
  );

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

            <button className="admin-new-problem" type="button" onClick={onManageProblems}>
              <Icon name="plus" size={16} /> New Problem
            </button>

            <nav className="admin-side-nav" aria-label="Admin navigation">
              <button className="active" type="button"><Icon name="terminal" size={16} /> Overview</button>
              <button type="button" onClick={onManageProblems}><Icon name="folder" size={16} /> Manage Problems</button>
              <button type="button" onClick={onOpenUsers}><Icon name="users" size={16} /> Users</button>
              <button type="button" onClick={onOpenSubmissionHistory}><Icon name="clock" size={16} /> Submissions</button>
            </nav>
          </div>

          <div className="admin-side-footer" />
        </aside>

        <section className="admin-console-area">
          <header className="admin-console-topbar">
            <strong>IDE ONLINE</strong>
            <nav>
              <button className="active" type="button">Dashboard</button>
            </nav>
            <div>
              <button type="button" title="Notifications"><Icon name="bell" size={17} /></button>
              <button type="button" title="Settings"><Icon name="settings" size={17} /></button>
              <button className="admin-avatar" type="button" onClick={signOut} title="Sign out">
                {user?.username?.slice(0, 1)?.toUpperCase() || 'A'}
              </button>
            </div>
          </header>

          <section className="admin-console-content admin-dashboard-content">
            {renderDashboardContent()}
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-navbar">
        <div className="dashboard-brand">
          <span>I</span>
          <strong>IDE Online</strong>
        </div>

        <nav className="dashboard-nav">
          <button className="active" type="button">Dashboard</button>
          <button type="button" onClick={onOpenSubmissionHistory}>Submissions</button>
          {isViewer && <button type="button" onClick={() => onOpenReviewSession?.()}>Review</button>}
        </nav>

        <div className="dashboard-session">
          <div>
            <em>Role: {user?.role || 'coder'}</em>
          </div>
          <button type="button" title="Notifications"><Icon name="bell" size={17} /></button>
          <button type="button" title="Settings"><Icon name="settings" size={17} /></button>
          <button className="dashboard-avatar" type="button" onClick={signOut} title="Sign out">
            {user?.username?.slice(0, 1)?.toUpperCase() || 'U'}
          </button>
        </div>
      </header>

      <section className="dashboard-main">
        <section className="dashboard-headline">
          <div>
            <h1>Coding Challenges</h1>
            <div className="dashboard-actions">
              <label className="dashboard-search">
                <Icon name="search" size={15} />
                <input
                  placeholder="Filter by ID or Name..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              {isAdmin && (
                <button className="dashboard-primary" type="button" onClick={onManageProblems}>
                  <Icon name="plus" size={15} /> EDIT TASK
                </button>
              )}
            </div>
          </div>
        </section>

        {message && <p className="workspace-message">{message}</p>}

        {isCoder && (
          <form className="dashboard-join-session" onSubmit={handleJoinSession}>
            <label>
              <span>Join Session</span>
              <input
                placeholder="Enter join code"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              />
            </label>
            <button type="submit" disabled={!joinCode.trim() || status === 'joining-session'}>
              <Icon name="users" size={15} /> {status === 'joining-session' ? 'Joining' : 'Join'}
            </button>
          </form>
        )}

        <section className="dashboard-stats">
          <article>
            <span>TOTAL SOLVED</span>
            <strong>{solvedCount} / {totalQuestions}</strong>
          </article>
          <article>
            <span>GLOBAL RANK</span>
            <strong>#{isAdmin ? 'ADMIN' : '1,042'}</strong>
          </article>
          <article>
            <span>ACCEPTANCE RATE</span>
            <strong>84.2%</strong>
          </article>
          <article>
            <span>STREAK</span>
            <strong>12 FIRE</strong>
          </article>
        </section>

        <section className="challenge-table" aria-label="Coding challenges">
          <div className="challenge-header">
            <span>STATUS</span>
            <span>TITLE</span>
            <span>DIFFICULTY</span>
            <span>ACCEPTANCE</span>
            <span>ACTION</span>
          </div>

          <div className="challenge-body">
            {challengeRows.map((question) => (
              <article className="challenge-row" key={question.id}>
                <span className={question.solved ? 'challenge-status solved' : 'challenge-status'}>
                  <Icon name={question.solved ? 'checkCircle' : 'clock'} size={17} />
                </span>
                <div className="challenge-title">
                  <strong>{question.displayIndex}. {question.title}</strong>
                  <em>Tags: {question.tags}</em>
                </div>
                <span className={`challenge-difficulty ${question.difficulty}`}>
                  {question.difficulty.toUpperCase()}
                </span>
                <span className="challenge-acceptance">{question.acceptance}</span>
                <div className="challenge-action">
                  {isViewer || isAdmin ? (
                    <button type="button" onClick={() => onOpenReviewSession?.('', question)}>
                      Review <Icon name="users" size={14} />
                    </button>
                  ) : (
                    <button type="button" onClick={() => onOpenEditor?.(question)}>
                      Solve <Icon name="arrowRight" size={14} />
                    </button>
                  )}
                </div>
              </article>
            ))}
            {challengeRows.length === 0 && (
              <p className="dashboard-empty">
                {questions.length === 0 ? 'No real questions in database yet.' : 'No challenges match the current filter.'}
              </p>
            )}
          </div>

          <footer className="challenge-footer">
            <span>
              {status === 'loading'
                ? 'Loading challenges'
                : `${challengeRows.length} of ${totalQuestions} challenges`}
            </span>
            <div>
              <button type="button">&lt;</button>
              <button className="active" type="button">1</button>
              <button type="button">2</button>
              <button type="button">3</button>
              <button type="button">&gt;</button>
            </div>
          </footer>
        </section>

        <section className="dashboard-widgets">
          <article className="quick-navigation">
            <h2>Quick Links</h2>
            <div>
              <button type="button" onClick={onOpenSubmissionHistory}><Icon name="folder" size={16} /> My Submissions</button>
              {!isCoder && (
                <button type="button" onClick={() => onOpenReviewSession?.()}><Icon name="users" size={16} /> Review Session</button>
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
