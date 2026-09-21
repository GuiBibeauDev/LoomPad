# Graduation and liquidity adapters

Graduation moves a launch from its initial market toward external liquidity. The current manifest supports quote-reserve and tokens-sold thresholds. Anyone may trigger graduation after the threshold, so no administrator can selectively block an eligible launch.

The destination adapter address is immutable. Adapter CPI is not enabled in the technical preview. Before enabling it, each adapter needs a narrow account interface, exact executable-program verification, PDA signer isolation, minimum-liquidity protection, post-CPI balance checks, idempotence, and adversarial tests. The core must not assume one DEX.
