# Backend Structure Document

# Backend Structure Document

This document provides a clear overview of the backend setup for the Gym Admin Dashboard project—an administrative interface for a gym management system that handles memberships, attendance tracking, a point-of-sale system, and reporting.

## 1. Backend Architecture

Overall, the backend follows a modular, service-oriented approach built on Next.js API routes:

• Framework & Design Patterns:
  - Next.js (App Router) powers both frontend pages and API routes as serverless functions.  
  - Layered code organization:  
    • **Routing layer** (API endpoints under `app/api`)  
    • **Service layer** (business logic in `lib/` or dedicated service files)  
    • **Data access layer** (Drizzle ORM models in `db/`)  

• Scalability:
  - Serverless functions on Vercel auto-scale with traffic  
  - Stateless design: horizontal scaling without session stickiness  

• Maintainability:
  - TypeScript ensures type safety throughout  
  - Clear separation of concerns (auth logic, data models, API routes)  
  - Reusable components and services reduce duplication  

• Performance:
  - Server-side rendering for critical pages  
  - API responses optimized via selective queries  
  - CDN for static assets (see Infrastructure Components)

## 2. Database Management

We use a relational database approach:

• Database Technology:
  - PostgreSQL (hosted as a managed database)  
  - Drizzle ORM for a type-safe interaction layer

• Data Structure & Access:
  - Tables enforce schemas for users, members, plans, products, check-ins, transactions  
  - Drizzle handles migrations, query building, and type definitions  
  - Environment variables (`DATABASE_URL`) secure connection strings

• Data Practices:
  - Migrations track schema changes  
  - Connection pooling ensures efficient resource usage  
  - Backups via database provider’s automated snapshots

## 3. Database Schema

### Human-Readable Overview

• **Users**: Staff and admins who log in  
• **Members**: Gym customers with personal info and QR codes  
• **MembershipPlans**: Available plans with price and duration  
• **Products**: Items sold in the gym store  
• **CheckInLogs**: Records of each member’s gym visits  
• **Transactions**: Sales receipts and line items for POS

---

### SQL Definitions (PostgreSQL)

```sql
-- Users (staff/admin)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin','staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Membership Plans
CREATE TABLE membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  duration_days INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Members
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  qr_code VARCHAR(255) UNIQUE NOT NULL,
  membership_plan_id UUID REFERENCES membership_plans(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Check-In Logs
CREATE TABLE check_in_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_amount NUMERIC(10,2) NOT NULL,
  processed_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Transaction Items
CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL
);
```

## 4. API Design and Endpoints

We follow a RESTful pattern using Next.js API routes:

• **Authentication (Better Auth)**
  - `POST /api/auth/sign-up` — create staff/admin accounts  
  - `POST /api/auth/sign-in` — login endpoint  
  - Session cookies or JWTs manage user sessions

• **Members**
  - `GET /api/members` — list all members  
  - `GET /api/members/:id` — retrieve one member  
  - `POST /api/members` — add a new member  
  - `PUT /api/members/:id` — update member details  
  - `DELETE /api/members/:id` — remove a member

• **Membership Plans**
  - `GET /api/plans`  
  - `POST /api/plans`  
  - `PUT /api/plans/:id`  
  - `DELETE /api/plans/:id`

• **Products & POS**
  - `GET /api/products` — view catalog  
  - `POST /api/products` — add new item  
  - `PUT /api/products/:id` — update stock/price  
  - `POST /api/transactions` — process a sale, create transaction + items

• **Attendance**
  - `POST /api/check-in` — log a member’s check-in via QR or manual input  

• **Reporting**
  - `GET /api/reports/attendance` — fetch check-in stats  
  - `GET /api/reports/sales` — fetch revenue data

Each endpoint uses:
  - Input validation (e.g. Zod schemas)
  - Standard error responses for clarity (400/401/500)
  - Role-based middleware to protect sensitive routes

## 5. Hosting Solutions

• **Cloud Provider**: Vercel
  - Automatic deployments on merge  
  - Serverless functions power API routes  
  - Built-in global CDN for static assets  
  - Pay-as-you-go pricing, generous free tier

• **Local Development**:
  - Docker & Docker Compose spin up the Next.js app and a local PostgreSQL instance  
  - Ensures on-board developers have a consistent setup with one command

## 6. Infrastructure Components

• **Load Balancing & Routing**
  - Vercel uses edge routers to direct requests to the nearest serverless instance

• **CDN & Caching**
  - Static assets (JS, CSS, images) served from Vercel’s CDN  
  - Potential to integrate Redis or in-memory cache for frequently accessed data (future)

• **Containerization**
  - Docker images define runtime environments  
  - Docker Compose orchestrates app + database locally

• **CI/CD**
  - GitHub or GitLab integrated with Vercel for automated builds and previews

## 7. Security Measures

• **Authentication & Authorization**
  - Better Auth secures sign-up/sign-in flows  
  - Role-based access control (admin vs. staff) on API routes  

• **Encryption**
  - HTTPS enforced by Vercel  
  - Database credentials stored in environment variables  
  - Data at rest encrypted by managed Postgres service

• **Input Validation & Sanitization**
  - Zod schemas on request bodies  
  - ORM parameter binding prevents SQL injection

• **Rate Limiting & Logging**
  - Middleware to throttle repeated failed auth or check-in attempts  
  - Centralized logging for audit trails

• **Compliance**
  - GDPR-ready: user data retention policies  
  - Secure cookie flags (HttpOnly, Secure)

## 8. Monitoring and Maintenance

• **Monitoring Tools**
  - Vercel Analytics for traffic and performance  
  - Sentry (or alternative) for runtime error tracking  
  - Database metrics via provider dashboard

• **Automated Alerts**
  - Notify on high error rates or downtime  
  - Alert on database connection issues

• **Maintenance Practices**
  - Scheduled schema migrations via migration scripts  
  - Dependabot or Renovate for dependency updates  
  - Regular backups and disaster recovery drills

## 9. Conclusion and Overall Backend Summary

The Gym Admin Dashboard backend is a modern, scalable system that balances performance with ease of maintenance. By leveraging Next.js API routes, PostgreSQL with Drizzle ORM, and Vercel’s serverless platform, we achieve:

• **Scalability** through serverless auto-scaling and stateless design  
• **Maintainability** via clear code layers, TypeScript safety, and containerized development  
• **Security** through robust auth, role-based access, and data encryption  
• **Reliability** via managed hosting, automated monitoring, and backups

This setup aligns closely with the project goals: a unified gym management interface that handles memberships, attendance, POS transactions, and reporting, while remaining easy to develop and operate.

---
**Document Details**
- **Project ID**: 75f83eed-0d53-4247-ae65-f3e963001172
- **Document ID**: 3bd4b548-8fb5-49f2-b536-ba5c8bdfeec6
- **Type**: custom
- **Custom Type**: backend_structure_document
- **Status**: completed
- **Generated On**: 2025-10-25T13:43:10.818Z
- **Last Updated**: N/A
