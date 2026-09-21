import { describe, expect, it, vi } from "vitest";
import { LoomPadClient, type LaunchAccount, type LoomPadTransport } from "./index.js";

const account: LaunchAccount = {
  manifest: {
    version: "1.0.0",
    launch: "11111111111111111111111111111111",
    mint: "So11111111111111111111111111111111111111112",
    creator: "Vote111111111111111111111111111111111111111",
    createdAt: 1,
    token: { name: "Test", symbol: "TEST", uri: "https://example.com/token.json", decimals: 9 },
    totalSupply: 1_000_000n,
    creatorAllocation: 100_000n,
    curve: {
      type: "constant-product",
      virtualTokenReserve: 1_000_000n,
      virtualQuoteReserve: 100_000n
    },
    fees: {
      tradeFeeBasisPoints: 100,
      recipients: [{ address: "11111111111111111111111111111111", basisPoints: 10_000 }]
    },
    vesting: { allocation: 100_000n, startTimestamp: 0, cliffSeconds: 10, durationSeconds: 100 },
    graduation: {
      condition: { type: "tokens-sold", threshold: 500_000n },
      adapter: "Stake11111111111111111111111111111111111111"
    },
    authorities: { mintAuthority: null, freezeAuthority: null, updateAuthority: null },
    security: { configurationMutable: false, migrationAdapterAllowlisted: true },
    modules: []
  },
  state: { tokenReserve: 900_000n, quoteReserve: 100_000n, tokensSold: 100_000n, graduated: false }
};

function transport(): LoomPadTransport {
  return {
    getLaunch: vi.fn(() => Promise.resolve(account)),
    listLaunches: vi.fn(() => Promise.resolve([account])),
    submitCreate: vi.fn(() => Promise.resolve("create-signature")),
    submitBuy: vi.fn(() => Promise.resolve("buy-signature")),
    submitSell: vi.fn(() => Promise.resolve("sell-signature"))
  };
}

describe("LoomPadClient", () => {
  it("reads, validates, lists, and creates launches", async () => {
    const client = new LoomPadClient({ transport: transport() });
    await expect(client.getLaunch(account.manifest.launch)).resolves.toEqual(account);
    await expect(client.listLaunches()).resolves.toEqual([account]);
    await expect(client.createLaunch(account.manifest)).resolves.toBe("create-signature");
  });

  it("quotes and submits a buy with minimum output", async () => {
    const adapter = transport();
    const client = new LoomPadClient({ transport: adapter, defaultSlippageBasisPoints: 100 });
    await expect(client.buy(account, account.manifest.creator, 1_000n)).resolves.toBe(
      "buy-signature"
    );
    const submitted = vi.mocked(adapter.submitBuy).mock.calls[0]?.[0];
    expect(submitted?.amountIn).toBe(1_000n);
    expect(submitted?.minimumAmountOut).toBeGreaterThan(0n);
  });

  it("exposes vesting and graduation state", () => {
    const client = new LoomPadClient({ transport: transport() });
    expect(client.getVestedCreatorTokens(account, 50)).toBe(50_000n);
    expect(client.getGraduationProgress(account)).toBe(20);
  });

  it("rejects missing launches and invalid sells", async () => {
    const adapter: LoomPadTransport = {
      ...transport(),
      getLaunch: vi.fn(() => Promise.resolve(null))
    };
    const client = new LoomPadClient({ transport: adapter });
    await expect(client.getLaunch(account.manifest.launch)).rejects.toThrow(/not found/);
    expect(() =>
      client.sell({
        launch: account.manifest.launch,
        trader: account.manifest.creator,
        amountIn: 0n,
        minimumAmountOut: 0n
      })
    ).toThrow(/invalid/);
  });
});
