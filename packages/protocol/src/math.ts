import { BPS_DENOMINATOR } from "./types.js";
import type { CurveConfiguration, CurveState, FeeConfiguration, TradeQuote } from "./types.js";
import { LoomPadError } from "./errors.js";

function feeFor(amount: bigint, basisPoints: number): bigint {
  return (amount * BigInt(basisPoints) + BigInt(BPS_DENOMINATOR - 1)) / BigInt(BPS_DENOMINATOR);
}

export function splitFee(totalFee: bigint, configuration: FeeConfiguration): readonly bigint[] {
  let distributed = 0n;
  return configuration.recipients.map((recipient, index) => {
    if (index === configuration.recipients.length - 1) return totalFee - distributed;
    const share = (totalFee * BigInt(recipient.basisPoints)) / BigInt(BPS_DENOMINATOR);
    distributed += share;
    return share;
  });
}

export function quoteConstantProductBuy(
  state: CurveState,
  quoteAmount: bigint,
  fees: FeeConfiguration,
  slippageBasisPoints = 100
): TradeQuote {
  if (quoteAmount <= 0n || state.graduated) {
    throw new LoomPadError(
      "INSUFFICIENT_LIQUIDITY",
      "trade amount must be positive and market must be active"
    );
  }
  const fee = feeFor(quoteAmount, fees.tradeFeeBasisPoints);
  const net = quoteAmount - fee;
  const invariant = state.tokenReserve * state.quoteReserve;
  const nextQuoteReserve = state.quoteReserve + net;
  const nextTokenReserve = invariant / nextQuoteReserve;
  const amountOut = state.tokenReserve - nextTokenReserve;
  if (amountOut <= 0n || amountOut >= state.tokenReserve) {
    throw new LoomPadError(
      "INSUFFICIENT_LIQUIDITY",
      "trade would exhaust or round to zero liquidity"
    );
  }
  const spotOut = (net * state.tokenReserve) / state.quoteReserve;
  const impact = spotOut === 0n ? 0 : Number(((spotOut - amountOut) * 10_000n) / spotOut);
  return {
    side: "buy",
    amountIn: quoteAmount,
    amountOut,
    fee,
    minimumAmountOut: (amountOut * BigInt(10_000 - slippageBasisPoints)) / 10_000n,
    priceImpactBasisPoints: Math.max(0, impact)
  };
}

export function quoteBuy(
  curve: CurveConfiguration,
  state: CurveState,
  quoteAmount: bigint,
  fees: FeeConfiguration,
  slippageBasisPoints = 100
): TradeQuote {
  if (
    !Number.isInteger(slippageBasisPoints) ||
    slippageBasisPoints < 0 ||
    slippageBasisPoints > 5_000
  ) {
    throw new LoomPadError(
      "SLIPPAGE_EXCEEDED",
      "slippage tolerance must be between 0 and 5,000 basis points"
    );
  }
  if (curve.type === "constant-product") {
    return quoteConstantProductBuy(state, quoteAmount, fees, slippageBasisPoints);
  }
  const fee = feeFor(quoteAmount, fees.tradeFeeBasisPoints);
  const net = quoteAmount - fee;
  const currentPrice = curve.initialPrice + curve.slope * state.tokensSold;
  const amountOut = net / currentPrice;
  if (amountOut <= 0n || amountOut >= state.tokenReserve) {
    throw new LoomPadError(
      "INSUFFICIENT_LIQUIDITY",
      "trade would exhaust or round to zero liquidity"
    );
  }
  return {
    side: "buy",
    amountIn: quoteAmount,
    amountOut,
    fee,
    minimumAmountOut: (amountOut * BigInt(10_000 - slippageBasisPoints)) / 10_000n,
    priceImpactBasisPoints: Number((curve.slope * amountOut * 10_000n) / currentPrice)
  };
}
