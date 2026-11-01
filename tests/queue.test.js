'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { simulate } = require('../queue');

test('FIFO uses arrival then stable insertion order', () => {
  const result = simulate({ jobs: [{ id: 'late', arrival: 4 }, { id: 'a' }, { id: 'b' }] });
  assert.deepEqual(result.events.map(e => [e.tick, e.id]), [[0, 'a'], [1, 'b'], [4, 'late']]);
});
test('priority selects higher priority and keeps stable ties', () => {
  const result = simulate({ policy: 'priority', jobs: [{ id: 'low' }, { id: 'high', priority: 5 }, { id: 'high2', priority: 5 }] });
  assert.deepEqual(result.events.map(e => e.id), ['high', 'high2', 'low']);
});
test('aging eventually raises a waiting job above later arrivals', () => {
  const jobs = [{ id: 'low', priority: 0 }, ...Array.from({ length: 12 }, (_, i) => ({ id: `high${i}`, priority: 2, arrival: i }))];
  const result = simulate({ policy: 'priority', agingInterval: 2, jobs });
  assert.ok(result.events.findIndex(e => e.id === 'low') < 12);
});
test('retry happens only after delay and stops on success', () => {
  const r = simulate({ retryDelay: 2, jobs: [{ id: 'a', failures: 1 }, { id: 'b' }] });
  assert.deepEqual(r.events.map(e => [e.tick, e.id, e.outcome]), [[0, 'a', 'retry'], [1, 'b', 'completed'], [3, 'a', 'completed']]);
  assert.equal(r.metrics.retries, 1);
});
test('exhausted job enters dead-letter exactly at attempt limit', () => {
  const r = simulate({ maxAttempts: 2, jobs: [{ id: 'x', failures: 10 }] });
  assert.deepEqual(r.jobs, [{ id: 'x', attempts: 2, status: 'dead-letter' }]);
  assert.equal(r.metrics.deadLetter, 1);
});
test('simulation is deterministic and does not mutate input', () => {
  const input = { jobs: [{ id: 'x', failures: 1 }] }; const original = structuredClone(input);
  assert.deepEqual(simulate(input), simulate(input)); assert.deepEqual(input, original);
});
test('invalid input and duplicate identifiers are rejected', () => {
  for (const input of [{}, { jobs: [{ id: 'x' }, { id: 'x' }] }, { jobs: [{ id: 'x', arrival: -1 }] }, { jobs: [], maxAttempts: 0 }, { jobs: [], policy: 'random' }]) assert.throws(() => simulate(input));
});
