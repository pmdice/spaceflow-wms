# Security Posture

SpaceFlow WMS is an interview-oriented reference implementation that applies secure-by-default patterns commonly expected in enterprise web applications.  
This document summarizes implemented controls, OWASP coverage, and current security boundaries.

## Scope

The controls in this repository focus on:

- Browser-facing security hardening (HTTP headers and CSP)
- API input and payload validation before LLM processing
- Route-level access enforcement at the edge

## Implemented Controls

### HTTP Security Headers

Global headers are configured in `next.config.ts` and applied to all routes:

- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `X-XSS-Protection`
- `Referrer-Policy`

### API Hardening

The `POST /api/parse-intent` endpoint enforces validation before business logic execution:

- Request size check via `content-length`
- Prompt presence and type validation
- Prompt maximum length enforcement
- Server-side schema validation using Zod

### Edge Middleware Controls

Middleware applies route-level controls for:

- `/api/:path*`: API response header enrichment (`X-API-Version`)
- `/admin/:path*`: access check for `auth_token` cookie with redirect to `/login` when absent

## OWASP Top 10 Mapping (2021)

- **A05:2021 - Security Misconfiguration**  
  Centralized security header and CSP configuration reduce misconfiguration risk and tighten browser execution policy.

- **A03:2021 - Injection**  
  Strict request validation and schema-based parsing reduce malformed or adversarial input reaching downstream logic.

- **A04:2021 - Insecure Design**  
  Explicit route controls for privileged paths demonstrate a default-deny, Zero Trust-aligned approach.

- **A01:2021 - Broken Access Control**  
  Edge-level checks on `/admin` routes establish an authorization boundary before application logic is invoked.

- **A10:2021 - Server-Side Request Forgery (SSRF) (partial)**  
  Restrictive CSP `connect-src` limits intended browser-side outbound destinations. Full SSRF mitigation additionally requires server-side egress controls and network allowlisting.

## Known Gaps and Next Controls

The following controls are recommended for production deployment:

- AuthN/AuthZ with signed sessions or JWT validation at edge and API layers
- API rate limiting and abuse detection
- Secure cookie attributes (`HttpOnly`, `Secure`, `SameSite`) and CSRF protections where applicable
- Centralized audit logging, alerting, and incident response hooks
- Automated SAST/DAST and dependency scanning in CI/CD
