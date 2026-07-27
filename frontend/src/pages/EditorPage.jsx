import { useMemo, useState } from 'react';
import { runSubmission } from '../api/submissions';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';

const defaultCode = `class Solution:
    def twoSum(self, nums, target):
        # Initialize hash map to store value to index mapping
        prevMap = {} # val : index

        for i, n in enumerate(nums):
            diff = target - n
            if diff in prevMap:
                return [prevMap[diff], i]
            prevMap[n] = i
        return []`;

const languageOptions = [
  { extension: 'py', label: 'Python 3', value: 'python' },
  { extension: 'js', label: 'JavaScript', value: 'javascript' },
  { extension: 'cpp', label: 'C++', value: 'cpp' },
  { extension: 'java', label: 'Java', value: 'java' },
];

const examples = [
  {
    expected: '[0,1]',
    input: 'nums = [2,7,11,15], target = 9',
    output: '[0,1]',
  },
  {
    expected: '[1,2]',
    input: 'nums = [3,2,4], target = 6',
    output: '[1,2]',
  },
  {
    expected: '[0,1]',
    input: 'nums = [3,3], target = 6',
    output: '[0,1]',
  },
];

const difficultyClass = {
  easy: 'easy',
  hard: 'hard',
  medium: 'medium',
};

export function EditorPage({ onBack, question }) {
  const { token, user } = useAuth();
  const [activeCase, setActiveCase] = useState(0);
  const [activeConsoleTab, setActiveConsoleTab] = useState('Test Cases');
  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState('python');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const selectedLanguage = languageOptions.find((option) => option.value === language) || languageOptions[0];
  const title = question?.title || 'Two Sum';
  const difficulty = question?.difficulty || 'easy';
  const description =
    question?.description ||
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.';
  const sampleInput = question?.sample_input || examples[activeCase].input;
  const sampleOutput = question?.sample_output || examples[activeCase].expected;
  const lineNumbers = useMemo(() => code.split('\n').map((_, index) => index + 1), [code]);

  async function handleRun() {
    setStatus('running');
    setMessage('');

    try {
      const data = await runSubmission(token, {
        language,
        questionId: question?.id || null,
        sourceCode: code,
        stdin: sampleInput,
      });
      setResult(data.submission);
      setMessage(data.message || 'Run completed.');
      setActiveConsoleTab('Test Result');
    } catch (error) {
      setMessage(error.message);
      setActiveConsoleTab('Terminal');
    } finally {
      setStatus('idle');
    }
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
                <span>ARRAY</span>
                <span>HASH TABLE</span>
              </div>
            </section>

            <section className="problem-copy">
              <p>{description}</p>
              <p>
                You may assume that each input has exactly one solution, and you may not use the same element twice.
                Return the answer in any order.
              </p>
            </section>

            <section>
              <h3>&lt;&gt; Example 1:</h3>
              <div className="example-box">
                <p><strong>Input:</strong> {sampleInput}</p>
                <p><strong>Output:</strong> {sampleOutput}</p>
                <p><em>Explanation:</em> Because nums[0] + nums[1] matches the target, return the two indices.</p>
              </div>
            </section>

            <section>
              <h3>Constraints:</h3>
              <ul className="constraints-list">
                <li>2 &lt;= nums.length &lt;= 10^4</li>
                <li>-10^9 &lt;= nums[i] &lt;= 10^9</li>
                <li>-10^9 &lt;= target &lt;= 10^9</li>
                <li>Only one valid answer exists.</li>
              </ul>
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
                <span className={result?.status === 'queued' ? 'queued' : 'accepted'}>
                  <Icon name="checkCircle" size={14} /> {result?.status ? result.status.toUpperCase() : 'READY'}
                </span>
                <em>48ms / 14.2MB</em>
              </div>
            </div>

            <div className="console-body">
              <div className="case-tabs">
                {examples.map((example, index) => (
                  <button
                    className={activeCase === index ? 'active' : ''}
                    key={example.input}
                    type="button"
                    onClick={() => setActiveCase(index)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <div className="console-output">
                <p className="console-kicker">&gt; SESSION DEBUGGER</p>
                <div className="console-box">
                  <p><strong>Input:</strong>    {examples[activeCase].input}</p>
                  <p><strong>Output:</strong>   <span>{result?.stdout || examples[activeCase].output}</span></p>
                  <p><strong>Expected:</strong> {examples[activeCase].expected}</p>
                </div>

                <p className="console-kicker">:= STDOUT</p>
                <div className="console-box muted">
                  {message ? (
                    <p>[API] {message}</p>
                  ) : (
                    <>
                      <p>[LOG] Traversing index 0: value=2, complement=7...</p>
                      <p>[LOG] 7 not in map, adding {'{2: 0}'}...</p>
                      <p>[LOG] Traversing index 1: value=7, complement=2...</p>
                      <p>[LOG] Match found. Returning [0, 1].</p>
                    </>
                  )}
                  {result && <p>[SUBMISSION] id={result.id}, status={result.status}, language={result.language}</p>}
                </div>
              </div>
            </div>
          </section>
        </section>
      </section>

      <footer className="ide-statusbar">
        <div>
          <span>[= LOCALHOST</span>
          <span>Latency: 22ms</span>
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
