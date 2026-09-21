import type { GraduationConfiguration, CurveState, VestingConfiguration } from "./types.js";

export function vestedAmount(config: VestingConfiguration, timestamp: number): bigint {
  const cliffEnd = config.startTimestamp + config.cliffSeconds;
  if (timestamp < cliffEnd) return 0n;
  const end = config.startTimestamp + config.durationSeconds;
  if (timestamp >= end) return config.allocation;
  const elapsed = BigInt(timestamp - config.startTimestamp);
  return (config.allocation * elapsed) / BigInt(config.durationSeconds);
}

export function graduationProgress(config: GraduationConfiguration, state: CurveState): number {
  const current = config.condition.type === "quote-reserve" ? state.quoteReserve : state.tokensSold;
  const basisPoints = (current * 10_000n) / config.condition.threshold;
  return Number(basisPoints > 10_000n ? 10_000n : basisPoints) / 100;
}
