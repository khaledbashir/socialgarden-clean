# Easypanel Deployment Setup

## Overview
- **Monorepo**: `khaledbashir/socialgarden-clean`
- **Auto Deploy**: Pushing to `main` triggers builds on Easypanel.

## Services

### 1. Frontend ("sow-qandu-me")
- **Framework**: Next.js
- **Build Path**: `/`
- **URL**: `https://sow.qandu.me`
- **API URL**: `https://sow.qandu.me/api` (Next.js API Routes)
- **Environment Variables**:
  ```env
  DB_HOST=ahmad_mysql-database
  DB_USER=sg_sow_user
  DB_PASSWORD=SG_sow_2025_SecurePass!
  DB_NAME=socialgarden_sow
  DB_PORT=3306
  NODE_ENV=production
  NEXT_PUBLIC_BASE_URL=https://sow.qandu.me
  NEXT_PUBLIC_API_URL=https://sow.qandu.me/api
  ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host
  ANYTHINGLLM_API_KEY=0G0WTZ3-6ZX4D20-H35VBRG-9059WPA
  NEXT_PUBLIC_ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host
  NEXT_PUBLIC_ANYTHINGLLM_API_KEY=0G0WTZ3-6ZX4D20-H35VBRG-9059WPA
  PDF_SERVICE_URL=https://ahmad-socialgarden-backend.840tjq.easypanel.host
  NEXT_PUBLIC_PDF_SERVICE_URL=https://ahmad-socialgarden-backend.840tjq.easypanel.host
  OPENROUTER_API_KEY=sk-or-v1-...
  OPENROUTER_MODEL_PREF=moonshotai/kimi-k2-instruct
  ```

### 2. PDF Service / Backend ("sow-backend-api" / "socialgarden-backend")
- **Framework**: Python (FastAPI)
  - *Note: User referred to this as Node.js, but codebase confirms Python/FastAPI in `/backend`.*
- **Build Path**: `/backend`
- **URL**: `https://ahmad-socialgarden-backend.840tjq.easypanel.host`
- **Environment Variables**:
  ```env
  DB_HOST=ahmad_mysql-database
  DB_USER=sg_sow_user
  DB_PASSWORD=SG_sow_2025_SecurePass!
  DB_NAME=socialgarden_sow
  DB_PORT=3306
  NODE_ENV=production
  ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host
  ANYTHINGLLM_API_KEY=0G0WTZ3-6ZX4D20-H35VBRG-9059WPA
  PDF_SERVICE_URL=https://ahmad-socialgarden-backend.840tjq.easypanel.host
  OPENROUTER_API_KEY=sk-or-v1-...
  ```

### 3. AnythingLLM
- **URL**: `https://ahmad-anything-llm.840tjq.easypanel.host`
- **Role**: Vector DB & LLM Orchestration

## Database
- **Type**: MySQL
- **Host**: `ahmad_mysql-database` (Internal Docker Network)
- **User**: `sg_sow_user`
- **Database**: `socialgarden_sow`

## Notes
- The Frontend communicates with the PDF Service via `PDF_SERVICE_URL`.
- The Frontend communicates with AnythingLLM via `NEXT_PUBLIC_ANYTHINGLLM_URL`.
- Health checks in Frontend (`useDocumentState.ts`) ping `NEXT_PUBLIC_API_URL/health` (Next.js API).
