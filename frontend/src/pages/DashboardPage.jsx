import { useEffect, useMemo, useState } from 'react';
import { listQuestions } from '../api/questions';
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

export function DashboardPage({ onManageProblems, onOpenEditor, onOpenSubmissionHistory }) {
  const { signOut, token, user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const isAdmin = user?.role === 'admin';

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
        <p className="eyebrow">&gt;_ SYSTEM_CORE</p>
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
                <button type="button" onClick={() => onOpenEditor?.(question)}>
                  Solve <Icon name="arrowRight" size={14} />
                </button>
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
              ? 'SYNCING CHALLENGE INDEX'
              : `SHOWING ${challengeRows.length ? '1' : '0'}-${challengeRows.length} OF ${totalQuestions} ENTRIES`}
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
        <article className="system-logs">
          <h2>SYSTEM LOGS</h2>
          <div>
            <p className="ok">[08:42:11] Connected to worker node localhost</p>
            <p>[08:42:15] Challenge dataset synced: {totalQuestions} problems</p>
            <p>[08:42:18] Indexing metadata for admin/coder workspace...</p>
            <p>-</p>
          </div>
        </article>
        <article className="quick-navigation">
          <h2>QUICK NAVIGATION</h2>
          <div>
            <button type="button" onClick={onOpenSubmissionHistory}><Icon name="folder" size={16} /> MY SUBMISSIONS</button>
            <button type="button"><Icon name="users" size={16} /> TEAM RANKINGS</button>
            <button type="button"><Icon name="zap" size={16} /> DAILY CHALLENGE</button>
            <button type="button"><Icon name="book" size={16} /> DOCUMENTATION</button>
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
                <strong>ADMIN CONSOLE</strong>
                <em>SYSTEM ARCHITECT</em>
              </div>
            </section>

            <button className="admin-new-problem" type="button" onClick={onManageProblems}>
              <Icon name="plus" size={16} /> New Problem
            </button>

            <nav className="admin-side-nav" aria-label="Admin navigation">
              <button className="active" type="button"><Icon name="terminal" size={16} /> Overview</button>
              <button type="button" onClick={onManageProblems}><Icon name="folder" size={16} /> Manage Problems</button>
              <button type="button" onClick={onManageProblems}><Icon name="settings" size={16} /> Test Cases</button>
              <button type="button" onClick={onOpenSubmissionHistory}><Icon name="clock" size={16} /> Submissions</button>
              <button type="button"><Icon name="chart" size={16} /> Analytics</button>
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
          <strong>IDE ONLINE</strong>
        </div>

        <nav className="dashboard-nav">
          <button className="active" type="button">DASHBOARD</button>
          <button type="button" onClick={onOpenSubmissionHistory}>SUBMISSION HISTORY</button>
        </nav>

        <div className="dashboard-session">
          <div>
            <span>SESSION ID: 0X8F2A</span>
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
          <p className="eyebrow">&gt;_ SYSTEM_CORE</p>
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
                  <button type="button" onClick={() => onOpenEditor?.(question)}>
                    Solve <Icon name="arrowRight" size={14} />
                  </button>
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
                ? 'SYNCING CHALLENGE INDEX'
                : `SHOWING ${challengeRows.length ? '1' : '0'}-${challengeRows.length} OF ${totalQuestions} ENTRIES`}
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
          <article className="system-logs">
            <h2>SYSTEM LOGS</h2>
            <div>
              <p className="ok">[08:42:11] Connected to worker node localhost</p>
              <p>[08:42:15] Challenge dataset synced: {totalQuestions} problems</p>
              <p>[08:42:18] Indexing metadata for admin/coder workspace...</p>
              <p>-</p>
            </div>
          </article>
          <article className="quick-navigation">
            <h2>QUICK NAVIGATION</h2>
            <div>
              <button type="button"><Icon name="folder" size={16} /> MY SUBMISSIONS</button>
              <button type="button"><Icon name="users" size={16} /> TEAM RANKINGS</button>
              <button type="button"><Icon name="zap" size={16} /> DAILY CHALLENGE</button>
              <button type="button"><Icon name="book" size={16} /> DOCUMENTATION</button>
            </div>
          </article>
        </section>
      </section>

      <footer className="dashboard-footer">
        <div>
          <span>BUILD: V4.2.0-STABLE</span>
          <strong><i /> ENVIRONMENT: DEVELOPMENT</strong>
        </div>
        <span>ONLINE CODE EDITOR MVP</span>
      </footer>
    </main>
  );
}
