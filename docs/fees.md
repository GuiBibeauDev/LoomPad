# Fee routing

Trade fees are expressed in basis points and capped at 10% in version 1. Each manifest contains one to eight unique recipients. Their relative shares must add to exactly 10,000 basis points.

Fee calculation rounds the aggregate fee upward so the configured maximum output cannot be exceeded. Recipient shares round downward except for the last recipient, which receives the remainder. This conserves every integer unit and makes dust handling deterministic. Integrations should display both the aggregate fee and all destinations before signing.
