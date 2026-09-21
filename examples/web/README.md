# Web application integration

A browser client supplies a wallet-backed transport to `LoomPadClient`. The application may query an indexer for discovery, but it must fetch the launch account from RPC and show the wallet's simulation before signing.

```ts
const client = new LoomPadClient({ transport: walletTransport });
const launch = await client.getLaunch(address);
const quote = client.estimateBuy(launch, 100_000_000n, 50);
await client.buy(launch, wallet.publicKey.toBase58(), 100_000_000n, 50);
```

Escape token names, symbols, metadata, image URLs, and social links. Never inject metadata HTML into the page.
