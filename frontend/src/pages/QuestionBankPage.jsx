import { useEffect, useMemo, useState } from 'react';
import {
  createQuestion,
  createTestCase,
  deleteQuestion,
  deleteTestCase,
  getQuestion,
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

export function QuestionBankPage({ onBackToDashboard, onOpenEditor, onOpenSubmissionHistory }) {
  const { signOut, token, user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
  const [testCaseForm, setTestCaseForm] = useState(emptyTestCaseForm);
  const [testCaseDrafts, setTestCaseDrafts] = useState({});
  const [testCases, setTestCases] = useState([]);
  const [editingTestCaseId, setEditingTestCaseId] = useState(null);
  const [showTestCaseForm, setShowTestCaseForm] = useState(false);
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
      loadQuestionDetail(selectedQuestionId).catch(() => {});
      refreshTestCases(selectedQuestionId).catch(() => {});
    } else {
      setTestCases([]);
      setEditingTestCaseId(null);
      setShowTestCaseForm(false);
    }
  }, [isAdmin, selectedQuestionId]);

  useEffect(() => {
    if (!selectedQuestion) {
      setQuestionForm(emptyQuestionForm);
      return;
    }

    setQuestionForm({
      title: selectedQuestion.title || '',
      description: selectedQuestion.description || '',
      difficulty: selectedQuestion.difficulty || 'easy',
      sampleInput: selectedQuestion.sample_input || '',
      sampleOutput: selectedQuestion.sample_output || '',
    });
  }, [selectedQuestion]);

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

  async function loadQuestionDetail(questionId) {
    const data = await getQuestion(token, questionId);
    setQuestions((current) =>
      current.map((question) => (question.id === questionId ? { ...question, ...data.question } : question))
    );
  }

  function startNewQuestion() {
    setSelectedQuestionId(null);
    setQuestionForm(emptyQuestionForm);
    setTestCaseForm(emptyTestCaseForm);
    setTestCases([]);
    setTestCaseDrafts({});
    setEditingTestCaseId(null);
    setShowTestCaseForm(false);
    setMessage('');
  }

  async function handleOpenSelectedEditor() {
    if (!selectedQuestionId) {
      onOpenEditor?.(null);
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const data = await getQuestion(token, selectedQuestionId);
      setQuestions((current) =>
        current.map((question) => (question.id === selectedQuestionId ? { ...question, ...data.question } : question))
      );
      onOpenEditor?.(data.question);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setStatus('idle');
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

  async function handleSaveQuestion(event) {
    event.preventDefault();

    if (!selectedQuestion) {
      await handleCreateQuestion(event);
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const data = await updateQuestion(token, selectedQuestion.id, questionForm);
      setQuestions((current) =>
        current.map((question) => (question.id === selectedQuestion.id ? data.question : question))
      );
      setMessage('Question updated.');
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

  async function handleCreateTestCase(event) {
    event.preventDefault();

    if (!selectedQuestionId) {
      setMessage('Select a question first.');
      return;
    }

    if (!testCaseForm.expectedOutput.trim()) {
      setMessage('Expected stdout is required before adding a test case.');
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
      setShowTestCaseForm(false);
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
      setEditingTestCaseId((currentId) => (currentId === testCaseId ? null : currentId));
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

    if (!String(draft.expectedOutput || '').trim()) {
      setMessage('Expected stdout is required before saving a test case.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const data = await updateTestCase(token, testCaseId, draft);
      setTestCases((current) => current.map((testCase) => (testCase.id === testCaseId ? data.testCase : testCase)));
      setEditingTestCaseId(null);
      setMessage('Test case updated.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setStatus('idle');
    }
  }

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

          <button
            className="admin-new-problem"
            type="button"
            onClick={startNewQuestion}
          >
            <Icon name="plus" size={16} /> New Problem
          </button>

          <nav className="admin-side-nav" aria-label="Admin navigation">
            <button type="button"><Icon name="terminal" size={16} /> Overview</button>
            <button className="active" type="button"><Icon name="folder" size={16} /> Manage Problems</button>
            <button type="button"><Icon name="settings" size={16} /> Test Cases</button>
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
            <button type="button" onClick={onBackToDashboard}>Dashboard</button>
          </nav>
          <div>
            <button type="button" title="Notifications"><Icon name="bell" size={17} /></button>
            <button type="button" title="Settings"><Icon name="settings" size={17} /></button>
            <button className="admin-avatar" type="button" onClick={signOut} title="Sign out">
              {user?.username?.slice(0, 1)?.toUpperCase() || 'A'}
            </button>
          </div>
        </header>

        <section className="admin-console-content">
          {message && <p className="workspace-message">{message}</p>}

          <section className="admin-manage-grid">
            <aside className="admin-question-index">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">PROBLEM_INDEX</p>
                  <h2>Questions</h2>
                </div>
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

            <section className="admin-manage-main">
          {selectedQuestion ? (
            <article className="question-detail">
              <div className="panel-heading">
                <div>
                  <h2>{selectedQuestion.title}</h2>
                  <p>{selectedQuestion.difficulty}</p>
                </div>
                {isAdmin && (
                  <div className="inline-actions">
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
                <button className="white-action" type="button" onClick={handleOpenSelectedEditor}>
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
                <form className="metadata-form" onSubmit={handleSaveQuestion}>
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
                    <Icon name={selectedQuestion ? 'checkCircle' : 'plus'} size={16} />
                    {selectedQuestion ? 'Save Problem' : 'Create Problem'}
                  </button>
                </form>
              </section>

              <section className="config-panel">
                <div className="config-panel-heading">
                  <span><Icon name="terminal" size={16} /> TEST SUITE DEFINITION</span>
                  <em>{testCases.length} CASES DEFINED</em>
                </div>

                {showTestCaseForm ? (
                  <form className="append-test-case" onSubmit={handleCreateTestCase}>
                    <div className="test-case-form-heading">
                      <strong>New Test Case</strong>
                      <span>Input can be empty; expected stdout is required.</span>
                    </div>
                    <label>
                      <span>INPUT BUFFER</span>
                      <textarea name="input" placeholder="stdin or structured input" value={testCaseForm.input} onChange={updateTestCaseField} />
                    </label>
                    <label>
                      <span>EXPECTED STDOUT</span>
                      <textarea
                        name="expectedOutput"
                        placeholder="expected output for comparison"
                        value={testCaseForm.expectedOutput}
                        onChange={updateTestCaseField}
                      />
                    </label>
                    <div className="test-case-form-controls">
                      <label>
                        <span>SORT</span>
                        <input name="sortOrder" min="0" type="number" value={testCaseForm.sortOrder} onChange={updateTestCaseField} />
                      </label>
                      <label className="switch-row">
                        <input name="isHidden" type="checkbox" checked={testCaseForm.isHidden} onChange={updateTestCaseField} />
                        <span>HIDDEN</span>
                      </label>
                    </div>
                    <div className="test-case-form-actions">
                      <button className="append-button" type="submit" disabled={status === 'loading' || !selectedQuestionId}>
                        <Icon name="plus" size={16} /> APPEND TEST CASE
                      </button>
                      <button
                        className="cancel-case"
                        type="button"
                        onClick={() => {
                          setShowTestCaseForm(false);
                          setTestCaseForm(emptyTestCaseForm);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    className="add-test-case-trigger"
                    type="button"
                    onClick={() => setShowTestCaseForm(true)}
                    disabled={!selectedQuestionId}
                  >
                    <Icon name="plus" size={16} /> Add Test Case
                  </button>
                )}

                <div className="test-suite-list">
                  {testCases.length > 0 && (
                    <div className="test-suite-list-heading">
                      <strong>Existing Test Cases</strong>
                      <span>Edit inline, then press Save.</span>
                    </div>
                  )}
                  {testCases.map((testCase, index) => {
                    const draft = testCaseDrafts[testCase.id] || {};
                    const isEditing = editingTestCaseId === testCase.id;
                    return (
                      <article className="test-suite-item" key={testCase.id}>
                        <strong className="case-index">{String(index + 1).padStart(2, '0')}</strong>
                        {isEditing ? (
                          <>
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
                              <button className="cancel-case" type="button" onClick={() => setEditingTestCaseId(null)}>
                                Cancel
                              </button>
                              <button className="drop-case" type="button" onClick={() => handleDeleteTestCase(testCase.id)}>
                                <Icon name="trash" size={14} /> DROP
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="case-summary-grid">
                              <div>
                                <span>INPUT BUFFER</span>
                                <pre>{draft.input || '(empty input)'}</pre>
                              </div>
                              <div>
                                <span>EXPECTED STDOUT</span>
                                <pre>{draft.expectedOutput || '(missing expected stdout)'}</pre>
                              </div>
                              <div>
                                <span>FLAGS</span>
                                <strong>{draft.isHidden ? 'HIDDEN' : 'VISIBLE'} / SORT {draft.sortOrder ?? 0}</strong>
                              </div>
                            </div>
                            <div className="case-actions readonly">
                              <button className="edit-case" type="button" onClick={() => setEditingTestCaseId(testCase.id)}>
                                Edit Test Case
                              </button>
                            </div>
                          </>
                        )}
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
        </section>
      </section>
    </main>
  );
}
