# Security Policy

## Supported version

Security fixes are applied to the current production branch.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Contact the repository owner privately and include the affected route, reproduction steps, impact, and any suggested mitigation. Do not include customer data, credentials, session cookies, setup tokens, or database connection strings.

## Production controls

- Secrets are supplied through the hosting environment and are never committed.
- Owner setup requires a generated token of at least 32 characters.
- Admin sessions use HttpOnly, SameSite=Strict, Secure cookies in production.
- State-changing requests enforce same-origin checks.
- Sensitive endpoints are rate limited.
- Product uploads are size, count, MIME, extension, and file-signature restricted.
- PostgreSQL is reachable only through the hosting provider's private network.
- The application runs as a non-root container user.
