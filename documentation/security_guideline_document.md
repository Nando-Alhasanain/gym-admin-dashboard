# Security Guidelines for Gym Admin Dashboard

This document outlines essential security principles and best practices tailored to the "Gym Admin Dashboard" repository. It integrates robust security controls across authentication, input handling, data protection, APIs, web hygiene, infrastructure, and dependencies to ensure a resilient gym management system.

---

## 1. Security by Design

- Embed security from day one: review architecture and threat models before adding features.  
- Enforce **Secure Defaults**: all endpoints require authentication unless explicitly stated public.  
- Apply **Defense in Depth**: use multiple controls (authentication, RBAC, validation) so no single point of failure.

## 2. Authentication & Access Control

- **Strong Authentication**  
  • Use Better Auth with secure password policies (min. 12 characters, complexity rules).  
  • Store passwords hashed with Argon2 or bcrypt and unique salts.  
  • Enforce account lockouts & rate limiting on sign-in endpoints to thwart brute-force attacks.

- **Session & Token Security**  
  • If using JWT, select strong algorithms (e.g., RS256), validate `exp` and `aud`, and rotate keys periodically.  
  • Set HTTP-only, Secure, SameSite=Lax cookie flags.

- **Role-Based Access Control (RBAC)**  
  • Extend user schema with roles (`admin`, `staff`).  
  • Implement server-side middleware to check roles on every protected route under `app/dashboard/*`:
    - Only `admin` can access financial reports and system settings.  
    - `staff` can perform check-ins and POS operations.

- **Multi-Factor Authentication**  
  • Offer TOTP (e.g., Google Authenticator) for admin users to protect sensitive actions.

## 3. Input Handling & Validation

- **Server-Side Validation**  
  • Use **Zod** for schema-based validation on all API routes (members, plans, products, transactions).  
  • Validate types, ranges (e.g., price > 0, stock ≥ 0), string lengths, and formats (e.g., email, phone).

- **Prevent Injection**  
  • Use Drizzle ORM’s parameterized queries; never interpolate raw values into SQL.  
  • Sanitize and escape any HTML or rich-text input to avoid template injection.

- **File Uploads & QR Codes**  
  • If supporting image uploads, validate MIME types, file size, and scan for malware.  
  • Store files outside web root or in secure cloud storage with restricted access.

- **Redirect Validation**  
  • If implementing redirects after sign-in/sign-out, validate redirect URLs against an allow-list of trusted paths.

## 4. Data Protection & Privacy

- **Encryption In Transit & At Rest**  
  • Enforce HTTPS (TLS 1.2+) for all traffic (Next.js and API).  
  • Enable database encryption at rest (PostgreSQL Transparent Data Encryption if available).

- **Secrets Management**  
  • Store API keys, database credentials, JWT private keys in a secrets manager (e.g., AWS Secrets Manager, Vault).  
  • Avoid committing secrets or `.env` files to version control.

- **PII Handling**  
  • Mask or redact sensitive fields (e.g., member contact info) in logs and API responses.  
  • Implement data retention and deletion policies for PII to comply with GDPR/CCPA if applicable.

- **Secure Database Access**  
  • Create distinct database users with least privilege: one user for web read/write operations, another read-only for reporting.  
  • Use SSL/TLS connections between application and database.

## 5. API & Service Security

- **Endpoint Protection**  
  • Secure all `app/api/*` routes with authentication and role checks.  
  • Use correct HTTP methods: GET (read), POST (create), PUT/PATCH (update), DELETE (delete).

- **Rate Limiting & Throttling**  
  • Implement rate limiting (e.g., 100 requests/minute per IP) on sensitive endpoints (`/api/auth`, `/api/check-in`).

- **CORS & CSRF**  
  • Configure CORS to only allow origins you control (e.g., `https://yourdomain.com`).  
  • Use Next.js built-in CSRF protection or a synchronizer token to protect state-changing requests.

- **Minimize Data Exposure**  
  • Only return necessary fields in API responses (e.g., avoid returning full user objects where only `id` and `role` are needed).

## 6. Web Application Security Hygiene

- **Security Headers**  
  • `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`  
  • `X-Content-Type-Options: nosniff`  
  • `X-Frame-Options: DENY` or `Content-Security-Policy: frame-ancestors 'none'`  
  • `Referrer-Policy: no-referrer-when-downgrade`

- **Content Security Policy (CSP)**  
  • Restrict scripts/styles to your own domains and trusted CDNs.  
  • Enable `script-src 'self' 'nonce-<random>'` for inline scripts if needed.

- **Cookie Security**  
  • Ensure session cookies have `Secure; HttpOnly; SameSite=Lax` flags.

- **Disable Client-Side Sensitive Storage**  
  • Avoid storing PII, JWTs, or secrets in `localStorage` or `sessionStorage`.

- **Subresource Integrity (SRI)**  
  • Add `integrity` and `crossorigin` attributes to `<script>` and `<link>` tags for third-party resources.

## 7. Infrastructure & Configuration Management

- **Environment Hardening**  
  • Disable debug/verbose logging in production (`NEXT_PUBLIC_ENV=production`).  
  • Remove or protect default admin accounts and credentials.

- **Network Controls**  
  • Expose only necessary ports (e.g., 443 for HTTPS).  
  • Use a Web Application Firewall (WAF) to block malicious traffic patterns.

- **TLS/SSL Configuration**  
  • Enforce TLS 1.2+ and strong cipher suites.  
  • Redirect all HTTP traffic to HTTPS.

- **Container Security**  
  • Use minimal base images (e.g., `node:18-alpine`).  
  • Run containers as non-root users.  
  • Scanning images for vulnerabilities (e.g., with Trivy) before deployment.

- **Automated Patching**  
  • Schedule regular updates of OS packages, Node.js, and package dependencies.

## 8. Dependency Management

- **Vet & Lock Dependencies**  
  • Use `package-lock.json` to lock versions.  
  • Only install essential packages (e.g., Next.js, Drizzle, Zod, React-Hook-Form).

- **Vulnerability Scanning**  
  • Integrate SCA tools (e.g., GitHub Dependabot, Snyk) to detect and remediate CVEs in dependencies.

- **Library Selection**  
  • Choose well-maintained, widely adopted libraries (e.g., `zod`, `react-qr-reader`).  
  • Keep third-party UI components (shadcn/ui) up-to-date.

## 9. Testing, Monitoring & Incident Response

- **Automated Testing**  
  • Unit tests for business logic (e.g., membership validation, transaction processing).  
  • Integration tests for API routes using a test database.  
  • E2E tests with Cypress or Playwright simulating check-ins, sales, and RBAC enforcement.

- **Logging & Monitoring**  
  • Capture errors and performance metrics with Sentry or Datadog.  
  • Log security events (failed logins, access denials) to a centralized SIEM.

- **Incident Response Plan**  
  • Define procedures for detecting, containing, and recovering from breaches.  
  • Conduct regular security drills and reviews.

## 10. Conclusion

Adherence to these guidelines will ensure the Gym Admin Dashboard is secure, reliable, and compliant with best practices. Security is an ongoing effort—continuously review, test, and enhance controls as the application evolves.