# Job Queue Simulator

A small, deterministic, single-worker simulation for learning how jobs are scheduled and retried. It reads a local JSON scenario and prints a timeline and metrics. **It does not execute jobs, connect to a queue, or process real messages.**

## Requirements and quick start

Node.js 20 or later; no external packages or installation are needed.

```sh
npm test
npm run demo
node cli.js examples/scenario.json
```

Example timeline (the entire output includes each attempt):

```text
Policy: priority | ticks: 7
tick 0: email attempt 1 -> completed
tick 1: report attempt 1 -> retry
```

Create your own JSON input using the example as a template. `jobs` is an array of unique nonempty `id` strings (maximum 1,000 jobs). Each job has optional integer `arrival` (default 0), `priority` (0–10, default 0), and `failures` (0–10, default 0). `failures` specifies how many simulated attempts fail before success; it does not run code. Invalid inputs return an error and nonzero exit status.

## Scheduling model

- Time is a simulated integer tick; every attempt takes one tick. When nothing is ready, time jumps to the next arrival or retry.
- `fifo` selects the earliest ready job, with stable insertion order for ties. `priority` selects the highest effective priority, breaking ties the same way. Effective priority is base priority plus `floor(waiting ticks / agingInterval)`; a retry starts a new waiting period.
- A failed attempt is retried after `retryDelay` full ticks, up to `maxAttempts` total attempts. An exhausted job becomes `dead-letter`; a successful one becomes `completed`.
- Defaults: `policy: "fifo"`, `maxAttempts: 3`, `retryDelay: 1`, `agingInterval: 3`. Configure positive integers in the JSON scenario; retry and aging intervals allow up to 1,000 and attempts up to 10.

Priority aging reduces starvation in this finite, single-worker model; it is not a fairness proof for a real distributed workload. Metrics report attempts, retries, completed and dead-letter counts, plus elapsed simulated ticks including idle time. See `queue.js` for the reusable `simulate` function, which returns structured events and does not mutate its input.

## Limitations

This is an educational discrete simulation, not a production queue: no persistent state, concurrency, networking, job payloads, cancellation, backoff, real-time clock, or delivery guarantees. Input files should be trusted local files. It reads at most a 1 MB scenario after opening the file and limits scenarios to 1,000 jobs. No telemetry or external requests are made.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please describe a reproducible scenario and expected behavior when reporting an issue.

## Provenance

Created for ZidaneNaufal1's learning portfolio with assistance from OpenAI Codex. The owner is responsible for reviewing, understanding, and maintaining the code. Licensed under [MIT](LICENSE).

## Ringkasan Bahasa Indonesia

Simulator ini membantu mempelajari antrean FIFO dan prioritas, percobaan ulang, serta dead-letter tanpa menjalankan pekerjaan sungguhan. Jalankan `npm test` dan `npm run demo` dengan Node.js 20 atau lebih baru. Waktu pada hasil adalah waktu simulasi, bukan waktu nyata.
