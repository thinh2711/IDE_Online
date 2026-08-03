const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { normalizeJudge0Status } = require('../src/modules/submissions/judge0.client');

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
