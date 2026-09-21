# Wallet integration

Wallets can decode a `LaunchManifest` to show human-readable risk information before a signature request:

- mint and fixed-supply authority state;
- creator allocation and current vested amount;
- fee percentage and every destination;
- curve type, reserves, and minimum output;
- graduation threshold and adapter program.

Wallet policy should independently simulate the instruction and flag unknown manifest versions, writable accounts not predicted by the SDK, unexpected signers, and adapters outside the wallet's own review list.
