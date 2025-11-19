import { NextRequest } from "next/server";

// Prefer secure server-side env vars; fallback to NEXT_PUBLIC for flexibility in current deployments
const baseUrl =
    process.env.ANYTHINGLLM_URL || process.env.NEXT_PUBLIC_ANYTHINGLLM_URL;
const apiKey =
    process.env.ANYTHINGLLM_API_KEY ||
    process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY;

// Handle cases where env vars are set to 'undefined' string
const effectiveBaseUrl =
    baseUrl && baseUrl !== "undefined"
        ? baseUrl
        : "https://ahmad-anything-llm.840tjq.easypanel.host";

// Security validation: Ensure API key is set
const effectiveApiKey = apiKey && apiKey !== "undefined" ? apiKey : null;
if (!effectiveApiKey) {
    throw new Error(
        "Security Error: ANYTHINGLLM_API_KEY environment variable is required but not set.",
    );
}

const ANYTHINGLLM_URL = effectiveBaseUrl;
const ANYTHINGLLM_API_KEY = effectiveApiKey;

/**
 * Fetch the rate card markdown from our internal endpoint
 * This ensures the AI always has access to the official rate card for pricing calculations
 */
async function getRateCardMarkdown(): Promise<string> {
    try {
        const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL ||
            process.env.NEXT_PUBLIC_APP_URL ||
            "http://localhost:3000";
        
        console.log("🔍 [Rate Card] Fetching from:", `${baseUrl}/api/rate-card/markdown`);
        
        const response = await fetch(`${baseUrl}/api/rate-card/markdown`, {
            cache: "no-store",
        });

        console.log("🔍 [Rate Card] Response status:", response.status);

        if (!response.ok) {
            console.error("❌ [Rate Card] Failed to fetch:", response.status);
            const errorText = await response.text();
            console.error("❌ [Rate Card] Error response:", errorText);
            return "[Rate card temporarily unavailable]";
        }

        const data = await response.json();
        console.log("✅ [Rate Card] Successfully fetched, markdown length:", data.markdown?.length || 0);
        console.log("✅ [Rate Card] First 200 chars:", data.markdown?.substring(0, 200) || "[NO MARKDOWN]");
        
        if (!data.markdown) {
            console.error("❌ [Rate Card] No markdown in response:", data);
            return "[Rate card markdown not found]";
        }
        
        return data.markdown;
    } catch (error: any) {
        console.error("❌ [Rate Card] Exception:", error);
        console.error("❌ [Rate Card] Stack:", error.stack);
        return "[Rate card temporarily unavailable - fetch error]";
    }
}

/**
 * Fetch live analytics data for the Analytics Assistant
 * This ensures the AI always has access to current database information
 */
async function getLiveAnalyticsData(): Promise<string> {
    try {
        // Use internal API call (server-to-server)
        // In Docker: use NEXT_PUBLIC_BASE_URL, in dev: localhost
        const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL ||
            process.env.NEXT_PUBLIC_APP_URL ||
            "http://localhost:3000";
        const response = await fetch(`${baseUrl}/api/data/analytics-summary`, {
            cache: "no-store",
        });

        if (!response.ok) {
            console.error("❌ [Analytics] Failed to fetch:", response.status);
            return "[Analytics data temporarily unavailable]";
        }

        const data = await response.json();

        // Format the data in a way the AI can easily parse
        return `
[LIVE DATABASE SNAPSHOT - ${new Date().toLocaleString()}]

OVERVIEW:
- Total SOWs: ${data.overview.total_sows}
- Total Investment Value: $${data.overview.total_investment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Average SOW Value: $${data.overview.average_investment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Unique Clients: ${data.overview.unique_clients}

STATUS BREAKDOWN:
${Object.entries(data.status_breakdown || {})
    .map(([status, count]) => `- ${status}: ${count}`)
    .join("\n")}

TOP 5 CLIENTS BY VALUE:
${data.top_clients
    .map(
        (c: any, i: number) =>
            `${i + 1}. ${c.client_name}: ${c.sow_count} SOW${c.sow_count > 1 ? "s" : ""}, $${c.total_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total`,
    )
    .join("\n")}

ALL CLIENTS (sorted by value):
${data.all_clients
    .map(
        (c: any) =>
            `- ${c.client_name}: ${c.sow_count} SOW${c.sow_count > 1 ? "s" : ""}, $${c.total_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total, avg $${c.avg_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    )
    .join("\n")}

[END LIVE DATA]
`;
    } catch (error: any) {
        console.error("❌ [Analytics] Exception:", error);
        return "[Analytics data temporarily unavailable - database error]";
    }
}

export async function POST(request: NextRequest) {
    try {
        // ============================================================================
        // CRITICAL DEBUG: INCOMING /stream-chat PAYLOAD
        // ============================================================================
        const requestBody = await request.json();

        console.log("//////////////////////////////////////////////////");
        console.log("// CRITICAL DEBUG: INCOMING /stream-chat PAYLOAD //");
        console.log("//////////////////////////////////////////////////");
        console.log("FULL REQUEST BODY:");
        console.log(JSON.stringify(requestBody, null, 2));
        console.log("");
        console.log("KEY FIELDS:");
        console.log("  workspace:", requestBody.workspace);
        console.log("  workspaceSlug:", requestBody.workspaceSlug);
        console.log("  threadSlug:", requestBody.threadSlug);
        console.log("  mode:", requestBody.mode);
        console.log("  model:", requestBody.model);
        console.log("  messages.length:", requestBody.messages?.length);
        if (requestBody.messages && requestBody.messages.length > 0) {
            console.log("  messages[0].role:", requestBody.messages[0].role);
            console.log(
                "  messages[0].content (first 200 chars):",
                requestBody.messages[0].content?.substring(0, 200),
            );
            console.log(
                "  messages[messages.length-1].role:",
                requestBody.messages[requestBody.messages.length - 1].role,
            );
            console.log(
                "  messages[messages.length-1].content (first 200 chars):",
                requestBody.messages[
                    requestBody.messages.length - 1
                ].content?.substring(0, 200),
            );
        }
        console.log("//////////////////////////////////////////////////");
        // ============================================================================

        const body = requestBody;
        let {
            messages,
            workspaceSlug,
            workspace,
            threadSlug,
            mode = "chat",
            model,
        } = body;

        // Use 'workspace' if provided, otherwise fall back to 'workspaceSlug'
        const effectiveWorkspaceSlug = workspace || workspaceSlug;

        console.log("");
        console.log("=== WORKSPACE RESOLUTION ===");
        console.log("workspace param:", workspace);
        console.log("workspaceSlug param:", workspaceSlug);
        console.log("effectiveWorkspaceSlug:", effectiveWorkspaceSlug);
        console.log("");

        if (!effectiveWorkspaceSlug) {
            const errorMsg =
                "No workspace specified. Must provide workspace or workspaceSlug parameter.";
            return new Response(JSON.stringify({ error: errorMsg }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            const errorMsg =
                "No messages provided. Must provide messages array.";
            return new Response(JSON.stringify({ error: errorMsg }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Get the last user message
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || lastMessage.role !== "user") {
            const errorMsg =
                "No user message provided. Last message must be from user.";
            return new Response(JSON.stringify({ error: errorMsg }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        let messageToSend: string =
            typeof lastMessage.content === "string" ? lastMessage.content : "";

        if (!messageToSend || typeof messageToSend !== "string") {
            const errorMsg = "Message content must be a non-empty string.";
            return new Response(JSON.stringify({ error: errorMsg }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // 🤖 @AGENT SUPPORT: Detect and preserve @agent invocations
        // AnythingLLM detects @agent in plain text messages and triggers agent mode
        // The @agent string must be preserved exactly as the user typed it
        const hasAgentInvocation = messageToSend.includes("@agent");
        if (hasAgentInvocation) {
            console.log(
                "🤖 [@Agent] Agent invocation detected in user message",
            );
            console.log(
                "🤖 [@Agent] Message preview:",
                messageToSend.substring(0, 200),
            );
        }

        // 🎯 CRITICAL: For master dashboard workspace, inject live analytics data
        // This ensures the AI has access to the SAME data the UI shows
        const isMasterDashboard =
            effectiveWorkspaceSlug === "sow-master-dashboard";

        if (isMasterDashboard) {
            console.log(
                "📊 [Master Dashboard] Fetching live analytics data to inject...",
            );
            const liveData = await getLiveAnalyticsData();

            // Prepend the live data to the user's message
            // The AI will see this data as context for every question
            messageToSend = `${liveData}\n\nUser Question: ${messageToSend}`;

            console.log(
                "✅ [Master Dashboard] Live data injected into message",
            );
        }

        // ✅ NEW ARCHITECTURE: Inject rate card into message context (not as system prompt override)
        // This ensures the AI always has the rate card available without overriding workspace config
        console.log(
            "📋 [Rate Card Injection] Fetching live rate card to prepend to user message...",
        );
        const rateCardMarkdown = await getRateCardMarkdown();
        const messageWithContext = `[OFFICIAL_RATE_CARD_SOURCE_OF_TRUTH]
${rateCardMarkdown}

[USER_REQUEST]
${messageToSend}`;

        console.log(
            `✅ [Rate Card Injection] Rate card prepended to message (total size: ${messageWithContext.length} chars)`,
        );

        // Determine the endpoint based on whether this is thread-based chat
        let endpoint: string;
        if (threadSlug) {
            // Thread-based streaming chat (saves to SOW's thread)
            endpoint = `${ANYTHINGLLM_URL}/api/v1/workspace/${effectiveWorkspaceSlug}/thread/${threadSlug}/stream-chat`;
        } else {
            // Workspace-level streaming chat (legacy behavior)
            endpoint = `${ANYTHINGLLM_URL}/api/v1/workspace/${effectiveWorkspaceSlug}/stream-chat`;
        }

        console.log("");
        console.log("=== ABOUT TO SEND TO ANYTHINGLLM ===");
        console.log("Endpoint:", endpoint);
        console.log("Workspace:", effectiveWorkspaceSlug);
        console.log("Mode:", mode);
        console.log("ThreadSlug:", threadSlug);
        console.log("");
        console.log(
            "✅ INFO: System prompt is controlled by AnythingLLM workspace configuration.",
        );
        console.log(
            "✅ INFO: Rate card is injected into user message context for reliable access.",
        );
        console.log(
            "✅ INFO: This backend acts as a direct passthrough to the workspace.",
        );
        if (hasAgentInvocation) {
            console.log(
                "🤖 INFO: @agent invocation detected - AnythingLLM will handle agent mode automatically.",
            );
            console.log(
                "🤖 INFO: Agent session will persist for follow-up messages until /exit or completion.",
            );
        }
        console.log("");
        console.log("Message to send (first 500 chars):");
        console.log(messageWithContext.substring(0, 500));
        console.log("...");
        console.log("=== END DEBUG ===");
        console.log("");

        console.log("\n\n🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥\n");
        console.log("FINAL MESSAGE PAYLOAD VERIFICATION:");
        console.log("THE COMPLETE MESSAGE BEING SENT TO THE AI IS:");
        console.log(messageWithContext);
        console.log("\n🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥\n\n");

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${ANYTHINGLLM_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: messageWithContext,
                mode, // 'chat' or 'query' (provided by caller)
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();

            // 🔍 ENHANCED ERROR LOGGING
            console.error("❌ ❌ ❌ ANYTHINGLLM ERROR ❌ ❌ ❌");
            console.error("Status:", response.status, response.statusText);
            console.error("Endpoint:", endpoint);
            console.error("Workspace:", effectiveWorkspaceSlug);
            console.error("Thread Slug:", threadSlug);
            console.error("Mode:", mode);
            console.error("Error Response:", errorText);
            console.error("❌ ❌ ❌ END ERROR ❌ ❌ ❌");

            // Special logging for 401
            if (response.status === 401) {
                // Silently fail for 401 - do not expose auth details
            }

            return new Response(
                JSON.stringify({
                    error: `AnythingLLM API error: ${response.statusText}`,
                    details: errorText.substring(0, 500),
                    status: response.status,
                    endpoint: endpoint,
                    workspace: effectiveWorkspaceSlug,
                    threadSlug: threadSlug,
                }),
                {
                    status: response.status,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        // Return the SSE stream directly to the client
        // Set up proper SSE headers
        const headers = new Headers({
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no", // Disable nginx buffering
        });

        // Create a TransformStream to pass through the SSE data
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();

        // Start reading from AnythingLLM stream and writing to our stream
        (async () => {
            try {
                if (!response.body) {
                    console.error(
                        "❌ [STREAM] No response body from AnythingLLM",
                    );
                    await writer.close();
                    return;
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                let totalChunks = 0;
                let totalBytes = 0;

                console.log("🌊 [STREAM] Starting to read from AnythingLLM...");

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        console.log(
                            `✅ [STREAM] Complete - ${totalChunks} chunks, ${totalBytes} bytes total`,
                        );
                        await writer.close();
                        break;
                    }

                    totalChunks++;
                    totalBytes += value.length;

                    // Decode the chunk with better error handling
                    let chunk;
                    try {
                        chunk = decoder.decode(value, { stream: true });
                    } catch (decodeError) {
                        console.warn(
                            "⚠️ [STREAM] Decode error, using replacement:",
                            decodeError,
                        );
                        chunk = decoder.decode(value, { stream: false });
                    }

                    // Add to buffer
                    buffer += chunk;

                    // Process complete SSE lines (more efficient than splitting)
                    let lineEndIndex;
                    while ((lineEndIndex = buffer.indexOf("\n")) !== -1) {
                        const line = buffer.substring(0, lineEndIndex);
                        buffer = buffer.substring(lineEndIndex + 1);

                        if (line.trim()) {
                            // Log first few chunks for debugging
                            if (totalChunks <= 3) {
                                console.log(
                                    `📦 [STREAM] Chunk ${totalChunks}: ${line.substring(0, 100)}...`,
                                );
                            }
                            // Forward SSE line to client immediately (no batching)
                            await writer.write(encoder.encode(line + "\n"));
                        }
                    }
                }
            } catch (error) {
                console.error("❌ [STREAM] Error:", error);
                await writer.abort(error);
            }
        })();

        return new Response(readable, { headers });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }
}
