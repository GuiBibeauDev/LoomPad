# Node.js integration

Use a server-side transport when an application needs automated, policy-controlled signing. Keep the signer in a managed secret store; never place a private key in source or an environment file committed to Git.

```ts
import { LoomPadClient } from "@loompad/sdk";

const client = new LoomPadClient({ transport: rpcTransport });
const launch = await client.getLaunch(process.argv[2]);
console.log({
  symbol: launch.manifest.token.symbol,
  graduation: client.getGraduationProgress(launch)
});
```

The process should validate its RPC origin, use a dedicated low-privilege signer, simulate every transaction, and enforce spend limits outside the SDK.
