import { useEffect, useMemo, useState } from 'react';
import {
  createQuestion,
  createTestCase,
  deleteQuestion,
  deleteTestCase,
  listQuestions,
  listTestCases,
  updateQuestion,
  updateTestCase,
} from '../api/questions';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';

const emptyQuestionForm = {
  title: '',
  description: '',
  difficulty: 'easy',
  sampleInput: '',
  sampleOutput: '',
};

const emptyTestCaseForm = {
  input: '',
  expectedOutput: '',
  isHidden: true,
  sortOrder: 0,
};

export function QuestionBankPage({ onBackToDashboard, onOpenEditor }) {
  const { signOut, token, user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
  const [testCaseForm, setTestCaseForm] = useState(emptyTestCaseForm);
  const [testCaseDrafts, setTestCaseDrafts] = useState({});
  const [testCases, setTestCases] = useState([]);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const isAdmin = user?.role === 'admin';
  const selectedQuestion = useMemo(
    () => questions.find((question) => question.id === selectedQuestionId) || null,
    [questions, selectedQuestionId]
  );

  useEffect(() => {
    refreshQuestions().catch(() => {});
  }, []);

  useEffect(() => {
    if (isAdmin && selectedQuestionId) {
      refreshTestCases(selectedQuestionId).catch(() => {});
    } else {
      setTestCases([]);
    }
  }, [isAdmin, selectedQuestionId]);

  async function refreshQuestions() {
    setStatus('loading');
    setMessage('');

    try {
      const data = await listQuestions(token);
      setQuestions(data.questions || []);
      setSelectedQuestionId((currentId) => currentId || data.questions?.[0]?.id || null);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setStatus('idle');
    }
  }

  async function refreshTestCases(questionId) {
    try {
      const data = await listTestCases(token, questionId);
      setTestCases(data.testCases || []);
      setTestCaseDrafts(
        Object.fromEntries(
          (data.testCases || []).map((testCase) => [
            testCase.id,
            {
              input: testCase.input || '',
              expectedOutput: testCase.expected_output || '',
              isHidden: testCase.is_hidden,
              sortOrder: testCase.sort_order,
            },
          ])
        )
      );
    } catch (error) {
      setMessage(error.message);
    }
  }

  function updateQuestionField(event) {
    setQuestionForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function updateTestCaseField(event) {
    const { checked, name, type, value } = event.target;
    setTestCaseForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function updateTestCaseDraft(testCaseId, field, value) {
    setTestCaseDrafts((current) => ({
      ...current,
      [testCaseId]: {
        ...current[testCaseId],
        [field]: value,
      },
    }));
  }

  async function handleCreateQuestion(event) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const data = await createQuestion(token, questionForm);
      setQuestions((current) => [data.question, ...current]);
      setSelectedQuestionId(data.question.id);
      setQuestionForm(emptyQuestionForm);
      setMessage('Question created.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setStatus('idle');
    }
  }

  async function handleDeleteQuestion(questionId) {
    setStatus('loading');
    setMessage('');

    try {
      await deleteQuestion(token, questionId);
      setQuestions((current) => current.filter((question) => question.id !== questionId));
      setSelectedQuestionId((currentId) => (currentId === questionId ? null : currentId));
      setMessage('Question deleted.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setStatus('idle');
    }
  }

  async function handleDifficultyChange(question, difficulty) {
    setStatus('loading');
    setMessage('');

    try {
      const data = await updateQuestion(token, question.id, {
        title: question.title,
        description: question.description,
        difficulty,
        sampleInput: question.sample_input || '',
        sampleOutput: question.sample_output || '',
      });
      setQuestions((current) => current.map((item) => (item.id === question.id ? data.question : item)));
      setMessage('Question updated.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setStatus('idle');
    }
  }

  async function handleCreateTestCase(event) {
    event.preventDefault();

    if (!selectedQuestionId) {
      setMessage('Select a question first.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const data = await createTestCase(token, selectedQuestionId, testCaseForm);
      setTestCases((current) => [...current, data.testCase]);
      setTestCaseDrafts((current) => ({
        ...current,
        [data.testCase.id]: {
          input: data.testCase.input || '',
          expectedOutput: data.testCase.expected_output || '',
          isHidden: data.testCase.is_hidden,
          sortOrder: data.testCase.sort_order,
        },
      }));
      setTestCaseForm(emptyTestCaseForm);
      setMessage('Test case created.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setStatus('idle');
    }
  }

  async function handleDeleteTestCase(testCaseId) {
    setStatus('loading');
    setMessage('');

    try {
      await deleteTestCase(token, testCaseId);
      setTestCases((current) => current.filter((testCase) => testCase.id !== testCaseId));
      setTestCaseDrafts((current) => {
        const next = { ...current };
        delete next[testCaseId];
        return next;
      });
      setMessage('Test case deleted.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setStatus('idle');
    }
  }

  async function handleUpdateTestCase(testCaseId) {
    const draft = testCaseDrafts[testCaseId];
    if (!draft) return;

    setStatus('loading');
    setMessage('');

    try {
      const data = await updateTestCase(token, testCaseId, draft);
      setTestCases((current) => current.map((testCase) => (testCase.id === testCaseId ? data.testCase : testCase)));
      setMessage('Test case updated.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setStatus('idle');
    }
  }

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">WEB IDE</p>
          <h1>Question Bank</h1>
        </div>
        <div className="workspace-user">
          <button type="button" onClick={onBackToDashboard}>Dashboard</button>
          <span>{user?.username}</span>
          <strong>{user?.role}</strong>
          <button type="button" onClick={signOut}>Sign out</button>
        </div>
      </header>

      {message && <p className="workspace-message">{message}</p>}

      <section className="question-layout">
        <aside className="question-sidebar">
          <div className="panel-heading">
            <h2>Questions</h2>
            <button type="button" onClick={refreshQuestions} disabled={status === 'loading'}>Refresh</button>
          </div>

          <div className="question-list">
            {questions.map((question) => (
              <button
                className={question.id === selectedQuestionId ? 'question-row active' : 'question-row'}
                key={question.id}
                type="button"
                onClick={() => setSelectedQuestionId(question.id)}
              >
                <span>{question.title}</span>
                <em>{question.difficulty}</em>
              </button>
            ))}
            {questions.length === 0 && <p className="empty-state">No questions yet.</p>}
          </div>
        </aside>

        <section className="question-main">
          {selectedQuestion ? (
            <article className="question-detail">
              <div className="panel-heading">
                <div>
                  <h2>{selectedQuestion.title}</h2>
                  <p>{selectedQuestion.difficulty}</p>
                </div>
                {isAdmin && (
                  <div className="inline-actions">
                    <select
                      value={selectedQuestion.difficulty}
                      onChange={(event) => handleDifficultyChange(selectedQuestion, event.target.value)}
                    >
                      <option value="easy">easy</option>
                      <option value="medium">medium</option>
                      <option value="hard">hard</option>
                    </select>
                    <button type="button" onClick={() => handleDeleteQuestion(selectedQuestion.id)}>Delete</button>
                  </div>
                )}
              </div>
              <p className="description">{selectedQuestion.description}</p>
              <div className="sample-grid">
                <div>
                  <span>Sample input</span>
                  <pre>{selectedQuestion.sample_input || '(empty)'}</pre>
                </div>
                <div>
                  <span>Sample output</span>
                  <pre>{selectedQuestion.sample_output || '(empty)'}</pre>
                </div>
              </div>
              <div className="solve-actions">
                <button className="white-action" type="button" onClick={() => onOpenEditor?.(selectedQuestion)}>
                  <Icon name="play" size={15} /> Open IDE Workspace
                </button>
              </div>
            </article>
          ) : (
            <div className="question-detail">
              <p className="empty-state">Select or create a question.</p>
            </div>
          )}

          {isAdmin && (
            <section className="problem-config">
              <div className="problem-config-header">
                <div>
                  <p className="eyebrow">SYSTEM // CHALLENGE_CREATOR</p>
                  <h2>Problem Configuration</h2>
                </div>
                <button className="white-action" type="button" onClick={refreshQuestions} disabled={status === 'loading'}>
                  Refresh Bank
                </button>
              </div>

              <section className="config-panel">
                <div className="config-panel-heading">
                  <span><Icon name="settings" size={16} /> METADATA CONFIGURATION</span>
                </div>
                <form className="metadata-form" onSubmit={handleCreateQuestion}>
                  <label className="field-block title-field">
                    <span>Problem Title</span>
                    <input name="title" placeholder="e.g. Optimized Red-Black Tree Implementation" value={questionForm.title} onChange={updateQuestionField} />
                  </label>
                  <label className="field-block">
                    <span>Difficulty Level</span>
                    <select name="difficulty" value={questionForm.difficulty} onChange={updateQuestionField}>
                      <option value="easy">EASY - L1</option>
                      <option value="medium">MEDIUM - L2</option>
                      <option value="hard">HARD - L3</option>
                    </select>
                  </label>
                  <div className="audit-box">
                    <div><span>AUTOMATIC_AUDIT</span><strong>READY</strong></div>
                    <div><span>Complexity Check</span><strong className="valid">VALID</strong></div>
                    <div><span>Memory Limit</span><strong>256 MB</strong></div>
                  </div>
                  <label className="field-block wide-field">
                    <span>Technical Description</span>
                    <textarea name="description" placeholder="Detailed constraints, edge cases, and performance requirements..." value={questionForm.description} onChange={updateQuestionField} />
                  </label>
                  <label className="field-block">
                    <span>Sample Input</span>
                    <textarea name="sampleInput" placeholder="stdin visible to coder" value={questionForm.sampleInput} onChange={updateQuestionField} />
                  </label>
                  <label className="field-block">
                    <span>Sample Output</span>
                    <textarea name="sampleOutput" placeholder="expected stdout sample" value={questionForm.sampleOutput} onChange={updateQuestionField} />
                  </label>
                  <button className="white-action wide-field" type="submit" disabled={status === 'loading'}>
                    <Icon name="plus" size={16} /> New Problem
                  </button>
                </form>
              </section>

              <section className="config-panel">
                <div className="config-panel-heading">
                  <span><Icon name="terminal" size={16} /> TEST SUITE DEFINITION</span>
                  <em>{testCases.length} CASES DEFINED</em>
                </div>

                <form className="append-test-case" onSubmit={handleCreateTestCase}>
                  <textarea name="input" placeholder="INPUT BUFFER" value={testCaseForm.input} onChange={updateTestCaseField} />
                  <textarea
                    name="expectedOutput"
                    placeholder="EXPECTED STDOUT"
                    value={testCaseForm.expectedOutput}
                    onChange={updateTestCaseField}
                  />
                  <input name="sortOrder" min="0" type="number" value={testCaseForm.sortOrder} onChange={updateTestCaseField} />
                  <label className="switch-row">
                    <input name="isHidden" type="checkbox" checked={testCaseForm.isHidden} onChange={updateTestCaseField} />
                    <span>HIDDEN</span>
                  </label>
                  <button className="append-button" type="submit" disabled={status === 'loading' || !selectedQuestionId}>
                    <Icon name="plus" size={16} /> APPEND TEST CASE
                  </button>
                </form>

                <div className="test-suite-list">
                  {testCases.map((testCase, index) => {
                    const draft = testCaseDrafts[testCase.id] || {};
                    return (
                      <article className="test-suite-item" key={testCase.id}>
                        <strong className="case-index">{String(index + 1).padStart(2, '0')}</strong>
                        <div className="case-buffer-grid">
                          <label>
                            <span>INPUT BUFFER</span>
                            <textarea
                              value={draft.input || ''}
                              onChange={(event) => updateTestCaseDraft(testCase.id, 'input', event.target.value)}
                            />
                          </label>
                          <label>
                            <span>EXPECTED STDOUT</span>
                            <textarea
                              value={draft.expectedOutput || ''}
                              onChange={(event) => updateTestCaseDraft(testCase.id, 'expectedOutput', event.target.value)}
                            />
                          </label>
                        </div>
                        <div className="case-actions">
                          <input
                            aria-label="Sort order"
                            min="0"
                            type="number"
                            value={draft.sortOrder ?? 0}
                            onChange={(event) => updateTestCaseDraft(testCase.id, 'sortOrder', event.target.value)}
                          />
                          <label className="switch-row compact">
                            <input
                              type="checkbox"
                              checked={Boolean(draft.isHidden)}
                              onChange={(event) => updateTestCaseDraft(testCase.id, 'isHidden', event.target.checked)}
                            />
                            <span>HIDDEN</span>
                          </label>
                          <button className="save-case" type="button" onClick={() => handleUpdateTestCase(testCase.id)} disabled={status === 'loading'}>
                            Save
                          </button>
                          <button className="drop-case" type="button" onClick={() => handleDeleteTestCase(testCase.id)}>
                            <Icon name="trash" size={14} /> DROP
                          </button>
                        </div>
                      </article>
                    );
                  })}
                  {testCases.length === 0 && <p className="empty-state">No test cases for this question.</p>}
                </div>
              </section>

              <section className="spec-grid">
                <div className="spec-card">
                  <h3>SECURITY SANDBOX</h3>
                  <p><span>Process Isolation</span><strong>Judge0</strong></p>
                  <p><span>Network Egress</span><strong className="danger">DISABLED</strong></p>
                  <p><span>Hidden Cases</span><strong>MASKED</strong></p>
                </div>
                <div className="spec-card">
                  <h3>EXECUTION LIMITS</h3>
                  <p><span>CPU Time</span><strong>10s</strong></p>
                  <p><span>Wall Timeout</span><strong>15s</strong></p>
                  <p><span>Memory Limit</span><strong>256 MB</strong></p>
                </div>
              </section>
            </section>
          )}
        </section>
      </section>
    </main>
  );
}
