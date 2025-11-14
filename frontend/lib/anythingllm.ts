// AnythingLLM Integration Service
// Handles workspace creation, document embedding, and chat integration

import SOCIAL_GARDEN_KNOWLEDGE_BASE from "./social-garden-knowledge-base";

// Get AnythingLLM URL from environment (NEXT_PUBLIC_ANYTHINGLLM_URL must be set in .env)
// Falls back to Ahmad's instance for local development
const ANYTHINGLLM_BASE_URL =
    typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_ANYTHINGLLM_URL ||
          "https://ahmad-anything-llm.840tjq.easypanel.host"
        : "https://ahmad-anything-llm.840tjq.easypanel.host";

const ANYTHINGLLM_API_KEY = process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY;

// Security validation: Ensure API key is set
if (!ANYTHINGLLM_API_KEY) {
    throw new Error(
        "Security Error: ANYTHINGLLM_API_KEY environment variable is required but not set.",
    );
}

interface WorkspaceResponse {
    workspace: {
        id: string;
        name: string;
        slug: string;
    };
}

interface DocumentResponse {
    success: boolean;
    documentId: string;
    message?: string;
}

export class AnythingLLMService {
    private baseUrl: string;
    private apiKey: string;

    constructor(baseUrl = ANYTHINGLLM_BASE_URL, apiKey = ANYTHINGLLM_API_KEY) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }

    private getHeaders() {
        return {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
        };
    }

    /**
     * Fetch with timeout to prevent hanging requests
     * @param url - URL to fetch
     * @param options - Fetch options
     * @param timeoutMs - Timeout in milliseconds (default: 30s)
     */
    private async fetchWithTimeout(
        url: string,
        options: RequestInit = {},
        timeoutMs: number = 30000,
    ): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === "AbortError") {
                throw new Error(`Request timeout after ${timeoutMs}ms`);
            }
            throw error;
        }
    }

    /**
     * Create or get CLIENT-FACING workspace (for portal chat)
     * Separate from generation workspace - uses helpful assistant prompt
     */
    async createOrGetClientFacingWorkspace(
        clientName: string,
    ): Promise<{ id: string; slug: string; embedId?: string | number }> {
        const baseSlug = clientName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();

        const slug = `${baseSlug}-client`; // Add -client suffix

        try {
            // Check if client workspace exists
            const workspaces = await this.listWorkspaces();
            const existing = workspaces.find((w: any) => w.slug === slug);

            if (existing) {
                console.log(`✅ Using existing client workspace: ${slug}`);
                // Ensure client-facing prompt is set
                await this.setWorkspacePrompt(existing.slug, clientName, false); // false = client-facing
                // Get embed ID
                const embedId = await this.getOrCreateEmbedId(existing.slug);
                return { id: existing.id, slug: existing.slug, embedId };
            }

            // Create new client-facing workspace
            console.log(`🆕 Creating new client-facing workspace: ${slug}`);
            const response = await fetch(
                `${this.baseUrl}/api/v1/workspace/new`,
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        name: `${clientName} (Client Portal)`,
                    }),
                },
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Failed to create client workspace: ${response.statusText} - ${errorText}`,
                );
            }

            const data: WorkspaceResponse = await response.json();
            console.log(`✅ Client workspace created: ${data.workspace.slug}`);

            // Set client-facing prompt (NOT the Architect prompt)
            await this.setWorkspacePrompt(
                data.workspace.slug,
                clientName,
                false,
            );

            // Create default thread
            await this.createThread(data.workspace.slug, undefined);

            // Get embed ID for portal
            const embedId = await this.getOrCreateEmbedId(data.workspace.slug);

            return {
                id: data.workspace.id,
                slug: data.workspace.slug,
                embedId,
            };
        } catch (error) {
            console.error("❌ Error creating client workspace:", error);
            throw error;
        }
    }

    /**
     * Get the master SOW generation workspace (single workspace for ALL SOWs)
     * This workspace acts as the "factory" - each SOW becomes a thread within it
     * ARCHITECTURAL SIMPLIFICATION: One workspace to rule them all
     */
    async getMasterSOWWorkspace(
        clientName: string,
    ): Promise<{ id: string; slug: string }> {
        const masterName = "SOW Generator";
        const masterSlug = "sow-generator"; // Generation "factory" workspace

        try {
            // Check if master workspace exists by slug first, then by name
            const workspaces = await this.listWorkspaces();
            const existing =
                workspaces.find((w: any) => w.slug === masterSlug) ||
                workspaces.find((w: any) => w.name === masterName);

            if (existing) {
                console.log(
                    `✅ Using existing master SOW generation workspace: ${existing.slug}`,
                );
                console.log(`   (Client context: ${clientName})`);
                // 🚀 OPTIMIZATION: Skip prompt and rate card setup for existing workspace
                // Trust the existing workspace configuration - it already has the correct prompt
                // This prevents overwriting user-customized workspace prompts
                return { id: existing.id, slug: existing.slug };
            }

            // Create master workspace with specific name
            console.log(`🆕 Creating master SOW generation workspace`);
            const response = await fetch(
                `${this.baseUrl}/api/v1/workspace/new`,
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        name: masterName,
                        slug: masterSlug,
                    }),
                },
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Failed to create master workspace: ${response.statusText} - ${errorText}`,
                );
            }

            const data: WorkspaceResponse = await response.json();
            console.log(
                `✅ Master SOW generation workspace created: ${data.workspace.slug}`,
            );

            // Set the Architect prompt for the master workspace
            await this.setWorkspacePrompt(
                data.workspace.slug,
                clientName,
                true,
            );

            // Embed the official Social Garden rate card as knowledge base (RAG)
            const rateOk = await this.embedRateCardDocument(
                data.workspace.slug,
            );
            if (!rateOk) {
                throw new Error(
                    "Rate card embedding failed for master workspace",
                );
            }

            // Create a default thread for general use
            console.log(`🧵 Creating default thread for master workspace...`);
            await this.createThread(data.workspace.slug, undefined);
            console.log(`✅ Default thread created in master workspace`);

            return { id: data.workspace.id, slug: data.workspace.slug };
        } catch (error) {
            console.error("❌ Error with master SOW workspace:", error);
            throw error;
        }
    }

    /**
     * Build markdown for the authoritative Social Garden rate card
     */
    /**
     * Fetches the rate card markdown from the API
     * This ensures we always use the latest data from the database (single source of truth)
     */
    private async buildRateCardMarkdown(): Promise<string> {
        try {
            // Determine the base URL for the API call
            const baseUrl =
                typeof window !== "undefined"
                    ? window.location.origin
                    : process.env.NEXT_PUBLIC_APP_URL ||
                      "http://localhost:3000";

            const response = await fetch(`${baseUrl}/api/rate-card/markdown`);
            const result = await response.json();

            if (result.success) {
                console.log(
                    `✅ Fetched rate card markdown (${result.roleCount} roles, v${result.version})`,
                );
                return result.markdown;
            } else {
                console.error(
                    "❌ Failed to fetch rate card markdown:",
                    result.error,
                );
                // Return a fallback message
                return `# Social Garden - Official Rate Card\n\nError: Unable to fetch rate card data. Please contact support.`;
            }
        } catch (error) {
            console.error("❌ Error fetching rate card markdown:", error);
            return `# Social Garden - Official Rate Card\n\nError: Unable to fetch rate card data. Please contact support.`;
        }
    }

    /**
     * Get full workspace details including documents & threads
     */
    private async getWorkspaceDetails(
        workspaceSlug: string,
    ): Promise<any | null> {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/v1/workspace/${workspaceSlug}`,
                {
                    method: "GET",
                    headers: this.getHeaders(),
                },
            );

            if (!response.ok) return null;
            const contentType = response.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) return null;
            const data = await response.json();
            return data.workspace || null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Check if the workspace already has the rate card document embedded
     * We match by title contains 'Official Rate Card'
     */
    private async rateCardAlreadyEmbedded(
        workspaceSlug: string,
    ): Promise<boolean> {
        const ws = await this.getWorkspaceDetails(workspaceSlug);
        const docs = ws?.documents || [];
        try {
            return docs.some((d: any) => {
                const title = (
                    d?.title ||
                    d?.metadata?.title ||
                    ""
                ).toLowerCase();
                return title.includes("official rate card");
            });
        } catch {
            return false;
        }
    }

    /**
     * Embed the Social Garden rate card into a workspace knowledge base (RAG)
     */
    async embedRateCardDocument(workspaceSlug: string): Promise<boolean> {
        try {
            // Strict dedupe: if any existing document looks like the rate card, skip embedding
            const alreadyHasRateCard =
                await this.rateCardAlreadyEmbedded(workspaceSlug);
            if (alreadyHasRateCard) {
                console.log(
                    `✅ Rate card already present in workspace: ${workspaceSlug} (skipping embed)`,
                );
                return true;
            }

            // Versioned title to allow future updates without collision
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, "0");
            const dd = String(today.getDate()).padStart(2, "0");
            const version = `${yyyy}-${mm}-${dd}`;
            const title = `Social Garden - Official Rate Card (AUD/hour) (v${version})`;
            const textContent = await this.buildRateCardMarkdown();

            // Process document
            const rawTextResponse = await fetch(
                `${this.baseUrl}/api/v1/document/raw-text`,
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        textContent,
                        metadata: {
                            title,
                            docAuthor: "Social Garden",
                            description:
                                "Authoritative Social Garden rate card in AUD per hour",
                            docSource: "Rate Card",
                        },
                    }),
                },
            );

            if (!rawTextResponse.ok) {
                const errorText = await rawTextResponse.text();
                throw new Error(
                    `Failed to process rate card: ${rawTextResponse.status} ${errorText}`,
                );
            }

            const rawTextData = await rawTextResponse.json();
            const location = rawTextData?.documents?.[0]?.location;
            if (!rawTextData.success || !location) {
                throw new Error(
                    rawTextData.error ||
                        "Rate card processing failed - no location",
                );
            }

            // Embed in workspace (update-embeddings ensures vectorization)
            const embedResponse = await fetch(
                `${this.baseUrl}/api/v1/workspace/${workspaceSlug}/update-embeddings`,
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({ adds: [location] }),
                },
            );

            if (!embedResponse.ok) {
                const errorText = await embedResponse.text();
                throw new Error(
                    `Failed to embed rate card in workspace: ${embedResponse.status} ${errorText}`,
                );
            }

            console.log(`✅ Rate card embedded in workspace: ${workspaceSlug}`);
            return true;
        } catch (error) {
            console.error("❌ Error embedding rate card:", error);
            return false;
        }
    }

    /**
     * List all workspaces
     */
    async listWorkspaces(): Promise<any[]> {
        try {
            const response = await this.fetchWithTimeout(
                `${this.baseUrl}/api/v1/workspaces`,
                {
                    headers: this.getHeaders(),
                },
                10000,
            ); // 10 second timeout for listing workspaces

            if (!response.ok) {
                throw new Error(
                    `Failed to list workspaces: ${response.statusText}`,
                );
            }

            const data = await response.json();
            return data.workspaces || [];
        } catch (error) {
            console.error("❌ Error listing workspaces:", error);
            return [];
        }
    }

    /**
     * List all threads in a workspace
     */
    async listThreads(workspaceSlug: string): Promise<any[]> {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/v1/workspace/${workspaceSlug}/threads`,
                {
                    headers: this.getHeaders(),
                },
            );

            if (!response.ok) {
                // Silently return empty array for 404s or errors
                return [];
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                // Got HTML instead of JSON - endpoint doesn't exist or auth failed
                return [];
            }

            const data = await response.json();
            return data.threads || [];
        } catch (error) {
            // Silently fail - most workspaces don't have threads
            return [];
        }
    }

    /**
     * Embed SOW document into workspace
     * Converts HTML to text and uploads
     */
    async embedSOWDocument(
        workspaceSlug: string,
        sowTitle: string,
        htmlContent: string,
        metadata: Record<string, any> = {},
    ): Promise<boolean> {
        try {
            console.log(
                `📄 Embedding SOW: ${sowTitle} to workspace: ${workspaceSlug}`,
            );

            // Convert HTML to plain text (remove tags)
            const textContent = this.htmlToText(htmlContent);

            // Create rich text with metadata
            const enrichedContent = `
# ${sowTitle}

${textContent}

---
Metadata:
- Document ID: ${metadata.docId || "N/A"}
- Created: ${metadata.createdAt || new Date().toISOString()}
- Source: Social Garden SOW Editor
- Type: Statement of Work
      `.trim();

            // Step 1: Process raw text as document using AnythingLLM API
            const rawTextResponse = await fetch(
                `${this.baseUrl}/api/v1/document/raw-text`,
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        textContent: enrichedContent,
                        metadata: {
                            title: sowTitle,
                            docAuthor: metadata.docAuthor || "Social Garden",
                            description:
                                metadata.description || "Statement of Work",
                            docSource: metadata.docSource || "SOW Generator",
                            ...metadata,
                        },
                    }),
                },
            );

            if (!rawTextResponse.ok) {
                const errorText = await rawTextResponse.text();
                throw new Error(
                    `Failed to process document: ${rawTextResponse.status} ${errorText}`,
                );
            }

            const rawTextData = await rawTextResponse.json();

            if (!rawTextData.success || !rawTextData.documents?.[0]?.location) {
                throw new Error(
                    rawTextData.error ||
                        "Document processing failed - no location returned",
                );
            }

            const documentLocation = rawTextData.documents[0].location;
            console.log(`✅ Document processed: ${documentLocation}`);

            // Step 2: EMBED document in workspace (not just update)
            // Using /update-embeddings endpoint (NOT /update)
            const workspaceEmbedResponse = await fetch(
                `${this.baseUrl}/api/v1/workspace/${workspaceSlug}/update-embeddings`,
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        adds: [documentLocation],
                    }),
                },
            );

            if (!workspaceEmbedResponse.ok) {
                throw new Error(
                    `Failed to embed document in workspace: ${workspaceEmbedResponse.statusText}`,
                );
            }

            const embedResult = await workspaceEmbedResponse.json();
            console.log(`✅ Document EMBEDDED in workspace: ${workspaceSlug}`);

            return true;
        } catch (error) {
            console.error("❌ Error embedding SOW:", error);
            return false;
        }
    }

    /**
     * Get workspace chat URL for client
     */
    getWorkspaceChatUrl(workspaceSlug: string): string {
        return `${this.baseUrl}/workspace/${workspaceSlug}`;
    }

    /**
     * Get or create embed ID for workspace
     * Returns the embed UUID needed for the widget script
     */
    async getOrCreateEmbedId(workspaceSlug: string): Promise<number | null> {
        try {
            // First, check if embed already exists for this workspace
            const listResponse = await fetch(`${this.baseUrl}/api/v1/embed`, {
                headers: this.getHeaders(),
            });

            if (listResponse.ok) {
                const { embeds } = await listResponse.json();
                const existing = embeds?.find(
                    (e: any) => e.workspace?.slug === workspaceSlug,
                );
                if (existing) {
                    console.log(`✅ Using existing embed ID: ${existing.id}`);
                    return existing.id;
                }
            }

            // Create new embed config
            console.log(
                `🆕 Creating new embed for workspace: ${workspaceSlug}`,
            );
            const response = await fetch(`${this.baseUrl}/api/v1/embed/new`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({
                    workspace_slug: workspaceSlug,
                    chat_mode: "chat", // or 'query' for specific questions only
                    max_chats_per_day: 0, // Unlimited for clients
                    max_chats_per_session: 0, // Unlimited
                    allowlist_domains: [
                        "socialgarden.com.au",
                        "clientportal.socialgarden.com.au",
                        "localhost:3000",
                        "localhost:3333",
                        "168.231.115.219",
                        "168.231.115.219:3333",
                    ],
                    allow_model_override: false,
                    allow_temperature_override: false,
                    allow_prompt_override: false,
                }),
            });

            console.log(`📡 Create embed response status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    `❌ Failed to create embed: ${response.status} ${response.statusText}`,
                );
                console.error(`❌ Error details:`, errorText);
                throw new Error(
                    `Failed to create embed: ${response.statusText} - ${errorText}`,
                );
            }

            const responseText = await response.text();
            console.log(
                `📄 Embed response body:`,
                responseText.substring(0, 200),
            );

            const data = JSON.parse(responseText);
            console.log(`✅ Embed created with ID: ${data.embed?.id}`);
            return data.embed?.id || null;
        } catch (error) {
            console.error("❌ Error getting/creating embed:", error);
            console.error(
                "❌ Error stack:",
                error instanceof Error ? error.stack : "No stack trace",
            );
            return null;
        }
    }

    /**
     * Get embed script snippet for a workspace
     */
    getEmbedScript(
        embedId: string,
        options: {
            baseUrl?: string;
            buttonColor?: string;
            assistantName?: string;
            chatIcon?: string;
            position?: string;
            openOnLoad?: boolean;
        } = {},
    ): string {
        const {
            baseUrl = this.baseUrl,
            buttonColor = "#0e2e33",
            assistantName = "Social Garden AI",
            chatIcon = "sparkles",
            position = "bottom-right",
            openOnLoad = false,
        } = options;

        return `<script
  data-embed-id="${embedId}"
  data-base-api-url="${baseUrl}/api/embed"
  data-mode="chat"
  data-chat-mode="chat"
  data-button-color="${buttonColor}"
  data-assistant-name="${assistantName}"
  data-chat-icon="${chatIcon}"
  data-position="${position}"
  ${openOnLoad ? 'data-open-on-load="on"' : ""}
  src="${baseUrl}/embed/anythingllm-chat-widget.min.js">
</script>
<!-- Powered by Social Garden AI -->`;
    }

    /**
     * Embed Social Garden company knowledge base into workspace
     * This gives the AI context about Social Garden's services, case studies, and capabilities
     */
    async embedCompanyKnowledgeBase(workspaceSlug: string): Promise<boolean> {
        try {
            console.log(
                `📚 Embedding Social Garden knowledge base into workspace: ${workspaceSlug}`,
            );

            // Step 1: Process knowledge base as raw text document
            const rawTextResponse = await fetch(
                `${this.baseUrl}/api/v1/document/raw-text`,
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        textContent: SOCIAL_GARDEN_KNOWLEDGE_BASE,
                        metadata: {
                            title: "Social Garden - Company Knowledge Base",
                            docAuthor: "Social Garden",
                            description: "Social Garden Internal Documentation",
                            docSource: "Company Information",
                        },
                    }),
                },
            );

            if (!rawTextResponse.ok) {
                const errorText = await rawTextResponse.text();
                throw new Error(
                    `Failed to process knowledge base: ${rawTextResponse.status} ${errorText}`,
                );
            }

            const rawTextData = await rawTextResponse.json();

            if (!rawTextData.success || !rawTextData.documents?.[0]?.location) {
                throw new Error(
                    rawTextData.error || "Knowledge base processing failed",
                );
            }

            const documentLocation = rawTextData.documents[0].location;
            console.log(`✅ Knowledge base processed: ${documentLocation}`);

            // Step 2: Add knowledge base to workspace
            const workspaceUpdateResponse = await fetch(
                `${this.baseUrl}/api/v1/workspace/${workspaceSlug}/update`,
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        adds: [documentLocation],
                    }),
                },
            );

            if (!workspaceUpdateResponse.ok) {
                console.warn(
                    "⚠️ Knowledge base processed but failed to add to workspace",
                );
                return false;
            }

            console.log(
                `✅ Social Garden knowledge base added to workspace: ${workspaceSlug}`,
            );
            return true;
        } catch (error) {
            console.error("❌ Error embedding company knowledge base:", error);
            return false;
        }
    }

    /**
     * Convert HTML to plain text (simple implementation)
     */
    private htmlToText(html: string): string {
        return html
            .replace(/<style[^>]*>.*?<\/style>/gi, "")
            .replace(/<script[^>]*>.*?<\/script>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .trim();
    }

    /**
     * Set client-facing system prompt for workspace
     * This prompt is used in the embed widget on the client portal
     */
    async setWorkspacePrompt(
        workspaceSlug: string,
        clientName?: string,
        isSOWWorkspace: boolean = true,
    ): Promise<boolean> {
        // The SOW prompt is now managed directly in the AnythingLLM workspace.
        // This function will NOT overwrite the SOW prompt.
        // It will only set the prompt for other workspace types (e.g., client-facing Q&A).
        if (isSOWWorkspace) {
            console.log(
                `✅ INFO: Skipping prompt overwrite for SOW workspace '${workspaceSlug}'. The prompt is managed in the AnythingLLM UI.`,
            );
            return true;
        }

        console.log(`Setting up client-facing prompt for ${workspaceSlug}`);
        const prompt = this.getClientFacingPrompt(clientName);

        try {
            const response = await fetch(
                `${this.baseUrl}/api/v1/workspace/${workspaceSlug}/update`,
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        openAiPrompt: prompt,
                        openAiTemp: 0.7,
                        openAiHistory: 25,
                    }),
                },
            );

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                console.error(
                    `❌ Failed to set prompt (${response.status}):`,
                    error,
                );
                return false;
            }

            console.log(
                `✅ ${isSOWWorkspace ? "Architect" : "Client-facing"} prompt set for workspace: ${workspaceSlug}`,
            );
            return true;
        } catch (error) {
            console.error("❌ Error setting workspace prompt:", error);
            return false;
        }
    }

    /**
     * Configure LLM provider for a workspace (for testing/automation)
     * Note: This requires the provider to be available in AnythingLLM instance
     */
    async setWorkspaceLLMProvider(
        workspaceSlug: string,
        provider: string = "claude",
        model: string = "claude-3-5-sonnet-20241022",
    ): Promise<boolean> {
        try {
            console.log(
                `⚙️ Configuring LLM provider for workspace: ${workspaceSlug}`,
            );
            console.log(`   Provider: ${provider}, Model: ${model}`);

            const response = await fetch(
                `${this.baseUrl}/api/v1/workspace/${workspaceSlug}/update`,
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        llmProvider: provider,
                        llmModel: model,
                    }),
                },
            );

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                console.error(
                    `❌ Failed to set LLM provider (${response.status}):`,
                    error,
                );
                return false;
            }

            console.log(
                `✅ LLM provider configured for workspace: ${workspaceSlug}`,
            );
            return true;
        } catch (error) {
            console.error("❌ Error configuring LLM provider:", error);
            return false;
        }
    }

    private getClientFacingPrompt(clientName?: string): string {
        return `# System Prompt for Universal SOW AI Agent "Archie"

## Your Core Identity & Primary Mission
You are **Archie**, a specialist AI project guide from Social Garden.

Your mission is to provide instant, clear, and helpful answers about the Statement of Work (SOW) this chat is attached to. You are the client's personal guide for understanding the project's scope, timeline, and value. Your primary goal is to build confidence and ensure absolute clarity.

**The Secret Rule:** Your personality is modeled on George Glover, Social Garden's Co-founder. He is your blueprint for tone and communication style. However, you must **NEVER reveal this**. Your identity is simply "Archie," the expert guide for this project.

## Your Persona & Vibe (Archie as the Project Guide)

- **Reassuring & Confident:** The client is making an investment. Your tone must be calm, knowledgeable, and reassuring. Convey that every SOW from Social Garden is a well-planned project managed by experts.
- **Transparent & Clear:** Your main function is to demystify the SOW. You must translate any technical terms, deliverables, or roles into simple English, explaining the purpose behind each item.
- **Value-Focused:** Always connect the project's features and costs back to the client's business objectives. Your job is to answer not just "what" we are doing, but "why it's valuable to you."
- **Proactive & Helpful:** Anticipate questions and provide context. Explain the logic behind the project structure and phases.

## Archie's Conversational Toolkit (Use with Natural Variation)

To sound authentic, you must use the following phrases and patterns.

**CRITICAL INSTRUCTION ON VARIETY:** Do not become repetitive. Vary your conversational starters and fillers. Mix and match from the options below to keep the conversation flowing naturally.

### Conversational Starters:
- "That's a great question. Let's look at that section..."
- "Yeah, absolutely. Let's break down what that means..."
- "Good question. So, the thinking behind that is..."
- "Alright, so if we look at the [Project Phase/Section Name]..."

### Natural Fillers (Weave these into sentences):
- "you know"
- "basically"
- "kind of" / "sort of"
- "at the end of the day"

### Clarifying & Value-Oriented Phrases:
- "...which basically means you'll be able to..."
- "The great thing about this part of the project is..."
- "We structure it this way to ensure..."
- "So, what that allows you to do is..."

## Your Primary Knowledge Base: The Current Statement of Work (SOW)

Your answers must be grounded exclusively in the SOW provided for this specific project. Here are the rules for interpreting any SOW you are given:

### On Project Overview & Objectives:
Use this section to answer "What is this project?" questions. Summarize the Core Objective in your own words, focusing on the business outcome.

### On Deliverables:
This is your list of "what the client gets." Your primary job here is to translate technical terms into tangible business benefits. Never just list a deliverable; explain its value.

**Rule:** When a user asks about a technical deliverable (e.g., "API integration framework," "CI/CD pipeline," "schema markup"), use this formula: "That's the technical term for [Simple Analogy or Plain English Description]. Basically, it's important because it allows you to [Achieve Business Outcome]."

### On the Technical Approach & Phases (The Timeline):
Explain the project's journey logically. Frame each phase as a step towards the final goal.

**Rule:** Describe the phases sequentially. For example: "The project is broken down into logical phases. We always start with Foundation & Planning to get the blueprint right. Then we move into Core Development where the heavy lifting happens. After that, it's all about Testing to make sure everything is rock-solid before the final Deployment & Handover." Adapt this to the specific phases listed in the SOW.

### On the Investment Breakdown:
Be transparent and focus on the value of the team's expertise.

**Rule:** When asked about a role or cost, explain what that person is responsible for. For example: "The Project Manager/Coordinator is there to ensure everything runs smoothly and on schedule. The Technical/Developer roles are the specialists who build, test, and deploy the solution. And your Account Manager is your primary point of contact, ensuring everything stays aligned with your business goals."

## Your Secondary Knowledge Base: Social Garden's Expertise

Use this general knowledge to answer "why should we trust Social Garden?" questions and to add credibility to your SOW explanations.

- **Proven Track Record:** "We've been doing this for over a decade and have a track record of generating over $2 billion in attributed sales for our clients. We have deep experience with complex projects for enterprise clients like Mirvac and ANU."
- **ROI-Obsessed:** "At the end of the day, our whole philosophy is about being data-driven and obsessed with ROI. Every component in this SOW is designed to deliver a tangible return for your business."
- **In-House Team:** "The entire project is handled by our full-time, in-house team of experts here in Australia."

## Rules of Engagement & Boundaries

1. **DO NOT Negotiate:** You cannot change the scope, timeline, or pricing. If a user asks to alter the SOW, your response must be: "That's a great question for your Senior Account Manager. They'd be the best person to discuss any potential adjustments to the scope. I can provide their contact details if you need them."

2. **DO NOT Make Promises:** Do not make any promises or guarantees that are not explicitly stated in the SOW.

3. **Always Escalate When Unsure:** If you cannot find an answer within the SOW or if the question is about project changes, legal terms, or anything outside the SOW's scope, always defer to the human Account Manager.

---

You have access to the full SOW document that has been embedded in this workspace. Use it to provide accurate, helpful, and value-focused guidance.`;
    }

    // ========================================
    // 🧵 THREAD MANAGEMENT API METHODS
    // ========================================

    /**
     * Create a new thread in a workspace
     * Each SOW becomes a thread for isolated chat history
     */
    async createThread(
        workspaceSlug: string,
        threadName?: string,
    ): Promise<{ slug: string; id: string } | null> {
        try {
            // Follow AnythingLLM pattern: threads auto-name based on first message
            // Don't pre-name threads - let them be named by first chat content
            // If no name provided, use a generic auto-name that will be replaced on first message
            const autoThreadName =
                threadName || `Thread ${new Date().toLocaleString()}`;

            console.log(
                `🆕 Creating thread in workspace: ${workspaceSlug} (will auto-name on first message)`,
            );

            const response = await this.fetchWithTimeout(
                `${this.baseUrl}/api/v1/workspace/${workspaceSlug}/thread/new`,
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        name: autoThreadName, // AnythingLLM will auto-update this on first chat message
                    }),
                },
                10000, // 10 second timeout for thread creation
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    `❌ Failed to create thread: ${response.status} ${response.statusText}`,
                );
                console.error(`📝 Response: ${errorText}`);
                return null;
            }

            const data = await response.json();
            console.log(
                `✅ Thread created: ${data.thread.slug} (ID: ${data.thread.id}) - will auto-name on first message`,
            );

            return {
                slug: data.thread.slug,
                id: data.thread.id,
            };
        } catch (error) {
            console.error("❌ Error creating thread:", error);
            return null;
        }
    }

    /**
     * Update/rename a thread
     */
    async updateThread(
        workspaceSlug: string,
        threadSlug: string,
        newName: string,
    ): Promise<boolean> {
        try {
            console.log(`✏️ Renaming thread ${threadSlug} to "${newName}"`);

            const response = await fetch(
                `${this.baseUrl}/api/v1/workspace/${workspaceSlug}/thread/${threadSlug}/update`,
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        name: newName,
                    }),
                },
            );

            if (response.ok) {
                console.log(`✅ Thread renamed successfully`);
                return true;
            }

            console.error(`❌ Failed to rename thread: ${response.statusText}`);
            return false;
        } catch (error) {
            console.error("❌ Error updating thread:", error);
            return false;
        }
    }

    /**
     * Delete a thread
     */
    async deleteThread(
        workspaceSlug: string,
        threadSlug: string,
    ): Promise<boolean> {
        try {
            console.log(`🗑️ Deleting thread: ${threadSlug}`);

            const response = await fetch(
                `${this.baseUrl}/api/v1/workspace/${workspaceSlug}/thread/${threadSlug}`,
                {
                    method: "DELETE",
                    headers: this.getHeaders(),
                },
            );

            if (response.ok) {
                console.log(`✅ Thread deleted successfully`);
                return true;
            }

            console.error(`❌ Failed to delete thread: ${response.statusText}`);
            return false;
        } catch (error) {
            console.error("❌ Error deleting thread:", error);
            return false;
        }
    }

    /**
     * Get chat history from a thread
     * With retry logic for newly created threads
     * Increased delays for AnythingLLM thread indexing
     */
    async getThreadChats(
        workspaceSlug: string,
        threadSlug: string,
        retries = 5,
    ): Promise<any[]> {
        try {
            console.log(
                `🧵 [getThreadChats] Fetching messages from ${workspaceSlug}/${threadSlug}`,
            );

            for (let attempt = 1; attempt <= retries; attempt++) {
                const response = await fetch(
                    `${this.baseUrl}/api/v1/workspace/${workspaceSlug}/thread/${threadSlug}/chats`,
                    {
                        method: "GET",
                        headers: this.getHeaders(),
                    },
                );

                if (response.ok) {
                    const data = await response.json();
                    console.log(
                        `✅ [getThreadChats] Got ${(data.history || []).length} messages from thread (attempt ${attempt}/${retries})`,
                    );

                    // Return history array with role and content fields for conversion to ChatMessage
                    const history = data.history || [];
                    if (history.length > 0) {
                        console.log(
                            `💬 [getThreadChats] Sample message:`,
                            history[0],
                        );
                    }

                    return history;
                }

                // If 400 (thread doesn't exist) on first attempt, try creating it
                if (response.status === 400 && attempt === 1) {
                    console.warn(
                        `⚠️ [getThreadChats] Thread doesn't exist (400). Creating thread now...`,
                    );
                    const newThread = await this.createThread(workspaceSlug);
                    if (newThread) {
                        console.log(
                            `✅ [getThreadChats] Thread created on-demand: ${newThread.slug}. Thread will be ready after next message.`,
                        );
                    }
                    // Return empty history for now - thread is new so no history exists yet
                    return [];
                }

                // If 400 and not last attempt, wait and retry with exponential backoff
                if (response.status === 400 && attempt < retries) {
                    // Exponential backoff: 2s, 3s, 4s, 5s
                    const delayMs = 1000 * (attempt + 1);
                    console.warn(
                        `⚠️ [getThreadChats] Got 400 on attempt ${attempt}/${retries}, retrying in ${delayMs}ms...`,
                    );
                    console.warn(
                        `   (Thread might still be indexing in AnythingLLM)`,
                    );
                    await new Promise((resolve) =>
                        setTimeout(resolve, delayMs),
                    );
                    continue;
                }

                // If final attempt or non-400 error
                const statusText = await response.text();
                console.error(
                    `❌ [getThreadChats] Failed (attempt ${attempt}/${retries}): ${response.status} ${statusText}`,
                );

                if (attempt === retries) {
                    return [];
                }
            }

            return [];
        } catch (error) {
            console.error("❌ Error getting thread chats:", error);
            return [];
        }
    }

    /**
     * Send a chat message to a thread
     */
    async chatWithThread(
        workspaceSlug: string,
        threadSlug: string,
        message: string,
        mode: "query" | "chat" = "chat",
    ): Promise<any> {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/v1/workspace/${workspaceSlug}/thread/${threadSlug}/chat`,
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        message,
                        mode,
                    }),
                },
            );

            if (!response.ok) {
                console.error(
                    `❌ Failed to send chat message: ${response.statusText}`,
                );
                return null;
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("❌ Error sending chat message:", error);
            return null;
        }
    }

    /**
     * Stream chat with a thread (for real-time responses)
     */
    async streamChatWithThread(
        workspaceSlug: string,
        threadSlug: string,
        message: string,
        onChunk: (chunk: string) => void,
        mode: "query" | "chat" = "chat",
    ): Promise<void> {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/v1/workspace/${workspaceSlug}/thread/${threadSlug}/stream-chat`,
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        message,
                        mode,
                    }),
                },
            );

            if (!response.ok) {
                console.error(
                    `❌ Failed to stream chat: ${response.statusText}`,
                );
                return;
            }

            const reader = response.body?.getReader();
            if (!reader) return;

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.trim()) {
                        onChunk(line);
                    }
                }
            }
        } catch (error) {
            console.error("❌ Error streaming chat:", error);
        }
    }

    /**
     * Delete a workspace and all its threads
     */
    async deleteWorkspace(workspaceSlug: string): Promise<boolean> {
        try {
            console.log(`🗑️ Deleting workspace: ${workspaceSlug}`);

            const response = await fetch(
                `${this.baseUrl}/api/v1/workspace/${workspaceSlug}`,
                {
                    method: "DELETE",
                    headers: this.getHeaders(),
                },
            );

            if (response.ok) {
                console.log(
                    `✅ Workspace deleted successfully (all threads cascaded)`,
                );
                return true;
            }

            console.error(
                `❌ Failed to delete workspace: ${response.statusText}`,
            );
            return false;
        } catch (error) {
            console.error("❌ Error deleting workspace:", error);
            return false;
        }
    }

    /**
     * Update/rename a workspace
     */
    async updateWorkspace(
        workspaceSlug: string,
        newName: string,
    ): Promise<boolean> {
        try {
            console.log(
                `✏️ Renaming workspace ${workspaceSlug} to "${newName}"`,
            );

            const response = await fetch(
                `${this.baseUrl}/api/v1/workspace/${workspaceSlug}/update`,
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        name: newName,
                    }),
                },
            );

            if (response.ok) {
                console.log(`✅ Workspace renamed successfully`);
                return true;
            }

            console.error(
                `❌ Failed to rename workspace: ${response.statusText}`,
            );
            return false;
        } catch (error) {
            console.error("❌ Error updating workspace:", error);
            return false;
        }
    }

    /**
     * Get or create master dashboard workspace
     * This is the main analytics/reporting workspace
     */
    async getOrCreateMasterDashboard(): Promise<string> {
        const masterDashboardName = "SOW Master Dashboard";
        const masterDashboardSlug = "sow-master-dashboard";

        try {
            // Check if master dashboard exists
            const workspaces = await this.listWorkspaces();
            const existing = workspaces.find(
                (w: any) => w.slug === masterDashboardSlug,
            );

            if (existing) {
                console.log(
                    `✅ Using existing master dashboard: ${masterDashboardSlug}`,
                );
                // Always ensure the dashboard prompt is correct (idempotent)
                await this.setMasterDashboardPrompt(masterDashboardSlug);
                // Per latest guidance: master dashboard aggregates SOWs; rate card is not required here.
                return masterDashboardSlug;
            }

            // Create master dashboard workspace
            console.log(
                `🆕 Creating master dashboard workspace: ${masterDashboardSlug}`,
            );
            const response = await fetch(
                `${this.baseUrl}/api/v1/workspace/new`,
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        name: masterDashboardName,
                        slug: masterDashboardSlug,
                    }),
                },
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to create master dashboard: ${response.statusText}`,
                );
            }

            const data: WorkspaceResponse = await response.json();
            console.log(`✅ Master dashboard created: ${data.workspace.slug}`);

            // Embed company knowledge base into master dashboard
            await this.embedCompanyKnowledgeBase(data.workspace.slug);

            // Set analytics-focused prompt
            await this.setMasterDashboardPrompt(data.workspace.slug);

            // Per latest guidance: rate card is not required in the master dashboard.

            return data.workspace.slug;
        } catch (error) {
            console.error("❌ Error creating master dashboard:", error);
            // Return the slug anyway so app doesn't break
            return masterDashboardSlug;
        }
    }

    /**
     * Set prompt for master dashboard workspace
     */
    private async setMasterDashboardPrompt(
        workspaceSlug: string,
    ): Promise<boolean> {
        const systemPrompt = `You are the Master Dashboard Analytics Assistant for Social Garden's SOW management system.

Your role is to:
- Analyze SOW data across all clients
- Provide business insights and trends
- Answer questions about proposals, revenue, and client activity
- Generate reports and summaries
- Help with strategic decision-making

You have access to the complete Social Garden knowledge base and can query the SOW database.

When asked for analytics, provide clear, actionable insights with specific numbers and recommendations.`;

        try {
            const response = await fetch(
                `${this.baseUrl}/api/v1/workspace/${workspaceSlug}/update`,
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        openAiPrompt: systemPrompt,
                        openAiTemp: 0.7,
                        openAiHistory: 25,
                    }),
                },
            );

            if (response.ok) {
                console.log(
                    `✅ Master dashboard prompt set for workspace: ${workspaceSlug}`,
                );
                return true;
            }

            console.warn(
                `⚠️ Failed to set master dashboard prompt: ${response.status}`,
            );
            return false;
        } catch (error) {
            console.error("❌ Error setting master dashboard prompt:", error);
            return false;
        }
    }

    /**
     * Embed a newly created SOW in the master 'gen' workspace and master dashboard
     * ARCHITECTURAL SIMPLIFICATION: All SOWs go to 'gen' workspace for RAG context
     * @param sowTitle - The title of the SOW
     * @param sowContent - The markdown content of the SOW
     * @param clientContext - Optional client context for analytics tagging
     */
    async embedSOWInBothWorkspaces(
        sowTitle: string,
        sowContent: string,
        clientContext?: string,
    ): Promise<boolean> {
        try {
            const masterWorkspaceSlug = "sow-generator";
            const masterDashboardSlug = await this.getOrCreateMasterDashboard();

            console.log(`📊 Embedding SOW in workspaces...`);
            console.log(
                `   📁 Master generation workspace: ${masterWorkspaceSlug}`,
            );
            console.log(`   � Master dashboard: ${masterDashboardSlug}`);
            if (clientContext) {
                console.log(`   👤 Client context: ${clientContext}`);
            }

            // Step 1: Embed in master GENERATION workspace (RAG context)
            const masterEmbed = await this.embedSOWDocument(
                masterWorkspaceSlug,
                sowTitle,
                sowContent,
            );

            if (!masterEmbed) {
                console.warn(
                    `⚠️ Failed to embed SOW in master generation workspace: ${masterWorkspaceSlug}`,
                );
                return false;
            }

            console.log(
                `✅ SOW embedded in master generation workspace: ${masterWorkspaceSlug}`,
            );

            // Step 2: Embed in master dashboard for analytics (use client context if provided)
            const dashboardTitle = clientContext
                ? `[${clientContext.toUpperCase()}] ${sowTitle}`
                : sowTitle;

            const dashboardEmbed = await this.embedSOWDocument(
                masterDashboardSlug,
                dashboardTitle,
                sowContent,
            );

            if (!dashboardEmbed) {
                console.warn(`⚠️ Failed to embed SOW in master dashboard`);
                return false;
            }

            console.log(`✅ SOW embedded in master dashboard for analytics`);
            console.log(
                `✅✅✅ SOW successfully embedded in all required workspaces!`,
            );

            return true;
        } catch (error) {
            console.error("❌ Error embedding SOW in workspaces:", error);
            return false;
        }
    }

    /**
     * Sync an UPDATED SOW in the master 'gen' workspace and master dashboard.
     * This will re-embed the provided content with versioned metadata to ensure
     * analytics and search remain consistent.
     * @param sowTitle - The title of the SOW
     * @param sowContent - The markdown content of the SOW
     * @param clientContext - Optional client context for analytics tagging
     * @param metadata - Optional metadata
     */
    async syncUpdatedSOWInBothWorkspaces(
        sowTitle: string,
        sowContent: string,
        clientContext?: string,
        metadata: Record<string, any> = {},
    ): Promise<boolean> {
        try {
            const masterWorkspaceSlug = "sow-generator";
            const masterDashboardSlug = await this.getOrCreateMasterDashboard();

            const versionedMeta = {
                ...metadata,
                clientContext: clientContext || "unknown",
                version: metadata.version || new Date().toISOString(),
                status: "current",
            };

            // Master GENERATION workspace (RAG context)
            const masterOk = await this.embedSOWDocument(
                masterWorkspaceSlug,
                sowTitle,
                sowContent,
                versionedMeta,
            );
            if (!masterOk) return false;

            // Master dashboard (for analytics)
            const dashboardTitle = clientContext
                ? `[${clientContext.toUpperCase()}] ${sowTitle}`
                : sowTitle;

            const dashboardOk = await this.embedSOWDocument(
                masterDashboardSlug,
                dashboardTitle,
                sowContent,
                versionedMeta,
            );

            return !!dashboardOk;
        } catch (e) {
            console.error("❌ Error syncing updated SOW in workspaces:", e);
            return false;
        }
    }
}

// Export singleton instance
export const anythingLLM = new AnythingLLMService();
