import { describe, expect, it } from "vitest";
import {
  graduationProgress,
  quoteBuy,
  splitFee,
  validateFeeConfiguration,
  validateManifest,
  vestedAmount
} from "./index.js";
import type { FeeConfiguration, LaunchManifest } from "./index.js";

const fees: FeeConfiguration = {
  tradeFeeBasisPoints: 100,
  recipients: [
    { address: "11111111111111111111111111111111", basisPoints: 7_000 },
    { address: "So11111111111111111111111111111111111111112", basisPoints: 3_000 }
  ]
};

const validManifest: LaunchManifest = {
  version: "1.0.0",
  launch: "11111111111111111111111111111111",
  mint: "So11111111111111111111111111111111111111112",
  creator: "Vote111111111111111111111111111111111111111",
  createdAt: 1_789_952_400,
  token: { name: "LoomPad", symbol: "LOOM", uri: "https://example.com/token.json", decimals: 9 },
  totalSupply: 1_000_000n,
  creatorAllocation: 100_000n,
  curve: { type: "constant-product", virtualTokenReserve: 900_000n, virtualQuoteReserve: 100_000n },
  fees,
  vesting: { allocation: 100_000n, startTimestamp: 100, cliffSeconds: 10, durationSeconds: 100 },
  graduation: {
    condition: { type: "tokens-sold", threshold: 800_000n },
    adapter: "Stake11111111111111111111111111111111111111"
  },
  authorities: { mintAuthority: null, freezeAuthority: null, updateAuthority: null },
  security: { configurationMutable: false, migrationAdapterAllowlisted: true },
  socials: { website: "https://example.com" },
  modules: ["curve", "vesting"]
};

describe("protocol invariants", () => {
  it("rejects fee routes that do not sum to 100%", () => {
    expect(() =>
      validateFeeConfiguration({
        ...fees,
        recipients: [{ ...fees.recipients[0]!, basisPoints: 9_999 }]
      })
    ).toThrow(/10,000/);
  });

  it("accepts a complete, immutable manifest", () => {
    expect(() => validateManifest(validManifest)).not.toThrow();
  });

  it.each([
    ["invalid symbol", { token: { ...validManifest.token, symbol: "bad-symbol" } }],
    ["unsafe metadata URI", { token: { ...validManifest.token, uri: "javascript:alert(1)" } }],
    ["impossible supply", { creatorAllocation: 2_000_000n }],
    ["mutable security", { security: { ...validManifest.security, configurationMutable: true } }],
    ["bad social URL", { socials: { website: "http://example.com" } }],
    [
      "zero curve reserve",
      {
        curve: {
          type: "constant-product" as const,
          virtualTokenReserve: 0n,
          virtualQuoteReserve: 1n
        }
      }
    ],
    ["invalid vesting", { vesting: { ...validManifest.vesting!, durationSeconds: 0 } }],
    [
      "zero graduation",
      {
        graduation: {
          ...validManifest.graduation,
          condition: { type: "tokens-sold" as const, threshold: 0n }
        }
      }
    ]
  ])("rejects %s", (_name, override) => {
    expect(() => validateManifest({ ...validManifest, ...override })).toThrow();
  });

  it("preserves every fee unit when routing rounding dust", () => {
    const shares = splitFee(101n, fees);
    expect(shares).toEqual([70n, 31n]);
    expect(shares.reduce((sum, value) => sum + value, 0n)).toBe(101n);
  });

  it("quotes a constant-product buy with fees and slippage protection", () => {
    const quote = quoteBuy(
      { type: "constant-product", virtualTokenReserve: 1_000_000n, virtualQuoteReserve: 100_000n },
      { tokenReserve: 1_000_000n, quoteReserve: 100_000n, tokensSold: 0n, graduated: false },
      10_000n,
      fees,
      100
    );
    expect(quote.fee).toBe(100n);
    expect(quote.amountOut).toBeGreaterThan(0n);
    expect(quote.minimumAmountOut).toBeLessThan(quote.amountOut);
  });

  it("quotes a linear buy", () => {
    const quote = quoteBuy(
      { type: "linear", initialPrice: 10n, slope: 1n },
      { tokenReserve: 10_000n, quoteReserve: 0n, tokensSold: 2n, graduated: false },
      1_000n,
      fees,
      50
    );
    expect(quote.amountOut).toBe(82n);
    expect(quote.minimumAmountOut).toBe(81n);
  });

  it("rejects inactive, zero, exhausted, and excessive-slippage quotes", () => {
    const curve = {
      type: "constant-product" as const,
      virtualTokenReserve: 100n,
      virtualQuoteReserve: 100n
    };
    const active = { tokenReserve: 100n, quoteReserve: 100n, tokensSold: 0n, graduated: false };
    expect(() => quoteBuy(curve, active, 0n, fees)).toThrow(/positive/);
    expect(() => quoteBuy(curve, { ...active, graduated: true }, 1n, fees)).toThrow(/active/);
    expect(() => quoteBuy(curve, active, 1n, fees, 5_001)).toThrow(/slippage/);
  });

  it("enforces the vesting cliff and linear unlock", () => {
    const config = {
      allocation: 1_000n,
      startTimestamp: 100,
      cliffSeconds: 20,
      durationSeconds: 100
    };
    expect(vestedAmount(config, 119)).toBe(0n);
    expect(vestedAmount(config, 150)).toBe(500n);
    expect(vestedAmount(config, 250)).toBe(1_000n);
  });

  it("caps graduation progress at 100 percent", () => {
    expect(
      graduationProgress(
        {
          condition: { type: "tokens-sold", threshold: 500n },
          adapter: "11111111111111111111111111111111"
        },
        { tokenReserve: 0n, quoteReserve: 0n, tokensSold: 750n, graduated: false }
      )
    ).toBe(100);
  });

  it("reports quote-reserve graduation progress", () => {
    expect(
      graduationProgress(
        {
          condition: { type: "quote-reserve", threshold: 1_000n },
          adapter: "11111111111111111111111111111111"
        },
        { tokenReserve: 1n, quoteReserve: 250n, tokensSold: 0n, graduated: false }
      )
    ).toBe(25);
  });
});
