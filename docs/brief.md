---
title: Project Brief: OALASS (Online Absence & Leave Application Support System)
---

## Executive Summary

OALASS is a role-based, web-first platform that digitizes employee leave and travel order workflows for an academic institution. It centralizes applications, approvals, balances, notifications, and reporting, reducing manual processing and improving transparency. The initial release targets teachers and non-teaching staff, with approval flows for department heads, deans/program heads, finance, and admins.

## Problem Statement

- Paper-based or fragmented leave processes create delays, errors, and limited visibility.
- Manual computations of leave balances and term/limit rules are error-prone.
- Approvers lack a unified dashboard to act efficiently and track SLA adherence.
- Employees have no reliable real-time status, causing repeated follow-ups.
- Existing tools do not fit academic term structures and department role hierarchies.

## Proposed Solution

Deliver a secure, modular Next.js platform with authenticated, role-based dashboards and guided forms for leave and travel orders, powered by Prisma/MySQL and NextAuth. Dynamic validation via Zod enforces rules at the edge and server. Realtime notifications inform users of status changes; admins get shadcn/ui dashboards, data tables, and exports.

Key differentiators
- Built for academic term structures, departments, and role hierarchies.
- SSR-safe validation and input sanitization with server actions.
- Clear separation of roles: Admin, Finance, Dean/Program Head, Department Head, Teacher/Staff.

## Target Users

### Primary User Segment: Teachers and Non-Teaching Personnel
- Submit leave and travel order requests with required documentation.
- View balances, status, and history; receive real-time updates.

### Secondary User Segment: Approvers and Administrators
- Department Heads and Deans/Program Heads: review/approve/deny requests.
- Finance: validate payable aspects and export data for processing.
- Admins: manage accounts, roles, limits, term types, and platform settings.

## Goals & Success Metrics

### Business Objectives
- Reduce leave processing cycle time by 50% within one term.
- Improve data accuracy to >99% across balances and approvals.
- Achieve >80% monthly active usage among eligible staff.

### User Success Metrics
- < 5 minutes median time to submit a standard leave request.
- > 90% users find the status/notifications clear (post-release survey).
- > 95% approval actions completed within SLA windows.

### Key Performance Indicators (KPIs)
- Time-to-approval: P50/P90 by department.
- Submission-to-notification latency (realtime update performance).
- Error rate in validation or failed submissions per 1k requests.
- Admin intervention rate for misrouted or stuck requests.

## MVP Scope

### Core Features (Must Have)
- Authentication with NextAuth (JWT sessions) and role-based access control.
- Teacher/Staff leave application and travel order submission with file uploads.
- Department Head and Dean/Program Head approval flows.
- Finance dashboard for financial validations (read/export minimal for MVP).
- Admin manage-accounts and basic role assignment.
- Leave limits and term types configuration; dynamic balance calculations.
- Realtime notifications and in-app toasts for status updates.

### Out of Scope for MVP
- Advanced analytics and cross-term forecasting.
- Complex finance integrations or payroll automation.
- Mobile apps (responsive web included).

### MVP Success Criteria
- End-to-end leave submission to final decision works reliably for 95% of cases.
- Approvers complete actions within defined SLA in ≥80% of cases.
- Minimal support tickets related to login, submission, or approval flows.

## Post-MVP Vision

### Phase 2 Features
- Advanced reporting, CSV exports, and audit logs per department/role.
- Customizable approval chains and conditional routing rules.

### Long-term Vision
- Deep HRIS/payroll integrations; cross-campus multi-tenant support.
- Policy automation for edge-case leave rules and exceptions.

### Expansion Opportunities
- Mobile push notifications; offline-friendly drafts.
- Analytics for staffing forecasts and term-based planning.

## Technical Considerations

### Platform Requirements
- Target Platforms: Modern browsers (Chromium, Firefox, Safari), Windows/macOS.
- Performance Requirements: Sub-200ms server response P50; maintain realtime updates via WebSocket where applicable.

### Technology Preferences
- Frontend: Next.js App Router (v15), React Server Components, shadcn/ui, Tailwind CSS.
- Backend: Next.js route handlers and server actions; structured APIs for integration.
- Database: MySQL via Prisma ORM; schema for users/roles/departments/leave.
- Hosting/Infrastructure: Node runtime with environment-secure config; CDN for static assets.

### Architecture Considerations
- Repository Structure: `app/(role)/...` layouts, modular UI under `components/ui`.
- Service Architecture: Monorepo app with domain-focused lib modules (auth, validators, actions).
- Integration Requirements: Email (Nodemailer); optional Google OAuth; export endpoints.
- Security/Compliance: SSR-safe validation; input sanitization; RBAC; audit-friendly logs.

## Constraints & Assumptions

### Constraints
- Budget and exact headcount TBD; rely on existing stack and open-source libs.
- Timeline aligned to academic term; soft launch before next enrollment period.
- Technical: Preserve backward compatibility and add-only extensions to avoid regressions.

### Key Assumptions
- Roles and department hierarchies are stable this term.
- Email delivery is reliable; users check institutional inboxes.
- MySQL resources and indices are tuned for expected load.

## Risks & Open Questions

### Key Risks
- Policy complexity leading to edge cases not covered by MVP.
- Role misconfiguration causing access or routing issues.
- Email deliverability or notification fatigue.

### Open Questions
- Final SLA targets by role/department?
- Required audit retention period for approvals/attachments?
- Finance export formats and cadence?

### Areas Needing Further Research
- Comparative benchmarks for approval cycle time in similar institutions.
- Accessibility reviews for forms and data tables.
- Data retention and privacy policy alignment.

## Appendices

### A. Research Summary
If available, include market research, competitor analysis, interview notes, and feasibility studies.

### B. Stakeholder Input
Summaries of feedback from Admin, Finance, Department Heads, and Faculty representatives.

### C. References
Links to internal docs, standards, and prior system reports.

## Next Steps

### Immediate Actions
1. Validate MVP scope and SLAs with Admin/Finance/Dean stakeholders.
2. Confirm leave type fields and validation rules per policy.
3. Finalize reporting/export requirements for Finance.
4. Prepare seed data and test scenarios across roles.
5. Plan phased rollout and feedback loop.

### PM Handoff
This Project Brief provides the full context for OALASS. Please start in "PRD Generation Mode", review the brief thoroughly, and work with stakeholders to produce the PRD section-by-section, capturing clarifications and suggested improvements.


