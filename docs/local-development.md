# Local development

Use the pinned versions in `package.json`, `rust-toolchain.toml`, and `Anchor.toml`. Copy `.env.example` and keep `.env` untracked. The example program ID is not a deployment identity.

## JavaScript workspace

```bash
npm ci
npm run validate
```

`validate` checks formatting, lint rules, strict TypeScript, unit coverage, and production builds. Run the reference interface with `npm run dev`.

## Solana program

Install Rust, Solana, and Anchor using their official installers, then run:

```bash
anchor build
anchor test
```

Local keypairs belong outside the repository. Before a deployment, generate a program identity, update all ID references together, build a verifiable artifact, and record the binary hash. Do not reuse a personal wallet as a program upgrade authority.

## Testing layers

- unit tests: manifest validation, curve edges, fee conservation, vesting, and graduation;
- program tests: signer/PDA constraints, unauthorized mutations, zero/extreme values, replay-like repetition, and account substitution;
- validator tests: transfers, concurrency, Token/Token-2022 behavior, compute limits, and adapter CPI;
- differential/property tests: SDK quotes versus on-chain math over randomized valid inputs.

Settlement-related validator tests are a release blocker for enabling asset movement.
