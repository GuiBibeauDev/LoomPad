# Trading terminal integration

Terminals can compare the SDK's deterministic quote with a fresh simulation before presenting an order.

```ts
const launch = await client.getLaunch(selectedLaunch);
const quote = client.estimateBuy(launch, order.amountIn, order.maxSlippageBps);
renderDepth({ reserves: launch.state, quote });
```

Refresh state before signing, expire stale quotes, display fee routes, and surface whether graduation or account locks may prevent execution.
