#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const { simulate } = require('./queue');
if (process.argv.length !== 3 || ['-h', '--help'].includes(process.argv[2])) {
  console.log('Usage: node cli.js scenario.json\nSimulate a local single-worker queue; no jobs are executed.');
  process.exit(process.argv.length === 3 ? 0 : 2);
}
try {
  const input = fs.readFileSync(process.argv[2], 'utf8');
  if (Buffer.byteLength(input, 'utf8') > 1_000_000) throw new Error('scenario exceeds 1 MB');
  const result = simulate(JSON.parse(input));
  console.log(`Policy: ${result.policy} | ticks: ${result.elapsedTicks}`);
  for (const event of result.events) console.log(`tick ${event.tick}: ${event.id} attempt ${event.attempt} -> ${event.outcome}`);
  console.log(`Completed: ${result.metrics.completed} | Dead-letter: ${result.metrics.deadLetter} | Attempts: ${result.metrics.attempts} | Retries: ${result.metrics.retries}`);
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
