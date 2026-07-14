import { useEffect, useMemo, useState } from 'react';
import {
  createQuestion,
  createTestCase,
  deleteQuestion,
  deleteTestCase,
  listQuestions,
  listTestCases,
  updateQuestion,
} from '../api/questions';
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

export function QuestionBankPage() {
  const { signOut, token, user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
  const [testCaseForm, setTestCaseForm] = useState(emptyTestCaseForm);
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
      setMessage('Test case deleted.');
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
            </article>
          ) : (
            <div className="question-detail">
              <p className="empty-state">Select or create a question.</p>
            </div>
          )}

          {isAdmin && (
            <section className="admin-grid">
              <form className="admin-form" onSubmit={handleCreateQuestion}>
                <h2>Create question</h2>
                <input name="title" placeholder="Title" value={questionForm.title} onChange={updateQuestionField} />
                <select name="difficulty" value={questionForm.difficulty} onChange={updateQuestionField}>
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
                <textarea name="description" placeholder="Description" value={questionForm.description} onChange={updateQuestionField} />
                <textarea name="sampleInput" placeholder="Sample input" value={questionForm.sampleInput} onChange={updateQuestionField} />
                <textarea name="sampleOutput" placeholder="Sample output" value={questionForm.sampleOutput} onChange={updateQuestionField} />
                <button type="submit" disabled={status === 'loading'}>Create</button>
              </form>

              <form className="admin-form" onSubmit={handleCreateTestCase}>
                <h2>Test cases</h2>
                <textarea name="input" placeholder="Input" value={testCaseForm.input} onChange={updateTestCaseField} />
                <textarea
                  name="expectedOutput"
                  placeholder="Expected output"
                  value={testCaseForm.expectedOutput}
                  onChange={updateTestCaseField}
                />
                <input name="sortOrder" min="0" type="number" value={testCaseForm.sortOrder} onChange={updateTestCaseField} />
                <label className="checkbox-row">
                  <input name="isHidden" type="checkbox" checked={testCaseForm.isHidden} onChange={updateTestCaseField} />
                  Hidden test case
                </label>
                <button type="submit" disabled={status === 'loading' || !selectedQuestionId}>Add test case</button>

                <div className="test-case-list">
                  {testCases.map((testCase) => (
                    <div className="test-case-row" key={testCase.id}>
                      <span>#{testCase.sort_order}</span>
                      <strong>{testCase.is_hidden ? 'hidden' : 'visible'}</strong>
                      <button type="button" onClick={() => handleDeleteTestCase(testCase.id)}>Delete</button>
                    </div>
                  ))}
                  {testCases.length === 0 && <p className="empty-state">No test cases for this question.</p>}
                </div>
              </form>
            </section>
          )}
        </section>
      </section>
    </main>
  );
}
