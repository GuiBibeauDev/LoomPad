# Contributing to LoomPad

Thank you for helping build open Solana infrastructure. Small, reviewable changes with clear tests are preferred.

## Before opening a pull request

1. Search existing issues and discussions.
2. For protocol behavior, open a design issue describing invariants, account changes, compatibility, and abuse cases.
3. Fork the repository and branch from `main`.
4. Run `npm ci` and `npm run validate`.
5. If Rust changed, run `cargo fmt --check`, `cargo clippy --workspace --all-targets -- -D warnings`, and `anchor test`.

Commits should explain why a change is needed. Pull requests must identify security effects, tests, and breaking changes. Never include wallets, private keys, `.env` files, RPC credentials, or production data.

## Protocol review requirements

A protocol change must document account ownership and signer rules, PDA seeds, checked arithmetic, rounding direction, replay/repetition behavior, CPI targets, privilege changes, upgrade/migration effects, and client compatibility. Changes that move assets require adversarial local-validator tests and independent review before release.

## Developer certificate of origin

By contributing, you certify that you have the right to submit the work under Apache-2.0. Sign commits with `git commit -s` to include the Developer Certificate of Origin sign-off.

Security reports belong in a private GitHub security advisory as described in [SECURITY.md](SECURITY.md), not in a public issue.
