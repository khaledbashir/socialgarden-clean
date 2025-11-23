# AnythingLLM Integration Blueprint
**For: Standalone Integration in a Separate Project**

**Status:** Ready to deploy. Only requires 3 inputs from you before handing to AI or new instance.

---

## Table of Contents
1. [Overview & Purpose](#overview--purpose)
2. [Pre-Deployment: Required Inputs](#pre-deployment-required-inputs)
3. [Environment Variables & Configuration](#environment-variables--configuration)
4. [API Endpoints & Request/Response Contracts](#api-endpoints--requestresponse-contracts)
5. [Example Requests (cURL & TypeScript)](#example-requests-curl--typescript)
6. [Message Shapes & System Prompts](#message-shapes--system-prompts)
7. [Idempotency & Retry Logic](#idempotency--retry-logic)
8. [Rate Limiting & Throttling](#rate-limiting--throttling)
9. [Security & Webhook Verification](#security--webhook-verification)
10. [Logging, Observability & Monitoring](#logging-observability--monitoring)
11. [Smoke Tests & Validation Checklist](#smoke-tests--validation-checklist)
12. [Troubleshooting & Common Issues](#troubleshooting--common-issues)
13. [Mapping to Original Repo Files](#mapping-to-original-repo-files)
14. [Test Data & Sample Payloads](#test-data--sample-payloads)
15. [Runbook: Operational Tips](#runbook-operational-tips)

---

## Overview & Purpose

This document provides **complete specifications** for integrating with a standalone AnythingLLM instance. You will provide:
- Instance base URL
- API key (token)
- One or more workspace slugs

Everything else—endpoints, security, retry logic, test procedures, and operational best practices—is fully detailed here. An AI assistant or developer can implement this with no ambiguity.

**Key principles:**
- Synchronous and streaming chat support
- Idempotent requests with deduplication
- Graceful retry and rate-limit handling
- Webhook callbacks for async workflows
- Full observability with structured logging
- Comprehensive test suite for validation

---

## Pre-Deployment: Required Inputs

Before using this blueprint, collect these three items from your AnythingLLM deployment team:

```
ANYTHINGLLM_BASE_URL = https://anythingllm.example.com
ANYTHINGLLM_API_KEY = sk-xxxxxxxxxxxxxxxxxxxx
WORKSPACE_SLUG = workspace-name
```

**Optional inputs** (for advanced features):
- `MODEL_SLUG` — specific model to target (e.g., `gpt-4`, `claude-3`)
- `CALLBACK_WEBHOOK_URL` — URL to receive async completion callbacks
- `WEBHOOK_SECRET` — shared secret for HMAC signature verification

---

## Environment Variables & Configuration

Set these in your `.env` or deployment config:

```bash
# Required
ANYTHINGLLM_BASE_URL=https://anythingllm.example.com
ANYTHINGLLM_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
ANYTHINGLLM_WORKSPACE_SLUG=workspace-name

# Optional
ANYTHINGLLM_MODEL_SLUG=gpt-4
ANYTHINGLLM_CALLBACK_WEBHOOK_URL=https://yourapp.com/webhooks/anythingllm
ANYTHINGLLM_WEBHOOK_SECRET=your-secret-key
ANYTHINGLLM_REQUEST_TIMEOUT_MS=30000
ANYTHINGLLM_MAX_RETRIES=5
ANYTHINGLLM_RETRY_INITIAL_DELAY_MS=500
```

**Notes:**
- Keep `ANYTHINGLLM_API_KEY` secret. Rotate periodically.
- `ANYTHINGLLM_REQUEST_TIMEOUT_MS` defaults to 30 seconds. Adjust if generation is slower or faster.
- `ANYTHINGLLM_MAX_RETRIES` applies to 429 and 5xx responses only.

---

## API Endpoints & Request/Response Contracts

### 1. Authentication
All requests must include the authorization header:
```
Authorization: Bearer <ANYTHINGLLM_API_KEY>
```

**Status codes:**
- `200` — OK
- `400` — Bad request (malformed body, missing required fields)
- `401` — Unauthorized (bad or missing token)
- `403` — Forbidden (insufficient privileges)
- `429` — Rate limit exceeded
- `500–503` — Server error

---

### 2. Chat Endpoint (Synchronous)

**Request:**
```
POST <ANYTHINGLLM_BASE_URL>/v1/chat
```

**Headers:**
```
Authorization: Bearer <ANYTHINGLLM_API_KEY>
Content-Type: application/json
```

**Request Body:**
```json
{
  "workspace": "<WORKSPACE_SLUG>",
  "model": "<MODEL_SLUG>",
  "messages": [
    {
      "role": "system",
      "content": "You are an expert SOW assistant..."
    },
    {
      "role": "user",
      "content": "Generate an SOW for..."
    }
  ],
  "metadata": {
    "userId": "<USER_ID>",
    "conversationId": "<UUID>",
    "requestId": "<UNIQUE_ID>",
    "source": "frontend-sow",
    "origin": "portal/sow/editor"
  },
  "stream": false,
  "max_tokens": 1500,
  "temperature": 0.0,
  "top_p": 1.0,
  "stop": null
}
```

**Response (200 OK):**
```json
{
  "id": "chat_abc123xyz",
  "object": "chat.completion",
  "created": 1697500000,
  "model": "<MODEL_SLUG>",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Here is your SOW:\n\n# Executive Summary\n..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 120,
    "completion_tokens": 450,
    "total_tokens": 570
  }
}
```

**Response (Error):**
```json
{
  "error": {
    "code": "invalid_request",
    "message": "Missing required field: messages",
    "type": "invalid_request_error",
    "retryable": false
  }
}
```

---

### 3. Chat Endpoint (Streaming)

**Request:**
```
POST <ANYTHINGLLM_BASE_URL>/v1/chat
```

**Request Body (same as sync, but with `"stream": true`):**
```json
{
  "workspace": "<WORKSPACE_SLUG>",
  "messages": [...],
  "stream": true
}
```

**Response (200 OK - Server-Sent Events or newline-delimited JSON):**
```
data: {"event": "start", "id": "chat_abc123"}
data: {"event": "delta", "choices": [{"index": 0, "delta": {"role": "assistant", "content": "Here"}}]}
data: {"event": "delta", "choices": [{"index": 0, "delta": {"role": "assistant", "content": " is"}}]}
data: {"event": "delta", "choices": [{"index": 0, "delta": {"role": "assistant", "content": " your"}}]}
...
data: {"event": "done", "choices": [{"index": 0, "finish_reason": "stop"}], "usage": {"total_tokens": 570}}
```

Or as newline-delimited JSON:
```json
{"event": "start", "id": "chat_abc123"}
{"event": "delta", "choices": [{"index": 0, "delta": {"role": "assistant", "content": "Here"}}]}
{"event": "delta", "choices": [{"index": 0, "delta": {"role": "assistant", "content": " is"}}]}
...
{"event": "done", "choices": [{"index": 0, "finish_reason": "stop"}], "usage": {"total_tokens": 570}}
```

---

### 4. Workspace Document Fetch

**Request:**
```
GET <ANYTHINGLLM_BASE_URL>/v1/workspaces/<WORKSPACE_SLUG>/documents/<DOC_SLUG>
```

**Headers:**
```
Authorization: Bearer <ANYTHINGLLM_API_KEY>
```

**Response (200 OK):**
```json
{
  "id": "doc_xyz",
  "slug": "<DOC_SLUG>",
  "title": "Sample Document",
  "content": "Full text or HTML content...",
  "metadata": {
    "createdAt": "2023-10-15T10:00:00Z",
    "updatedAt": "2023-10-16T14:30:00Z",
    "source": "pdf"
  }
}
```

---

### 5. Webhook Callback (Async Completion)

If you configure `ANYTHINGLLM_CALLBACK_WEBHOOK_URL`, the server will POST to your callback on chat completion:

**Request (POST from AnythingLLM to your server):**
```
POST <YOUR_CALLBACK_WEBHOOK_URL>
```

**Headers:**
```
Content-Type: application/json
X-AnythingLLM-Signature: sha256=<HMAC_HEX>
X-AnythingLLM-Timestamp: <UNIX_TIMESTAMP>
```

**Body:**
```json
{
  "type": "chat.completion.finished",
  "id": "chat_abc123",
  "workspace": "<WORKSPACE_SLUG>",
  "status": "completed",
  "result": {
    "choices": [
      {
        "message": {
          "role": "assistant",
          "content": "Generated response..."
        },
        "finish_reason": "stop"
      }
    ],
    "usage": {
      "total_tokens": 570
    }
  },
  "timestamp": 1697500000
}
```

---

## Example Requests (cURL & TypeScript)

### cURL: Synchronous Chat

```bash
curl -s -X POST "https://anythingllm.example.com/v1/chat" \
  -H "Authorization: Bearer sk-xxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "workspace": "workspace-name",
    "model": "gpt-4",
    "messages": [
      {
        "role": "system",
        "content": "You are an expert SOW generator. Always ask clarifying questions when intent is ambiguous. Return structured JSON when requested."
      },
      {
        "role": "user",
        "content": "Generate a detailed 5-step SOW for building a mobile app."
      }
    ],
    "metadata": {
      "userId": "user-123",
      "conversationId": "conv-uuid-1234",
      "requestId": "req-uuid-5678",
      "source": "frontend-sow"
    },
    "stream": false,
    "temperature": 0.0,
    "max_tokens": 2000
  }'
```

---

### cURL: Streaming Chat

```bash
curl -s -X POST "https://anythingllm.example.com/v1/chat" \
  -H "Authorization: Bearer sk-xxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "workspace": "workspace-name",
    "stream": true,
    "messages": [
      {
        "role": "user",
        "content": "Generate a quick 2-sentence summary of SOW best practices."
      }
    ]
  }'
```

---

### TypeScript / Node.js: Sync Chat with Retry

```typescript
import crypto from 'crypto';

interface AnythingLLMConfig {
  baseUrl: string;
  apiKey: string;
  workspaceSlug: string;
  modelSlug?: string;
  maxRetries?: number;
  retryInitialDelayMs?: number;
  timeoutMs?: number;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  workspace: string;
  model?: string;
  messages: ChatMessage[];
  metadata?: Record<string, any>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

interface ChatResponse {
  id: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function exponentialBackoff(attempt: number, initialDelayMs: number): number {
  const maxDelayMs = 8000;
  const delayMs = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);
  const jitterMs = Math.random() * (delayMs * 0.1);
  return delayMs + jitterMs;
}

async function chatWithRetry(
  config: AnythingLLMConfig,
  request: ChatRequest
): Promise<ChatResponse> {
  const maxRetries = config.maxRetries ?? 5;
  const retryInitialDelayMs = config.retryInitialDelayMs ?? 500;
  const timeoutMs = config.timeoutMs ?? 30000;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${config.baseUrl}/v1/chat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace: request.workspace || config.workspaceSlug,
          model: request.model || config.modelSlug,
          messages: request.messages,
          metadata: request.metadata || {},
          stream: request.stream ?? false,
          temperature: request.temperature ?? 0.0,
          max_tokens: request.max_tokens ?? 1500,
          top_p: request.top_p ?? 1.0,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutHandle);

      if (response.ok) {
        return await response.json();
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delayMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : exponentialBackoff(attempt, retryInitialDelayMs);
        console.log(`Rate limited. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delayMs);
        continue;
      }

      if (response.status >= 500) {
        const delayMs = exponentialBackoff(attempt, retryInitialDelayMs);
        console.log(`Server error (${response.status}). Retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delayMs);
        continue;
      }

      // 4xx errors are not retryable
      const errorBody = await response.text();
      throw new Error(`AnythingLLM API error: ${response.status} ${errorBody}`);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`AnythingLLM request timeout after ${timeoutMs}ms`);
      }
      lastError = error;

      if (attempt < maxRetries - 1) {
        const delayMs = exponentialBackoff(attempt, retryInitialDelayMs);
        console.log(`Request failed: ${error.message}. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delayMs);
      }
    }
  }

  throw new Error(`All ${maxRetries} retry attempts failed. Last error: ${lastError?.message}`);
}

// Example usage
(async () => {
  const config: AnythingLLMConfig = {
    baseUrl: process.env.ANYTHINGLLM_BASE_URL!,
    apiKey: process.env.ANYTHINGLLM_API_KEY!,
    workspaceSlug: process.env.ANYTHINGLLM_WORKSPACE_SLUG!,
    modelSlug: process.env.ANYTHINGLLM_MODEL_SLUG || 'gpt-4',
    maxRetries: parseInt(process.env.ANYTHINGLLM_MAX_RETRIES || '5', 10),
    retryInitialDelayMs: parseInt(process.env.ANYTHINGLLM_RETRY_INITIAL_DELAY_MS || '500', 10),
    timeoutMs: parseInt(process.env.ANYTHINGLLM_REQUEST_TIMEOUT_MS || '30000', 10),
  };

  const response = await chatWithRetry(config, {
    workspace: config.workspaceSlug,
    messages: [
      { role: 'system', content: 'You are an expert SOW generator.' },
      { role: 'user', content: 'Generate a 3-step SOW for a design project.' },
    ],
    metadata: { userId: 'user-123', conversationId: 'conv-uuid' },
  });

  console.log('Response:', JSON.stringify(response, null, 2));
})();
```

---

### TypeScript / Node.js: Streaming Chat

```typescript
async function streamChat(config: AnythingLLMConfig, request: ChatRequest): Promise<void> {
  const response = await fetch(`${config.baseUrl}/v1/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workspace: request.workspace || config.workspaceSlug,
      messages: request.messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Stream error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const json = JSON.parse(line.slice(6));
          if (json.event === 'delta' && json.choices?.[0]?.delta?.content) {
            process.stdout.write(json.choices[0].delta.content);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }
  }

  console.log('\n[Stream complete]');
}

// Usage:
// await streamChat(config, { messages: [...] });
```

---

### TypeScript / Node.js: Webhook Signature Verification

```typescript
function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
  timestamp: string,
  maxAgeSeconds: number = 300
): boolean {
  // Check timestamp (prevent replay attacks)
  const signedTime = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - signedTime > maxAgeSeconds) {
    console.warn('Webhook timestamp too old, possible replay attack');
    return false;
  }

  // Verify HMAC signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const expected = `sha256=${hmac.digest('hex')}`;

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch (e) {
    return false;
  }
}

// Express.js example
app.post('/webhooks/anythingllm', (req, res) => {
  const signature = req.headers['x-anythingllm-signature'] as string;
  const timestamp = req.headers['x-anythingllm-timestamp'] as string;
  const rawBody = JSON.stringify(req.body);

  if (!verifyWebhookSignature(rawBody, signature, process.env.ANYTHINGLLM_WEBHOOK_SECRET!, timestamp)) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  console.log('Webhook verified and payload:', req.body);
  res.json({ success: true });
});
```

---

## Message Shapes & System Prompts

### System Prompt Template for SOW Generation

```json
{
  "role": "system",
  "content": "You are an expert SOW (Statement of Work) generator specializing in creating detailed, professional project blueprints.\n\nGuidelines:\n1. Always ask clarifying questions when project intent or scope is ambiguous.\n2. When requested, return structured JSON with fields: title, summary, scope, deliverables[], timeline[], risks[], budget_estimate.\n3. When requested, return plain text in Markdown format with clear sections.\n4. Ensure all SOWs are complete, measurable, and client-ready.\n5. Follow security and PII redaction rules: never include actual credentials, API keys, or sensitive personal data.\n6. When generating timelines, use realistic estimates and include buffer time.\n7. If the client name is provided, personalize the SOW with their name and context.\n\nResponse format: Default to plain text unless requested otherwise. For JSON responses, wrap in a code block:\n```json\n{ ... }\n```"
}
```

### Example: User Message for SOW Generation

```json
{
  "role": "user",
  "content": "Client name: Acme Corp. Project: Build a mobile app for iOS and Android. Timeline: 6 months. Budget: $150k. Generate a comprehensive SOW in JSON format."
}
```

### Expected Assistant Response (excerpt)

```json
{
  "role": "assistant",
  "content": "```json\n{\n  \"title\": \"Statement of Work: Acme Corp Mobile App\",\n  \"summary\": \"Development of a native iOS and Android mobile application for Acme Corp over 6 months with a budget of $150,000.\",\n  \"scope\": \"...\",\n  \"deliverables\": [\n    { \"id\": 1, \"title\": \"Requirements Gathering\", \"duration\": \"2 weeks\" },\n    { \"id\": 2, \"title\": \"Design & Prototypes\", \"duration\": \"4 weeks\" }\n  ],\n  \"timeline\": [...],\n  \"risks\": [...],\n  \"budget_estimate\": 150000\n}\n```"
}
```

---

## Idempotency & Retry Logic

### Request Idempotency

To ensure safe retries and deduplication, always include a `requestId` in metadata:

```json
{
  "metadata": {
    "requestId": "req-<UUID>",
    "userId": "<USER_ID>",
    "conversationId": "<CONV_ID>"
  }
}
```

**Behavior:**
- First request: processed normally, result cached.
- Retry with same `requestId`: server returns cached result (409 Conflict with cached response, or 200 with result).
- Different `requestId`: treated as new request.

---

### Retry Strategy (Exponential Backoff + Jitter)

Apply this retry logic for 429 and 5xx responses:

```
attempt 0: wait 500ms + jitter(50ms)    = ~500-550ms
attempt 1: wait 1000ms + jitter(100ms)  = ~1000-1100ms
attempt 2: wait 2000ms + jitter(200ms)  = ~2000-2200ms
attempt 3: wait 4000ms + jitter(400ms)  = ~4000-4400ms
attempt 4: wait 8000ms + jitter(800ms)  = ~8000-8800ms (max 8s)
```

Do **not** retry on 4xx errors (except 429).

---

## Rate Limiting & Throttling

### Rate Limit Headers

The AnythingLLM server will return:
- `X-RateLimit-Limit: 100` — requests per window
- `X-RateLimit-Remaining: 45` — remaining in current window
- `X-RateLimit-Reset: 1697500060` — Unix timestamp when window resets
- `Retry-After: 60` — seconds to wait (on 429)

### Client-Side Throttling (In-Memory Queue)

```typescript
class AnythingLLMThrottler {
  private queue: Array<() => Promise<any>> = [];
  private concurrent = 0;
  private maxConcurrent = 3; // Adjust as needed

  async throttle(fn: () => Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.concurrent >= this.maxConcurrent || this.queue.length === 0) return;

    this.concurrent++;
    const fn = this.queue.shift();
    if (fn) {
      await fn();
    }
    this.concurrent--;
    this.process();
  }
}
```

---

## Security & Webhook Verification

### API Key Security

- **Storage**: Use a secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault, Vercel KV).
- **Rotation**: Rotate API keys every 90 days or on suspicious activity.
- **Scoping**: Use workspace-scoped keys if your AnythingLLM instance supports it.
- **Audit**: Log all API key usage to detect abuse.

### Webhook Signature Verification

All webhook requests are signed with HMAC SHA256:

```
X-AnythingLLM-Signature: sha256=<HMAC_HEX>
X-AnythingLLM-Timestamp: <UNIX_TIMESTAMP>
```

**Verification steps:**
1. Extract signature and timestamp from headers.
2. Check timestamp is within acceptable window (e.g., 300s).
3. Recompute HMAC: `HMAC-SHA256(raw_body, webhook_secret)`.
4. Compare with signature using timing-safe comparison.

See TypeScript example above (Webhook Signature Verification section).

### HTTPS & TLS

- **All requests** must use HTTPS (TLS 1.2+).
- **Certificate pinning** (optional): pin the AnythingLLM instance certificate to prevent MITM.
- **API key in transit**: never log or expose API keys in logs or error messages.

---

## Logging, Observability & Monitoring

### Structured Logging

Log all requests and responses with structured data (JSON):

```json
{
  "timestamp": "2023-10-15T10:30:45Z",
  "level": "INFO",
  "service": "anythingllm-client",
  "requestId": "req-uuid-1234",
  "conversationId": "conv-uuid-5678",
  "userId": "user-123",
  "method": "POST",
  "endpoint": "/v1/chat",
  "status": 200,
  "latencyMs": 1250,
  "promptTokens": 120,
  "completionTokens": 450,
  "totalTokens": 570,
  "model": "gpt-4",
  "workspace": "workspace-name",
  "retryAttempt": 0
}
```

### Metrics to Expose

- `anythingllm_requests_total{endpoint, status, model, workspace}` — total requests
- `anythingllm_requests_failed{reason}` — failures (timeout, auth, rate_limit, server_error)
- `anythingllm_latency_ms{endpoint}` — response latency histogram
- `anythingllm_tokens_used_total{model, type}` — token consumption (prompt, completion, total)
- `anythingllm_rate_limit_remaining{}` — current rate limit headroom

### Alerts & Thresholds

Set alerts for:
- `error_rate > 5%` in 5-minute window
- `p99_latency > 10000ms` (10 seconds)
- `requests_429 > 10` in 1-minute window (rate limiting spike)
- `requests_timeout > 3` in 5-minute window
- `tokens_per_min > <threshold>` (cost control)

### Example: Pino Logger Setup (Node.js)

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

function logChatRequest(requestId: string, messages: ChatMessage[], metadata: any) {
  logger.info(
    {
      requestId,
      messageCount: messages.length,
      userId: metadata.userId,
      conversationId: metadata.conversationId,
    },
    'Chat request initiated'
  );
}

function logChatResponse(requestId: string, latencyMs: number, usage: any, status: number) {
  logger.info(
    {
      requestId,
      latencyMs,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      status,
    },
    'Chat response received'
  );
}

function logChatError(requestId: string, error: Error, retryAttempt: number) {
  logger.error(
    {
      requestId,
      error: error.message,
      stack: error.stack,
      retryAttempt,
    },
    'Chat error occurred'
  );
}
```

---

## Smoke Tests & Validation Checklist

Run these tests after deployment to ensure the integration is working:

### Test 1: Authentication
**Goal**: Verify API key is valid.

```bash
curl -s -X GET "https://anythingllm.example.com/health" \
  -H "Authorization: Bearer $ANYTHINGLLM_API_KEY" | jq .
```

**Expected**: `200 OK` with `{"status": "ok", ...}`

---

### Test 2: Missing Authentication
**Goal**: Verify requests without auth are rejected.

```bash
curl -s -X GET "https://anythingllm.example.com/health" | jq .
```

**Expected**: `401 Unauthorized`

---

### Test 3: Synchronous Chat
**Goal**: Send a simple prompt and verify response.

```bash
curl -s -X POST "https://anythingllm.example.com/v1/chat" \
  -H "Authorization: Bearer $ANYTHINGLLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "workspace": "<WORKSPACE_SLUG>",
    "messages": [
      {"role": "system", "content": "You are helpful."},
      {"role": "user", "content": "Write a 1-line hello message."}
    ],
    "stream": false
  }' | jq .choices[0].message.content
```

**Expected**: Non-empty string, e.g., `"Hello! I'm here to help."`

---

### Test 4: Streaming Chat
**Goal**: Verify streaming returns chunked responses.

```bash
curl -s -X POST "https://anythingllm.example.com/v1/chat" \
  -H "Authorization: Bearer $ANYTHINGLLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "workspace": "<WORKSPACE_SLUG>",
    "messages": [{"role": "user", "content": "Write 5 words."}],
    "stream": true
  }'
```

**Expected**: Multiple lines starting with `data: {...}` or newline-delimited JSON chunks.

---

### Test 5: Rate Limiting
**Goal**: Verify 429 behavior under load.

```bash
for i in {1..50}; do
  curl -s -X POST "https://anythingllm.example.com/v1/chat" \
    -H "Authorization: Bearer $ANYTHINGLLM_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"workspace":"<WORKSPACE_SLUG>","messages":[{"role":"user","content":"Hi"}],"stream":false}' &
done
wait
```

**Expected**: Some requests succeed (200), some return `429 Too Many Requests`. Check `Retry-After` header.

---

### Test 6: Document Retrieval
**Goal**: Fetch a document from the workspace.

```bash
curl -s -X GET "https://anythingllm.example.com/v1/workspaces/<WORKSPACE_SLUG>/documents/<DOC_SLUG>" \
  -H "Authorization: Bearer $ANYTHINGLLM_API_KEY" | jq .
```

**Expected**: `200 OK` with document content and metadata.

---

### Test 7: Webhook Callback (if configured)
**Goal**: Verify webhook delivery and signature.

```bash
# Set CALLBACK_WEBHOOK_URL and trigger a chat with webhook configured.
# Check your server logs for incoming POST request.
# Verify signature using shared secret.
```

**Expected**: POST request with valid HMAC signature received at callback URL.

---

### Test 8: Error Handling
**Goal**: Verify proper error responses.

```bash
# Send malformed request
curl -s -X POST "https://anythingllm.example.com/v1/chat" \
  -H "Authorization: Bearer $ANYTHINGLLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages": []}' | jq .
```

**Expected**: `400 Bad Request` with error message indicating missing `workspace` field.

---

### Quick Validation Script (Node.js)

```typescript
import fetch from 'node-fetch';

async function runSmokeTests() {
  const baseUrl = process.env.ANYTHINGLLM_BASE_URL;
  const apiKey = process.env.ANYTHINGLLM_API_KEY;
  const workspace = process.env.ANYTHINGLLM_WORKSPACE_SLUG;

  const tests = [
    {
      name: 'Health Check',
      fn: async () => {
        const res = await fetch(`${baseUrl}/health`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      },
    },
    {
      name: 'Sync Chat',
      fn: async () => {
        const res = await fetch(`${baseUrl}/v1/chat`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace,
            messages: [{ role: 'user', content: 'Hello' }],
            stream: false,
          }),
        });
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const data = await res.json();
        if (!data.choices?.[0]?.message?.content) throw new Error('No content in response');
      },
    },
    {
      name: 'Auth Required',
      fn: async () => {
        const res = await fetch(`${baseUrl}/v1/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspace, messages: [] }),
        });
        if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
      },
    },
  ];

  for (const test of tests) {
    try {
      await test.fn();
      console.log(`✅ ${test.name}`);
    } catch (error) {
      console.error(`❌ ${test.name}: ${error}`);
    }
  }
}

runSmokeTests();
```

---

## Troubleshooting & Common Issues

### Issue: 400 Bad Request

**Symptoms**: `{"error": {"code": "invalid_request", "message": "..."}}`

**Causes & fixes:**
- Missing `workspace` field in request body. Ensure it's included and matches your workspace slug.
- Invalid JSON in request body. Validate JSON syntax.
- Empty `messages` array. Ensure at least one user or system message.
- Typo in header names or values.

**Debug**: Log the full request body before sending:
```typescript
console.log('Request:', JSON.stringify(body, null, 2));
```

---

### Issue: 401 Unauthorized

**Symptoms**: `{"error": {"code": "unauthorized", "message": "Invalid or expired token"}}`

**Causes & fixes:**
- API key is missing or malformed.
- API key has expired. Request a new one from your deployment team.
- API key doesn't have permission for the workspace. Verify the key's scope.
- Bearer token syntax is wrong. Use: `Authorization: Bearer <KEY>` (note the space).

**Debug**:
```bash
echo "API Key: ${ANYTHINGLLM_API_KEY:0:10}..." # First 10 chars only
curl -I -H "Authorization: Bearer ${ANYTHINGLLM_API_KEY}" https://anythingllm.example.com/health
```

---

### Issue: 429 Too Many Requests

**Symptoms**: `{"error": {"code": "rate_limit_exceeded", "message": "Rate limit exceeded"}}`

**Causes & fixes:**
- Sending too many requests in parallel or within a short time.
- Workspace or API key has hit its per-minute/hour limit.

**Debug & mitigate:**
- Check `X-RateLimit-Remaining` header to monitor quota.
- Implement client-side throttling (see Rate Limiting section).
- Respect `Retry-After` header and back off.
- Request higher limits from your deployment team.

---

### Issue: 500 Server Error

**Symptoms**: `{"error": {"code": "server_error", "message": "..."}}`

**Causes & fixes:**
- AnythingLLM service is temporarily down or restarting.
- Model is unavailable or crashed.
- Database connection issue.
- Out of memory or resource constraints.

**Debug & mitigate:**
- Check AnythingLLM service status and logs.
- Implement retry logic with exponential backoff (see Retry Logic section).
- Check server resource usage (CPU, memory, disk).
- Increase timeout or add a job queue for long-running requests.

---

### Issue: Request Timeout

**Symptoms**: `AbortError: The operation was aborted` (client-side) or no response after 30s.

**Causes & fixes:**
- Server is slow to respond (heavy LLM model, large context).
- Network latency is high.
- Client timeout is set too low.

**Debug & mitigate:**
- Increase client-side timeout (e.g., 60s instead of 30s).
- Check server latency: `curl -w 'Total: %{time_total}s\n' <endpoint>`
- Implement async job queueing instead of blocking waits.
- Check model resource allocation and make sure it's not bottlenecked.

---

### Issue: Streaming Chat Never Completes

**Symptoms**: Chunks arrive but stream never ends (no `finish_reason`).

**Causes & fixes:**
- Server crashed or connection dropped mid-stream.
- Client stopped reading chunks prematurely.
- Token limit is set too high, causing infinite generation.

**Debug & mitigate:**
- Add a timeout to stream reader.
- Set reasonable `max_tokens` (e.g., 2000).
- Check server logs for errors.
- Implement stream reconnection logic.

---

### Issue: Webhook Signature Mismatch

**Symptoms**: Webhook payload arrives but signature verification fails.

**Causes & fixes:**
- Webhook secret is incorrect or mismatched.
- Raw body was modified before verification (e.g., JSON parsing changed formatting).
- Timestamp is too old (replay protection).

**Debug & mitigate:**
- Use the **raw request body** (not parsed JSON) for signature verification.
- Ensure webhook secret matches what's configured on the server.
- Check timestamp is within 5 minutes of current time.

**Example verification (Node.js):**
```typescript
// ❌ Wrong: Using req.body (parsed)
const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');

// ✅ Correct: Using raw request body
app.use(express.raw({ type: 'application/json' }));
app.post('/webhook', (req, res) => {
  const signature = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
  // ...
});
```

---

### Issue: Chat Response is Truncated or Incomplete

**Symptoms**: Response ends abruptly, missing sentences or structure.

**Causes & fixes:**
- `max_tokens` limit reached. Increase it.
- Model ran out of context window. Reduce message history or chunk the prompt.
- Streaming reader didn't receive all chunks.

**Debug & mitigate:**
- Check `finish_reason` in response: `stop` = normal completion, `length` = token limit hit, `content_filter` = safety filter triggered.
- If `finish_reason: "length"`, increase `max_tokens`.
- For streaming, ensure reader waits for final chunk with `event: done`.

---

### Issue: AnythingLLM Instance is Unreachable

**Symptoms**: `ECONNREFUSED` or `ENOTFOUND` or connection timeout.

**Causes & fixes:**
- Instance URL is incorrect or typo.
- Instance is down or not started.
- Firewall or network policy is blocking the connection.
- DNS resolution failed.

**Debug & mitigate:**
- Verify URL: `echo $ANYTHINGLLM_BASE_URL`
- Check connectivity: `curl -v https://<instance>/health` (or `http://` if testing locally)
- Ping the instance: `ping <hostname>`
- Check firewall rules and VPN/proxy settings.
- Start the instance service and verify it's listening on the correct port.

---

## Mapping to Original Repo Files

This blueprint is based on the production setup in the `the11` repository. Below are key files you can reference if issues arise:

### Frontend Integration
- **File**: `frontend/app/api/anythingllm/chat/route.ts`
- **Purpose**: Routes chat requests from the frontend to AnythingLLM.
- **Key behaviors**:
  - 30-second AbortController timeout (tunable via env).
  - Forwards `NEXT_PUBLIC_PDF_SERVICE_URL` for PDF generation after chat.
  - Handles metadata and conversation ID routing.
  - Returns 500 if fetch to AnythingLLM fails.

### Backend PDF Service
- **File**: `backend/main.py`
- **Purpose**: Renders HTML to PDF using WeasyPrint.
- **Key behaviors**:
  - Receives HTML from frontend converted via TipTap.
  - Embeds critical CSS to avoid WeasyPrint timeouts.
  - Returns 500 if rendering fails (check logs).

### Development Setup
- **File**: `DEV_SETUP.md`
- **Purpose**: Local environment setup instructions.
- **Relevant**: Shows how to set env vars and start services locally.

### Process Management (PM2)
- **File**: `ecosystem.config.js`
- **Purpose**: Production process management with PM2.
- **Relevant**: Defines `sow-frontend` and `sow-backend` process names and log locations.

### Configuration & Environment
- **File**: `.env.example` or `.env` (if shared in your repo)
- **Purpose**: Defines all env variables.
- **Relevant**: Lists `ANYTHINGLLM_BASE_URL`, `ANYTHINGLLM_API_KEY`, `ANYTHINGLLM_WORKSPACE_SLUG`, etc.

---

## Test Data & Sample Payloads

### Sample Request 1: Simple Hello

```json
{
  "workspace": "workspace-name",
  "messages": [
    {
      "role": "user",
      "content": "Say hello in one sentence."
    }
  ],
  "stream": false
}
```

**Expected response:**
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! I'm here and ready to assist you with anything you need."
      }
    }
  ]
}
```

---

### Sample Request 2: SOW Generation (Structured)

```json
{
  "workspace": "workspace-name",
  "messages": [
    {
      "role": "system",
      "content": "You are an expert SOW generator. Return responses in JSON format with fields: title, summary, deliverables (array of {id, title, description})."
    },
    {
      "role": "user",
      "content": "Generate an SOW for building a landing page for a SaaS product. Timeline: 2 weeks. Budget: $5,000. Format as JSON."
    }
  ],
  "stream": false,
  "temperature": 0.0,
  "max_tokens": 2000
}
```

**Expected response (excerpt):**
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "```json\n{\n  \"title\": \"Statement of Work: SaaS Product Landing Page\",\n  \"summary\": \"Design and development of a responsive landing page for a SaaS product over 2 weeks with a $5,000 budget.\",\n  \"deliverables\": [\n    {\"id\": 1, \"title\": \"Requirements & Design\", \"description\": \"Gather requirements, create mockups, and get client approval.\"},\n    {\"id\": 2, \"title\": \"Frontend Development\", \"description\": \"Build responsive HTML/CSS/JS frontend.\"}\n  ]\n}\n```"
      }
    }
  ]
}
```

---

### Sample Request 3: Multi-Turn Conversation

```json
{
  "workspace": "workspace-name",
  "messages": [
    {
      "role": "system",
      "content": "You are an SOW assistant. Ask clarifying questions if needed."
    },
    {
      "role": "user",
      "content": "I need an SOW for a mobile app project."
    },
    {
      "role": "assistant",
      "content": "Great! I'd like to understand your project better. Could you provide:\n1. Platform (iOS, Android, or both)?\n2. Estimated timeline?\n3. Core features?"
    },
    {
      "role": "user",
      "content": "iOS and Android, 6 months, core features: user auth, messaging, payments."
    }
  ],
  "stream": false
}
```

---

## Runbook: Operational Tips

### Starting the AnythingLLM Instance

1. Verify environment variables are set:
   ```bash
   echo "Base URL: $ANYTHINGLLM_BASE_URL"
   echo "API Key: ${ANYTHINGLLM_API_KEY:0:10}..."
   echo "Workspace: $ANYTHINGLLM_WORKSPACE_SLUG"
   ```

2. Start the instance (depends on your deployment):
   ```bash
   # Docker example
   docker run -d -p 8080:8080 -e ANYTHINGLLM_API_KEY=$ANYTHINGLLM_API_KEY anythingllm
   
   # Or using PM2
   pm2 start ecosystem.config.js --name anythingllm
   ```

3. Wait for health check to pass:
   ```bash
   until curl -s -f http://localhost:8080/health > /dev/null; do sleep 1; done
   echo "Instance is ready!"
   ```

---

### Monitoring Instance Health

**Regular checks:**
```bash
# Every 5 minutes, check health and log status
while true; do
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)
  echo "$(date): Health check status = $status"
  sleep 300
done
```

**Alert on failures:**
```bash
# Alert if 3 consecutive health checks fail
failures=0
while true; do
  if ! curl -s -f http://localhost:8080/health > /dev/null; then
    failures=$((failures + 1))
    if [ $failures -ge 3 ]; then
      echo "ALERT: AnythingLLM instance is down! Check logs and restart."
      # Send alert (email, Slack, PagerDuty, etc.)
    fi
  else
    failures=0
  fi
  sleep 60
done
```

---

### Viewing Logs

```bash
# Docker: stream logs
docker logs -f <container_id>

# PM2: view latest logs
pm2 logs anythingllm

# File-based: tail logs
tail -f /var/log/anythingllm/app.log
```

**Look for:**
- Error messages or stack traces.
- 5xx response counts (potential issues).
- Slow request latencies (potential bottlenecks).
- Memory or CPU spikes.

---

### Restarting the Instance

```bash
# Graceful restart (finish in-flight requests)
pm2 restart anythingllm

# Hard restart (immediate stop and start)
pm2 restart anythingllm --force

# Restart after config change
pm2 restart anythingllm --update-env
```

---

### API Key Rotation

1. **Generate new key** from AnythingLLM admin panel.
2. **Update environment** with new key:
   ```bash
   export ANYTHINGLLM_API_KEY=<new_key>
   pm2 restart anythingllm --update-env
   ```
3. **Monitor** for any auth failures.
4. **Revoke old key** in AnythingLLM admin after 24 hours.

---

### Debugging a Failed Request

1. **Enable debug logging** (if supported):
   ```bash
   export LOG_LEVEL=debug
   pm2 restart anythingllm --update-env
   ```

2. **Reproduce the issue** with a test request:
   ```bash
   curl -v -X POST "$ANYTHINGLLM_BASE_URL/v1/chat" \
     -H "Authorization: Bearer $ANYTHINGLLM_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{...}' 2>&1 | tee request.log
   ```

3. **Analyze logs**:
   - Check timestamps and request IDs.
   - Look for error messages, stack traces, or resource warnings.
   - Correlate with server-side logs.

4. **Check resources**:
   ```bash
   ps aux | grep anythingllm  # Memory, CPU usage
   df -h                       # Disk space
   free -h                     # RAM availability
   ```

5. **Test connectivity**:
   ```bash
   curl -I $ANYTHINGLLM_BASE_URL/health
   nslookup <hostname>
   ```

---

### Scaling Recommendations

- **Concurrent users**: Monitor `anythingllm_requests_in_flight`. If consistently > 10, consider:
  - Load balancing multiple instances.
  - Increasing model replicas or GPU allocation.
  - Implementing request queuing.

- **Token consumption**: Track `anythingllm_tokens_used_total`. If approaching quota:
  - Reduce `max_tokens` per request.
  - Implement caching for repeated queries.
  - Request higher quota from your provider.

- **Latency**: If p99 latency > 10 seconds:
  - Profile the model and check for bottlenecks.
  - Verify GPU/CPU allocation is adequate.
  - Consider smaller model or prompt caching.

---

## Summary

This blueprint provides everything needed to integrate with a standalone AnythingLLM instance. Key takeaways:

1. **Provide only**: Instance URL, API key, workspace slugs.
2. **Follow**: API contracts, retry logic, security best practices.
3. **Test**: Run smoke tests to validate.
4. **Monitor**: Track metrics and logs for operational health.
5. **Troubleshoot**: Refer to the troubleshooting section for common issues.

You're ready to hand this to a new project or AI assistant. They need only fill in the 3 required inputs at the top, and they can implement integration with full confidence.

---

**Version**: 1.0  
**Last Updated**: October 20, 2025  
**Author**: Blueprint Generator  
**License**: Internal Use Only

