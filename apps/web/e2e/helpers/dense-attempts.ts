export const DENSE_ATTEMPT_PROTOCOL = "continue-and-fail-v1";

export type DenseSampleIdentity = {
  arm: "baseline" | "candidate";
  pair: number;
  cpuRate: number;
  sample: string;
};

export type DenseAttempt = DenseSampleIdentity & {
  status: "pending" | "passed" | "failed";
  error?: string;
};

type Outcome<T> = DenseSampleIdentity &
  ({ status: "passed"; result: T } | { status: "failed"; error: string });

export function createDenseAttempts(options: {
  pairs: number;
  rates: number[];
  candidateFirst?: boolean;
}): DenseAttempt[] {
  if (!Number.isInteger(options.pairs) || options.pairs < 1)
    throw new Error("Pair count must be a positive integer");
  if (
    !options.rates.length ||
    options.rates.some((rate) => !Number.isFinite(rate) || rate < 1) ||
    new Set(options.rates).size !== options.rates.length
  )
    throw new Error("CPU rates must be unique finite values of at least one");
  const attempts: DenseAttempt[] = [];
  for (const cpuRate of options.rates)
    for (let pair = 0; pair < options.pairs; pair++) {
      const first = (pair % 2 === 0) !== Boolean(options.candidateFirst);
      const order = first
        ? (["baseline", "candidate"] as const)
        : (["candidate", "baseline"] as const);
      for (const arm of order)
        attempts.push({
          arm,
          pair,
          cpuRate,
          sample: `${arm}-${cpuRate}x-${pair}`,
          status: "pending",
        });
    }
  return attempts;
}

export async function runDenseAttempts<T>(
  attempts: DenseAttempt[],
  run: (attempt: DenseSampleIdentity) => Promise<T>,
  record: (outcome: Outcome<T>) => void | Promise<void>,
) {
  const failures: Array<{ sample: string; error: string }> = [];
  for (const attempt of attempts) {
    if (attempt.status !== "pending") throw new Error("Attempt is already complete");
    const { arm, pair, cpuRate, sample } = attempt;
    let outcome: Outcome<T>;
    try {
      const result = await run({ arm, pair, cpuRate, sample });
      outcome = { arm, pair, cpuRate, sample, status: "passed", result };
    } catch (error) {
      const message = String(error);
      failures.push({ sample, error: message });
      outcome = { arm, pair, cpuRate, sample, status: "failed", error: message };
    }
    await record(outcome);
  }
  if (failures.length)
    throw new AggregateError(
      failures.map((failure) => new Error(`${failure.sample}: ${failure.error}`)),
      `${failures.length} dense samples failed: ${failures.map((failure) => failure.sample).join(", ")}`,
    );
}

export function recordDenseAttempt<T extends DenseSampleIdentity>(
  report: { attempts: DenseAttempt[]; samples: unknown[]; error?: string },
  outcome: Outcome<T>,
) {
  const { arm, pair, cpuRate, sample } = outcome;
  const index = report.attempts.findIndex((attempt) => attempt.sample === sample);
  const previous = report.attempts[index];
  if (!previous || previous.arm !== arm || previous.pair !== pair || previous.cpuRate !== cpuRate)
    throw new Error("Attempt identity does not match the plan");
  if (previous.status !== "pending") throw new Error("Attempt is already complete");
  if (outcome.status === "failed") {
    report.attempts[index] = { arm, pair, cpuRate, sample, status: "failed", error: outcome.error };
    report.error ??= `${sample}: ${outcome.error}`;
    return;
  }
  const result = outcome.result;
  if (
    result.arm !== arm ||
    result.pair !== pair ||
    result.cpuRate !== cpuRate ||
    result.sample !== sample
  )
    throw new Error("Result identity does not match the attempt");
  report.attempts[index] = { arm, pair, cpuRate, sample, status: "passed" };
  report.samples.push(result);
}
