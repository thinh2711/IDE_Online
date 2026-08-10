import { useEffect, useMemo, useState } from 'react';
import { getQuestion, listTestCases } from '../api/questions';
import { runSubmission } from '../api/submissions';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';

const defaultCode = '';

const languageOptions = [
  { extension: 'py', label: 'Python 3', value: 'python' },
  { extension: 'js', label: 'JavaScript', value: 'javascript' },
  { extension: 'cpp', label: 'C++', value: 'cpp' },
  { extension: 'java', label: 'Java', value: 'java' },
];

const difficultyClass = {
  easy: 'easy',
  hard: 'hard',
  medium: 'medium',
};

const formatRunStatus = (runStatus) => {
  if (!runStatus) return 'READY';

  return runStatus.replace(/_/g, ' ').toUpperCase();
};

const normalizeOutput = (value) => {
  return String(value ?? '').replace(/\r\n/g, '\n').trim();
};

const getDisplayRunStatus = (runResult, expectedOutput) => {
  if (!runResult) return 'ready';
  if (runResult.status !== 'accepted') return runResult.status;
  if (!String(expectedOutput ?? '').trim()) return runResult.status;

  return normalizeOutput(runResult.stdout) === normalizeOutput(expectedOutput) ? 'accepted' : 'wrong_answer';
};

const getRunOutput = (runResult, displayStatus) => {
  if (!runResult) {
    return {
      className: '',
      label: 'Output',
      text: '(not run yet)',
    };
  }

  if (runResult.stdout) {
    return {
      className: displayStatus === 'wrong_answer' ? 'error-text' : '',
      label: 'Output',
      text: runResult.stdout,
    };
  }

  if (runResult.stderr) {
    return {
      className: 'error-text',
      label: 'Error',
      text: runResult.stderr,
    };
  }

  return {
    className: 'muted-text',
    label: 'Output',
    text: '(no stdout)',
  };
};

export function EditorPage({ onBack, onBackToDashboard, onOpenChallenges, onOpenSubmissionHistory, question }) {
  const { token, user } = useAuth();
  const [activeCase, setActiveCase] = useState(0);
  const [activeConsoleTab, setActiveConsoleTab] = useState('Test Cases');
  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState('python');
  const [currentQuestion, setCurrentQuestion] = useState(question);
  const [testCases, setTestCases] = useState([]);
  const [result, setResult] = useState(null);
  const [runContext, setRunContext] = useState(null);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const selectedLanguage = languageOptions.find((option) => option.value === language) || languageOptions[0];
  const activeTestCase = testCases[activeCase] || null;
  const title = currentQuestion?.title || 'Select a real question';
  const difficulty = currentQuestion?.difficulty || 'easy';
  const description = currentQuestion?.description || '';
  const sampleInput = activeTestCase?.input ?? currentQuestion?.sample_input ?? '';
  const sampleOutput = activeTestCase?.expected_output ?? currentQuestion?.sample_output ?? '';
  const lineNumbers = useMemo(() => code.split('\n').map((_, index) => index + 1), [code]);
  const executionStats = result
    ? `${result.execution_time || '-'}s / ${result.memory_kb || '-'}KB`
    : '- / -';
  const resultInput = runContext?.input ?? sampleInput;
  const resultExpectedOutput = runContext?.expectedOutput ?? sampleOutput;
  const runStatus = getDisplayRunStatus(result, resultExpectedOutput);
  const runOutput = getRunOutput(result, runStatus);

  useEffect(() => {
    setCurrentQuestion(question);
    setActiveCase(0);
    setResult(null);
    setRunContext(null);
  }, [question]);

  useEffect(() => {
    if (!question?.id) return;

    loadQuestionWorkspace(question.id).catch((error) => {
      setMessage(error.message);
      setActiveConsoleTab('Terminal');
    });
  }, [question?.id]);

  async function loadQuestionWorkspace(questionId) {
    setStatus('loading');
    setMessage('');

    try {
      const [questionData, testCaseData] = await Promise.all([
        getQuestion(token, questionId),
        listTestCases(token, questionId),
      ]);
      setCurrentQuestion(questionData.question);
      setTestCases(testCaseData.testCases || []);
    } finally {
      setStatus('idle');
    }
  }

  async function handleRun() {
    setStatus('running');
    setMessage('');

    try {
      const data = await runSubmission(token, {
        language,
        questionId: currentQuestion?.id || null,
        sourceCode: code,
        stdin: sampleInput,
      });
      setResult(data.submission);
      setRunContext({
        expectedOutput: sampleOutput,
        input: sampleInput,
      });
      setMessage(data.message || 'Run completed.');
      setActiveConsoleTab('Test Result');
    } catch (error) {
      setMessage(error.message);
      setActiveConsoleTab('Terminal');
    } finally {
      setStatus('idle');
    }
  }

  function renderConsolePanel() {
    if (activeConsoleTab === 'Test Cases') {
      return (
        <>
          <p className="console-kicker">&gt; TEST CASE</p>
          <div className="console-box">
            {activeTestCase ? (
              <>
                <p><strong>Case:</strong>      #{activeCase + 1}</p>
                <p><strong>Input:</strong>     <span>{activeTestCase.input || '(empty)'}</span></p>
                <p><strong>Expected:</strong>  <span>{activeTestCase.expected_output || '(no expected output)'}</span></p>
              </>
            ) : (
              <>
                <p><strong>Status:</strong>    <span className="muted-text">No visible test cases</span></p>
                <p><strong>Sample input:</strong> {sampleInput || '(empty)'}</p>
                <p><strong>Sample output:</strong> {sampleOutput || '(no sample output)'}</p>
              </>
            )}
          </div>
        </>
      );
    }

    if (activeConsoleTab === 'Terminal') {
      return (
        <>
          <p className="console-kicker">:= EXECUTION LOG</p>
          <div className="console-box muted">
            {message ? (
              <p>[API] {message}</p>
            ) : (
              <p>[LOG] Workspace is using database question data.</p>
            )}
            {result && <p>[SUBMISSION] id={result.id}, status={result.status}, language={result.language}</p>}
            {result?.stderr && <p>[STDERR] {result.stderr}</p>}
          </div>
        </>
      );
    }

    return (
      <>
        <p className="console-kicker">&gt; RUN RESULT</p>
        <div className="console-box">
          <p><strong>Verdict:</strong>  <span className={runStatus === 'accepted' ? '' : 'error-text'}>{formatRunStatus(runStatus)}</span></p>
          <p><strong>Input:</strong>    {resultInput || '(empty)'}</p>
          <p><strong>{runOutput.label}:</strong>   <span className={runOutput.className}>{runOutput.text}</span></p>
          <p><strong>Expected:</strong> {resultExpectedOutput || '(no expected output)'}</p>
        </div>
      </>
    );
  }

  return (
    <main className="ide-shell">
      <header className="ide-navbar">
        <div className="ide-nav-left">
          <button className="icon-button" type="button" onClick={onBack} title="Back to problem bank">
            <Icon name="arrowLeft" size={18} />
          </button>
          <h1>{title}</h1>
          <span className="live-badge"><i /> LIVE SESSION</span>
        </div>

        <nav className="ide-nav-links" aria-label="Workspace navigation">
          <button type="button" onClick={onBackToDashboard}>Dashboard</button>
          <button type="button" onClick={onOpenSubmissionHistory}>Submission History</button>
        </nav>

        <label className="language-select">
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <div className="ide-nav-actions">
          <button className="run-button" type="button" onClick={handleRun} disabled={status === 'running'}>
            <Icon name="play" size={15} /> {status === 'running' ? 'Running' : 'Run'}
          </button>
          <button className="submit-button" type="button" onClick={handleRun} disabled={status === 'running'}>
            <Icon name="upload" size={15} /> Submit
          </button>
          <button className="icon-button" type="button" title="Settings">
            <Icon name="settings" size={17} />
          </button>
          <span className="ide-avatar">{user?.username?.slice(0, 1)?.toUpperCase() || 'U'}</span>
        </div>
      </header>

      <section className="ide-workspace">
        <aside className="problem-pane">
          <div className="pane-label"><Icon name="terminal" size={14} /> PROBLEM</div>
          <div className="problem-scroll">
            <section>
              <h2>1. {title}</h2>
              <div className="problem-tags">
                <span className={`difficulty-tag ${difficultyClass[difficulty] || 'easy'}`}>{difficulty.toUpperCase()}</span>
              </div>
            </section>

            <section className="problem-copy">
              <p>{description || 'No description has been added for this question yet.'}</p>
            </section>

            <section>
              <h3>&lt;&gt; Example 1:</h3>
              <div className="example-box">
                <p><strong>Input:</strong> {sampleInput || '(empty)'}</p>
                <p><strong>Output:</strong> {sampleOutput || '(no sample output)'}</p>
              </div>
            </section>
          </div>
        </aside>

        <section className="ide-right-stack">
          <section className="editor-pane">
            <div className="editor-toolbar">
              <div className="editor-tab">
                <Icon name="terminal" size={14} /> solution.{selectedLanguage.extension}
                <span />
                <span />
                <span />
              </div>
              <div className="editor-tools">
                <button type="button" title="History"><Icon name="clock" size={16} /></button>
                <button type="button" title="Fullscreen"><Icon name="maximize" size={16} /></button>
              </div>
            </div>

            <div className="code-editor">
              <div className="line-numbers">
                {lineNumbers.map((line) => <span key={line}>{line}</span>)}
              </div>
              <textarea
                aria-label="Source code"
                spellCheck="false"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </div>
          </section>

          <section className="console-pane">
            <div className="console-toolbar">
              <div className="console-tabs">
                {['Test Cases', 'Test Result', 'Terminal'].map((tab) => (
                  <button
                    className={activeConsoleTab === tab ? 'active' : ''}
                    key={tab}
                    type="button"
                    onClick={() => setActiveConsoleTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="console-status">
                <span className={runStatus}>
                  <Icon name="checkCircle" size={14} /> {formatRunStatus(result?.status)}
                </span>
                <em>{executionStats}</em>
              </div>
            </div>

            <div className="console-body">
              <div className="case-tabs">
                {testCases.map((testCase, index) => (
                  <button
                    className={activeCase === index ? 'active' : ''}
                    key={testCase.id}
                    type="button"
                    onClick={() => setActiveCase(index)}
                  >
                    {index + 1}
                  </button>
                ))}
                {testCases.length === 0 && <span className="empty-state">No visible test cases</span>}
              </div>

              <div className="console-output">
                {renderConsolePanel()}
              </div>
            </div>
          </section>
        </section>
      </section>

      <footer className="ide-statusbar">
        <div>
          <span>[= LOCALHOST</span>
        </div>
        <div>
          <span>UTF-8</span>
          <span>{selectedLanguage.label.toUpperCase()}</span>
          <strong><i /> SYNCED</strong>
        </div>
      </footer>
    </main>
  );
}
