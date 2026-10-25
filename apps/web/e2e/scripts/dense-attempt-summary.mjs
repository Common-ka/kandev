function validatePlan(plan) {
  if (
    !plan ||
    !Number.isInteger(plan.pairs) ||
    plan.pairs < 1 ||
    !Array.isArray(plan.rates) ||
    !plan.rates.length ||
    plan.rates.some((rate) => !Number.isFinite(rate) || rate < 1) ||
    new Set(plan.rates).size !== plan.rates.length ||
    typeof plan.candidateFirst !== "boolean"
  )
    throw new Error("Invalid dense attempt plan");
}

function expectedAttempts(plan) {
  const expected = [];
  for (const cpuRate of plan.rates)
    for (let pair = 0; pair < plan.pairs; pair++) {
      const first = (pair % 2 === 0) !== plan.candidateFirst;
      const order = first ? ["baseline", "candidate"] : ["candidate", "baseline"];
      for (const arm of order)
        expected.push({ arm, pair, cpuRate, sample: `${arm}-${cpuRate}x-${pair}` });
    }
  return expected;
}

function validateCompletedAttempt(identity, attempt, sample) {
  const matches = (value, identity) =>
    value && Object.entries(identity).every(([key, expectedValue]) => value[key] === expectedValue);
  if (
    !matches(attempt, identity) ||
    attempt.status !== "passed" ||
    attempt.error !== undefined ||
    !matches(sample, identity)
  )
    throw new Error("Failed, unfinished or mismatched dense attempt");
}

export function validateDenseAttempts(report) {
  if (
    report.attemptProtocol === undefined &&
    report.attempts === undefined &&
    report.comparisonPlan === undefined
  )
    return;
  if (report.attemptProtocol !== "continue-and-fail-v1" || !Array.isArray(report.attempts))
    throw new Error("Invalid dense attempt protocol");
  const plan = report.comparisonPlan;
  validatePlan(plan);
  if (report.candidateFirst !== undefined && report.candidateFirst !== plan.candidateFirst)
    throw new Error("Invalid dense attempt order");
  const expected = expectedAttempts(plan);
  if (report.attempts.length !== expected.length || report.samples.length !== expected.length)
    throw new Error("Incomplete dense attempts");
  for (const [index, identity] of expected.entries())
    validateCompletedAttempt(identity, report.attempts[index], report.samples[index]);
}
