# Security and privacy notes

## Application controls

- Input: Zod schemas, bounded request body, bounded fields, parameterized SQL.
- Identity: bcrypt password hashes, opaque random session tokens stored only as hashes, session expiry and server-side revocation.
- Browser: HttpOnly SameSite session cookie, signed double-submit CSRF cookie/header, credentials-enabled CORS for one configured origin, CSP and Helmet headers.
- Abuse: per-route/global rate limits, request deadlines, connection pool bounds.
- Authorization: student routes bind all reads/writes to the authenticated user ID; admin data is aggregate-only and role-gated.
- Data controls: export/delete endpoints, cascading user data deletion, explicit registration consent.

These are defense-in-depth controls, not sixteen independently certified security levels. Deploy only behind HTTPS, keep secrets outside source control, rotate credentials, patch dependencies, configure database backups and restore drills, add monitoring/audit retention, and obtain a security/privacy review appropriate to student and minor data.

## Scale notes

The API is stateless between requests but resolves a database session each request. PostgreSQL and the configured pool are the initial capacity constraints. Horizontal API replicas, connection pooling, query metrics, CDN/static caching, and load tests are deployment work. The checked-in compose file is a development/small pilot stack and carries no concurrency SLA.
