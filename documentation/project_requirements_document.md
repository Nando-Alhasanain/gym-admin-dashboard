# Project Requirements Document

## 1. Project Overview

The Gym Admin Dashboard is a full-stack web application designed to serve as the central control panel for gym managers and staff. It solves the problem of fragmented gym operations—where memberships, attendance tracking, retail sales, and performance reporting live in separate spreadsheets or paper logs—by unifying all core administrative tasks under one secure, modern interface. This dashboard provides member management, QR-code–based check-in, point-of-sale (POS) transactions, and real-time analytics, so gym owners can focus on growing their business rather than juggling manual processes.

We are building this system to streamline day-to-day gym operations, reduce human error, and provide actionable insights into revenue and attendance trends. Key objectives are:

- Delivering a secure, role-based access model for admins and staff.
- Enabling quick member check-ins via QR codes or manual entry.
- Supporting retail transactions with inventory management.
- Offering a unified dashboard of charts and reports for data-driven decisions.
- Ensuring performance, reliability, and ease of deployment on platforms like Vercel.

Success is measured by staff adoption, accurate attendance and sales records, and a measurable reduction in administrative overhead.

## 2. In-Scope vs. Out-of-Scope

**In-Scope (Version 1):**

- User authentication (sign-up, sign-in, password security) via Better Auth.  
- Role-based access control (Admin vs. Staff).  
- Member CRUD (create, read, update, delete) with QR code generation.  
- Attendance logging through QR-code scanning or manual ID input.  
- POS module: product catalog, cart management, checkout, receipt generation.  
- Dashboard reports: daily check-ins, revenue charts, membership trends.  
- Responsive UI using Next.js, Tailwind CSS, shadcn/ui.  
- PostgreSQL database with Drizzle ORM schemas for users, members, plans, products, logs, and transactions.  
- Docker Compose for local development; deployment to Vercel.

**Out-of-Scope (Future Phases):**

- Mobile-native (React Native or SwiftUI) apps.  
- Integration with external payment gateways (Stripe, PayPal).  
- Automated email/SMS notifications for membership renewals.  
- Advanced reporting (heatmaps, predictive analytics).  
- Multi-location gym support.  
- Third-party integrations (e.g., Fitbit, Google Calendar).

## 3. User Flow

A new staff member visits the application and lands on the sign-up page, where they submit their email, name, and password. Upon email verification, they sign in via the login page and are routed to the protected dashboard. The dashboard layout features a fixed sidebar with sections for Members, Attendance, POS, and Reports. Staff with the “admin” role see additional links for system settings and financial exports.

To check in a member, staff navigate to Attendance, open the QR-scanner component or enter a member ID manually, and submit. The system validates membership status, records the check-in, and displays a confirmation. For a retail sale, staff go to POS, search or browse products, add items to the cart, and finalize the transaction. Each step updates the PostgreSQL database and adjusts stock levels in real time. Reports automatically refresh to reflect the day’s activity.

## 4. Core Features

- **Authentication & RBAC**  
  Secure sign-up, login, password hashing, and email verification. Role-based middleware ensures only authorized users can access specific routes.

- **Member Management**  
  Full CRUD for member profiles. Automatic QR code generation (`qrcode.react`). Fields include name, contact info, plan assignment.

- **Attendance Tracking**  
  QR code scanning via `react-qr-reader` or manual ID entry. Backend endpoint verifies active plans, writes to `check_in_logs`, and returns status messages.

- **Point-of-Sale (POS)**  
  Product catalog display, cart interface, checkout logic. On success, updates `transactions` and decrements inventory. Generates printable receipt.

- **Dashboard & Reports**  
  Real-time charts (using Tremor or Recharts) for key metrics: daily check-ins, membership counts, revenue by day/week, popular products.

- **UI/UX & Theming**  
  Responsive design with Next.js app router, shadcn/ui components, Tailwind CSS, and dark mode support via `next-themes`.

- **Database & API**  
  PostgreSQL accessed through Drizzle ORM. Next.js API routes for all CRUD and business logic (e.g., `/api/members`, `/api/check-in`, `/api/pos`).

- **Containerization & Deployment**  
  Docker Compose for local dev. Optimized build for Vercel hosting with environment variable management.

- **Validation & Error Handling**  
  `zod` schemas for request bodies. Standardized error responses with clear messages for UI feedback.

## 5. Tech Stack & Tools

- Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, `next-themes`, Lucide React icons.  
- Backend: Next.js API routes, TypeScript.  
- Database: PostgreSQL, Drizzle ORM for type-safe schema definitions and queries.  
- Authentication: Better Auth for secure user flows.  
- QR Code: `qrcode.react` (generation), `react-qr-reader` (scanning).  
- Charts: Tremor or Recharts for data visualization.  
- Validation: `zod` + `react-hook-form`.  
- Containerization: Docker, Docker Compose.  
- Deployment: Vercel.  
- Testing: Jest for unit tests, Playwright or Cypress for end-to-end.  
- Monitoring: Sentry for error tracking.

## 6. Non-Functional Requirements

- **Performance:** Dashboard load time under 2 seconds on a 4G connection. API responses under 300 ms for standard queries.  
- **Security:** HTTPS in all environments, OWASP Top 10 mitigation, secure JWT or session tokens, rate limiting on auth and check-in endpoints.  
- **Scalability:** Support at least 1,000 concurrent users. Database connection pooling configured.  
- **Reliability:** 99.9% uptime SLA on production. Automated backups of PostgreSQL daily.  
- **Usability:** WCAG 2.1 AA compliance for accessibility. Responsive design for desktop and tablet use.  
- **Maintainability:** 80% code coverage in unit tests, CI/CD pipelines with linting and type checks.

## 7. Constraints & Assumptions

- PostgreSQL is available and reachable in all environments.  
- Better Auth service credentials and environment variables are configured before running.  
- Vercel is the primary deployment target; some server-only Node.js features must align with Vercel’s serverless model.  
- Staff devices (tablets or laptops) have cameras for QR scanning or fallback manual entry.  
- No external payment gateway integration for V1—uses in-house transactions only.

## 8. Known Issues & Potential Pitfalls

- **QR Scanner Variability:** Camera API support differs by browser/device. Provide manual input fallback.  
- **Database Migrations:** Drizzle ORM migrations must run in CI/CD. Missing migrations can break production.  
- **API Rate Limiting:** Unprotected endpoints could be abused. Implement middleware to throttle repeated requests.  
- **Data Consistency:** Race conditions in POS checkout might oversell products. Use database transactions to lock stock rows.  
- **Serverless Cold Starts:** Vercel functions may have latency spikes. Cache static data where possible (e.g., product catalog).  
- **Validation Gaps:** Incomplete Zod schemas may allow invalid data. Keep validation and business logic in sync.

---

This PRD captures the full scope of the Gym Admin Dashboard project, providing clear guidance for every component, flow, and requirement. Subsequent technical documents—Tech Stack details, Frontend Guidelines, Backend Structures, App Flow diagrams, and file organization—can directly build on this reference without ambiguity.