# Telegram bot integration

The bot is an interface, not a custodian. Prefer deep-linking a transaction to the user's wallet. If an operator chooses custodial signing, isolate each user, cap balances and spend, require explicit confirmation, and use a professional key-management service.

```ts
const launch = await client.getLaunch(command.launchAddress);
const quote = client.estimateBuy(launch, command.lamports, command.slippageBps);
await reply(renderConfirmation(launch.manifest, quote));
```

Treat message text and token metadata as hostile input. Apply per-user and per-chat rate limits and never echo secrets in bot logs.
