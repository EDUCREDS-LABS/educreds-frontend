# Getting Started with EduCreds UI

**Official UI Onboarding Guide**

- **Version:** 1.0.0
- **Last updated:** January 28, 2026
- **Primary UI:** `https://educreds.xyz`

## Table of contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment setup](#environment-setup)
4. [Local development](#local-development)
5. [Core user journeys](#core-user-journeys)
6. [Key routes](#key-routes)
7. [Troubleshooting](#troubleshooting)

## Overview
EduCreds UI is the institution-facing web app for onboarding, credential issuance, verification, templates, marketplace usage, and governance.

It connects to:
- **Backend API** for core platform workflows
- **Trust Agent** for governance and risk intelligence

## Prerequisites
- Node.js 18+
- npm
- Access to the EduCreds backend (`cert_backend`)
- Optional: Trust Agent service (`educreds_trust_agent`) for governance insights

## Environment setup
Create or update `educreds-frontend/.env` with values that match your environment.

```dotenv
VITE_API_BASE=http://localhost:3001
VITE_CERT_API_BASE=http://localhost:3001
VITE_TRUST_AGENT_BASE=http://localhost:3010
VITE_APP_URL=http://localhost:5002
```

For production:
```dotenv
VITE_API_BASE=https://api.educreds.xyz
VITE_CERT_API_BASE=https://api.educreds.xyz
VITE_TRUST_AGENT_BASE=https://trust-agent.educreds.xyz
VITE_APP_URL=https://educreds.xyz
```

## Local development

### 1) Start the backend API
```bash
cd cert_backend
npm install
npm run start:dev
```

### 2) Start the Trust Agent (optional)
```bash
cd educreds_trust_agent
npm install
npm run dev
```

### 3) Start the frontend UI
```bash
cd educreds-frontend
npm install
npm run dev
```

## Core user journeys

### 1) Institution onboarding
1. Open `/register`
2. Complete OTP-based registration
3. Optionally link a wallet during onboarding
4. Log in at `/login`

### 2) Issue a certificate
1. Navigate to `/institution/issue`
2. Select a template
3. Enter student details
4. Issue and verify status

### 3) Verify a credential
1. Open `/verification-portal`
2. Enter certificate ID or scan a QR
3. Confirm validity and issuer

### 4) Manage templates
1. Open `/institution/templates`
2. Create or import templates
3. Publish for issuance

### 5) Governance workflows
1. Open `/institution/governance`
2. Review proposals
3. Submit or execute actions

## Key routes

Public:
- `/` landing page
- `/login` institution login
- `/register` institution registration
- `/verification-portal` public verification

Institution:
- `/institution/dashboard`
- `/institution/issue`
- `/institution/certificates`
- `/institution/templates`
- `/institution/verification`
- `/institution/subscription`
- `/institution/analytics`

Governance:
- `/institution/governance`
- `/institution/governance/proposals/:id`

## Troubleshooting
- **UI cannot reach the API**: verify `VITE_API_BASE` and backend port `3001`.
- **CORS errors**: ensure backend allows the frontend origin.
- **Governance insights missing**: check `VITE_TRUST_AGENT_BASE` and trust agent health.
- **Blank pages after login**: verify JWT token issuance and `/auth/profile` response.
