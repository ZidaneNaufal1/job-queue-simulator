'use strict';

// Deterministic, single-worker simulation. Time is measured in integer ticks.
function simulate(input) {
  if (!input || typeof input !== 'object' || !Array.isArray(input.jobs)) throw new Error('jobs must be an array');
  if (input.jobs.length > 1000) throw new Error('maximum 1000 jobs');
  const policy = input.policy ?? 'fifo';
  if (!['fifo', 'priority'].includes(policy)) throw new Error('policy must be fifo or priority');
  const maxAttempts = integer(input.maxAttempts ?? 3, 'maxAttempts', 1, 10);
  const retryDelay = integer(input.retryDelay ?? 1, 'retryDelay', 1, 1000);
  const agingInterval = integer(input.agingInterval ?? 3, 'agingInterval', 1, 1000);
  const seen = new Set();
  const jobs = input.jobs.map((job, index) => {
    if (!job || typeof job !== 'object' || typeof job.id !== 'string' || !job.id.trim() || job.id.length > 100 || seen.has(job.id)) throw new Error('job ids must be unique non-empty strings up to 100 characters');
    seen.add(job.id);
    return { id: job.id, priority: integer(job.priority ?? 0, 'priority', 0, 10), arrival: integer(job.arrival ?? 0, 'arrival', 0, 100000), failures: integer(job.failures ?? 0, 'failures', 0, 10), attempts: 0, readyAt: job.arrival ?? 0, sequence: index, status: 'pending' };
  });
  let tick = 0; let sequence = jobs.length;
  const events = [];
  while (jobs.some(j => j.status === 'pending')) {
    let available = jobs.filter(j => j.status === 'pending' && j.readyAt <= tick);
    if (!available.length) { tick = Math.min(...jobs.filter(j => j.status === 'pending').map(j => j.readyAt)); continue; }
    available.sort((a, b) => {
      if (policy === 'priority') {
        const score = j => j.priority + Math.floor((tick - j.readyAt) / agingInterval);
        const difference = score(b) - score(a);
        if (difference) return difference;
      }
      return a.readyAt - b.readyAt || a.sequence - b.sequence;
    });
    const job = available[0];
    job.attempts++;
    const failed = job.attempts <= job.failures;
    const outcome = !failed ? 'completed' : job.attempts >= maxAttempts ? 'dead-letter' : 'retry';
    events.push({ tick, id: job.id, attempt: job.attempts, outcome });
    if (outcome === 'retry') { job.readyAt = tick + 1 + retryDelay; job.sequence = sequence++; }
    else job.status = outcome;
    tick++;
  }
  return { policy, elapsedTicks: tick, events, jobs: jobs.map(({ id, attempts, status }) => ({ id, attempts, status })), metrics: { completed: jobs.filter(j => j.status === 'completed').length, deadLetter: jobs.filter(j => j.status === 'dead-letter').length, attempts: events.length, retries: events.filter(e => e.outcome === 'retry').length } };
}
function integer(value, name, min, max) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`${name} must be an integer from ${min} to ${max}`);
  return value;
}
module.exports = { simulate };
