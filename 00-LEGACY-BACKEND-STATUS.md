# Legacy Backend Service Status

## Service: `socialgarden-backend`
- **Status**: **OFF** (Currently disabled in Easypanel)
- **Repo**: `khaledbashir/the11-dev-clean`
- **Branch**: `backend-service`
- **Build Path**: `/backend`

## Reason for Deactivation
- Transitioned from a split repo structure to a monorepo structure (`khaledbashir/socialgarden-clean`).
- The active backend service is now part of the monorepo deployment (likely the "sow-backend-api" mentioned in previous config).

## Legacy Environment Variables (Reference Only)
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
OPENROUTER_API_KEY=sk-or-v1-[REDACTED]
```

## Decision Logic
- **KEEP OFF**: Unless specific legacy functionality is missing from the new monorepo backend.
- **Reactivation**: Only required if the new backend fails to provide critical services (e.g., PDF generation) that were present in this specific legacy version.
