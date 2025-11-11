# SOW Workspace Flow: AnythingLLM Sync and Embedding Rules

This document defines the required, enforced behavior for the SOW workspace lifecycle so that SOWs, prompts, and the rate card are always synchronized between each individual SOW workspace and the master dashboard workspace.

## 1) On Workspace Creation (idempotent)
- Create the workspace on AnythingLLM using the app’s slug (e.g., `new-client-sow`).
- Set the system prompt to “The Architect v2”.
- Embed the complete Social Garden rate card (all roles/rates, AUD) into the workspace knowledge base.

## 2) After SOW Generation (dual-embed)
- Embed the final SOW into the current workspace, identified by its slug (e.g., `workspace/gen-sg-123`).
- Embed the same SOW into the master dashboard workspace (slug: `sow-master-dashboard` or equivalent global analytics workspace).
- Both locations MUST reflect identical SOW content immediately so they are available for analytics, global search, editing, and export.

## 3) Edits and Updates
- When a SOW is edited, the updated version MUST be embedded to BOTH the client workspace and the master dashboard.
- Include consistent metadata (e.g., `clientWorkspace`, `version`, `status`) to support analytics, deduplication, and “latest version” logic.

## 4) No Orphaned Data
- No SOW, prompt, or rate card may exist only locally or only in one workspace—every relevant document must be discoverable from BOTH the specific workspace and the master dashboard.

## Implementation Notes
- The `AnythingLLMService` class exposes:
  - `createOrGetClientWorkspace(clientName)` → creates/gets workspace, sets Architect v2 prompt, embeds rate card, and creates default thread.
  - `embedRateCardDocument(workspaceSlug)` → idempotently embeds the authoritative Social Garden rate card.
  - `embedSOWInBothWorkspaces(clientWorkspaceSlug, sowTitle, sowContent)` → dual-embeds the SOW in both the client workspace and the master dashboard.
  - `syncUpdatedSOWInBothWorkspaces(clientWorkspaceSlug, sowTitle, sowContent, metadata)` → re-embeds updated SOW content to BOTH locations with versioned metadata.
  - `getMasterSOWWorkspace(clientName)` → creates/gets workspace, sets Architect v2 prompt, embeds rate card, and creates default thread.

## Reasoning Summary (UI/Output)
- The chat should display a concise “Reasoning Summary” in a collapsible section (e.g., an accordion), using `<think>` tags.
- Keep this to short bullet points only: classification, key assumptions, major risks/trade-offs, and chosen approach.
- Do NOT reveal step-by-step chain-of-thought.

## Example Flow
1. User creates `new-client-sow`.
2. System creates AnythingLLM workspace, assigns “The Architect v2”, embeds the full rate card.
3. User enters a brief (e.g., “HubSpot integration, 3 landing pages, $27k budget”).
4. Chat shows a concise `<think>` reasoning summary and generates the SOW leveraging prompt/rates/KB.
5. User clicks “Generate SOW”: the SOW is embedded into BOTH `new-client-sow` and `sow-master-dashboard` with identical content.
