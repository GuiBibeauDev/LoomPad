# LaunchManifest specification

`LaunchManifest` is a versioned, portable description of a LoomPad launch. It is designed for wallets, explorers, bots, terminals, and analytics systems—not just the reference interface.

## Canonical encoding

The TypeScript representation uses `bigint` for token and reserve amounts. JSON examples encode those values as base-10 strings suffixed with `n` (for example, `"1000000n"`) so accidental floating-point conversion is impossible. Production interoperability will use an IDL-derived binary account plus a canonical JSON profile before the specification is declared stable.

## Mutability

Version 1 launch economics are immutable: mint, supply, curve parameters, fees, recipients, vesting, graduation condition, and adapter cannot be changed. Social links and hosted metadata may change at their external URI and must never be treated as authorization data.

## Validation rules

- addresses must be canonical base58 Solana public keys;
- names contain 1–32 characters and symbols contain 1–10 uppercase alphanumeric characters;
- metadata uses HTTPS and is limited to 200 characters;
- supply values fit `u64`, total supply is positive, and allocation cannot exceed supply;
- creator allocation is either zero or fully covered by vesting;
- trade fees are 0–1,000 basis points;
- one to eight unique fee recipients divide exactly 10,000 basis points;
- curve reserves/prices and graduation thresholds are positive;
- mint and freeze authorities are explicitly absent.

Unknown versions must fail closed. Consumers should not guess the semantics of new fields or variants.
