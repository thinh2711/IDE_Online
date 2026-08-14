const assert = require('node:assert/strict');
const { afterEach, describe, it, mock } = require('node:test');

const { normalizeJudge0Status, runCode } = require('../src/modules/submissions/judge0.client');

afterEach(() => {
  mock.restoreAll();
});

describe('Group 1: Judge0 status normalization', () => {
  it('Test 1: maps known Judge0 statuses to app statuses', () => {
    assert.equal(normalizeJudge0Status({ id: 1, description: 'In Queue' }), 'queued');
    assert.equal(normalizeJudge0Status({ id: 2, description: 'Processing' }), 'processing');
    assert.equal(normalizeJudge0Status({ id: 3, description: 'Accepted' }), 'accepted');
    assert.equal(normalizeJudge0Status({ id: 4, description: 'Wrong Answer' }), 'wrong_answer');
    assert.equal(normalizeJudge0Status({ id: 5, description: 'Time Limit Exceeded' }), 'time_limit_exceeded');
    assert.equal(normalizeJudge0Status({ id: 6, description: 'Compilation Error' }), 'compilation_error');
    assert.equal(normalizeJudge0Status({ id: 7, description: 'Runtime Error (SIGSEGV)' }), 'runtime_error');
    assert.equal(normalizeJudge0Status({ id: 13, description: 'Internal Error' }), 'judge_error');
  });

  it('Test 2: falls back to description or unknown when id is missing', () => {
    assert.equal(normalizeJudge0Status({ description: 'Accepted' }), 'accepted');
    assert.equal(normalizeJudge0Status({ description: 'Compilation Error' }), 'compilation_error');
    assert.equal(normalizeJudge0Status({ description: 'Something New' }), 'unknown');
  });
});

describe('Group 2: Judge0 friendly errors', () => {
  it('Test 1: maps network failures to JUDGE0_UNAVAILABLE', async () => {
    mock.method(globalThis, 'fetch', async () => {
      throw new TypeError('fetch failed');
    });

    await assert.rejects(
      runCode({
        language: 'python',
        sourceCode: "print('hello')",
        stdin: '',
      }),
      {
        code: 'JUDGE0_UNAVAILABLE',
        message: 'Code runner is temporarily unavailable',
        statusCode: 502,
      }
    );
  });

  it('Test 2: hides raw upstream errors behind a friendly message', async () => {
    mock.method(globalThis, 'fetch', async () => ({
      json: async () => ({ message: 'executor internal stack trace' }),
      ok: false,
      status: 500,
    }));

    await assert.rejects(
      runCode({
        language: 'python',
        sourceCode: "print('hello')",
        stdin: '',
      }),
      {
        code: 'JUDGE0_UNAVAILABLE',
        message: 'Code runner is temporarily unavailable',
        statusCode: 502,
      }
    );
  });
});

describe('Group 3: Judge0 Base64 transport', () => {
  it('Test 1: sends encoded source/stdin and decodes execution output', async () => {
    let requestPath = '';
    let requestBody = null;

    mock.method(globalThis, 'fetch', async (url, options) => {
      requestPath = url;
      requestBody = JSON.parse(options.body);

      return {
        json: async () => ({
          memory: 8000,
          status: {
            description: 'Accepted',
            id: 3,
          },
          stderr: null,
          stdout: Buffer.from('ok\n', 'utf8').toString('base64'),
          time: '0.01',
        }),
        ok: true,
        status: 200,
      };
    });

    const result = await runCode({
      language: 'python',
      sourceCode: 'print("ok")',
      stdin: 'input',
    });

    assert.match(requestPath, /base64_encoded=true/);
    assert.equal(requestBody.source_code, Buffer.from('print("ok")', 'utf8').toString('base64'));
    assert.equal(requestBody.stdin, Buffer.from('input', 'utf8').toString('base64'));
    assert.equal(result.payload.source_code, 'print("ok")');
    assert.equal(result.result.stdout, 'ok\n');
    assert.equal(result.status, 'accepted');
  });
});
