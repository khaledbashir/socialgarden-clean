import { NextRequest } from "next/server";

// Prefer secure server-side env vars; fallback to NEXT_PUBLIC for flexibility in current deployments
const baseUrl =
    process.env.ANYTHINGLLM_URL || process.env.NEXT_PUBLIC_ANYTHINGLLM_URL;
const apiKey =
    process.env.ANYTHINGLLM_API_KEY ||
    process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY;

// Handle cases where env vars are set to 'undefined' string
const effectiveBaseUrl = baseUrl && baseUrl !== "undefined" ? baseUrl : "";

// Security validation: Ensure API key is set
const effectiveApiKey = apiKey && apiKey !== "undefined" ? apiKey : null;
if (!effectiveBaseUrl || !effectiveApiKey) {
    throw new Error(
        "Security Error: AnythingLLM configuration missing. Set ANYTHINGLLM_URL and ANYTHINGLLM_API_KEY in environment.",
    );
}

const ANYTHINGLLM_URL = effectiveBaseUrl;
const ANYTHINGLLM_API_KEY = effectiveApiKey;

/**
 * PERFECT MIRROR: Stream Chat Route
 * 
 * This route implements the "Perfect Mirror" architecture:
 * - Accepts canonical payload: { workspaceSlug, threadSlug?, mode, message }
 * - Sends ONLY plain text user message (no prompt injection)
 * - Relies entirely on AnythingLLM workspace configuration for system prompts
 * - Rate card and documents should be embedded via document upload/pinning
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log("🎯 [Perfect Mirror] Incoming /stream-chat payload:", {
            workspaceSlug: body.workspaceSlug,
            workspace: body.workspace, // Legacy support
            threadSlug: body.threadSlug,
            mode: body.mode,
            messageLength: body.message?.length || 0,
            hasMessagesArray: !!body.messages,
        });

        // Support both canonical format and legacy format for backward compatibility
        const {
            workspaceSlug,
            workspace, // Legacy support
            threadSlug,
            mode = "chat",
            message, // Canonical format: plain text string
            messages, // Legacy format: messages array (will extract last user message)
        } = body;

        // Resolve workspace slug (support both 'workspace' and 'workspaceSlug' for backward compatibility)
        const effectiveWorkspaceSlug = workspace || workspaceSlug;

        if (!effectiveWorkspaceSlug) {
            return new Response(
                JSON.stringify({
                    error: "No workspace specified. Must provide workspaceSlug parameter.",
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        // Extract message: prefer canonical 'message' field, fallback to legacy 'messages' array
        let messageToSend: string;
        if (message && typeof message === "string") {
            // ✅ Canonical format: plain text message
            messageToSend = message.trim();
        } else if (messages && Array.isArray(messages) && messages.length > 0) {
            // Legacy format: extract last user message from array
            const lastMessage = messages[messages.length - 1];
            if (!lastMessage || lastMessage.role !== "user") {
                return new Response(
                    JSON.stringify({
                        error: "No user message provided. Last message must be from user.",
                    }),
                    {
                        status: 400,
                        headers: { "Content-Type": "application/json" },
                    },
                );
            }
            messageToSend =
                typeof lastMessage.content === "string"
                    ? lastMessage.content.trim()
                    : "";
        } else {
            return new Response(
                JSON.stringify({
                    error: "No message provided. Must provide 'message' (string) or 'messages' (array).",
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        if (!messageToSend || messageToSend.length === 0) {
            return new Response(
                JSON.stringify({
                    error: "Message content must be a non-empty string.",
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        // 🤖 @AGENT SUPPORT: Detect and preserve @agent invocations
        // AnythingLLM detects @agent in plain text messages and triggers agent mode
        const hasAgentInvocation = messageToSend.includes("@agent");
        if (hasAgentInvocation) {
            console.log("🤖 [@Agent] Agent invocation detected in user message");
        }

        // 🎯 PERFECT MIRROR: NO PROMPT INJECTION
        // The system prompt is configured ONCE in the AnythingLLM workspace during setup
        // Rate card and other documents should be embedded via document upload/pinning
        // Analytics data should be embedded as documents or configured in workspace
        // We send ONLY the user's plain text message - AnythingLLM handles the rest

        // Determine the endpoint based on whether this is thread-based chat
        let endpoint: string;
        if (threadSlug) {
            // Thread-based streaming chat (saves to SOW's thread)
            endpoint = `${ANYTHINGLLM_URL}/api/v1/workspace/${effectiveWorkspaceSlug}/thread/${threadSlug}/stream-chat`;
        } else {
            // Workspace-level streaming chat (legacy behavior)
            endpoint = `${ANYTHINGLLM_URL}/api/v1/workspace/${effectiveWorkspaceSlug}/stream-chat`;
        }

        console.log("✅ [Perfect Mirror] Sending to AnythingLLM:", {
            endpoint,
            workspace: effectiveWorkspaceSlug,
            threadSlug: threadSlug || "(workspace-level)",
            mode,
            messagePreview: messageToSend.substring(0, 100) + "...",
        });
        console.log(
            "✅ [Perfect Mirror] System prompt is controlled by AnythingLLM workspace configuration.",
        );
        console.log(
            "✅ [Perfect Mirror] No runtime prompt injection - relying on workspace setup.",
        );

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${ANYTHINGLLM_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: messageToSend, // Plain text message only
                mode, // 'chat' or 'query'
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();

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
        console.error("❌ [Perfect Mirror] Internal server error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }
}
