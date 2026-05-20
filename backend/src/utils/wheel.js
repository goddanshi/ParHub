export function pickPrizeByProbability(prizes) {
  const active = prizes.filter((p) => p.probability > 0);
  if (!active.length) return null;

  const total = active.reduce((sum, p) => sum + p.probability, 0);
  let random = Math.random() * total;

  for (const prize of active) {
    random -= prize.probability;
    if (random <= 0) return prize;
  }

  return active[active.length - 1];
}
