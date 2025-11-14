import { NextRequest, NextResponse } from "next/server";
import {
    checkRateLimit,
    checkAbusiveBehavior,
} from "../../../../lib/rate-limit";

// ⚠️ CRITICAL: This route is EXCLUSIVELY for dashboard chat
// It is HARDCODED to use the sow-master-dashboard workspace
// NO conditional logic, NO variables for workspace selection

const ANYTHINGLLM_URL =
    process.env.ANYTHINGLLM_URL ||
    "https://ahmad-anything-llm.840tjq.easypanel.host";
const ANYTHINGLLM_API_KEY =
    process.env.ANYTHINGLLM_API_KEY ||
    "process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY";

// 🔒 HARDCODED WORKSPACE - NEVER CHANGE THIS
const DASHBOARD_WORKSPACE = "sow-master-dashboard";

export async function POST(request: NextRequest) {
    console.log(
        "🎯 [DASHBOARD CHAT] ============ REQUEST RECEIVED ============",
    );
    console.log("🎯 [DASHBOARD CHAT] Timestamp:", new Date().toISOString());
    console.log("🎯 [DASHBOARD CHAT] Method:", request.method);
    console.log("🎯 [DASHBOARD CHAT] URL:", request.url);

    try {
        const body = await request.json();
        const { messages } = body;

        console.log(
            "🎯 [DASHBOARD CHAT] Request body keys:",
            Object.keys(body),
        );
        console.log(
            "🎯 [DASHBOARD CHAT] Messages array length:",
            messages?.length,
        );
        console.log("🔒 [DASHBOARD CHAT] Workspace:", DASHBOARD_WORKSPACE);
        console.log(
            "🔒 [DASHBOARD CHAT] Route hardcoded to: sow-master-dashboard",
        );
        console.log("🌐 [DASHBOARD CHAT] AnythingLLM URL:", ANYTHINGLLM_URL);
        console.log(
            "🔑 [DASHBOARD CHAT] API Key configured:",
            !!ANYTHINGLLM_API_KEY,
        );

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            console.error("❌ [DASHBOARD CHAT] Invalid messages array");
            return NextResponse.json(
                { error: "No messages provided" },
                { status: 400 },
            );
        }

        // Get the last user message
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || lastMessage.role !== "user") {
            console.error("❌ [DASHBOARD CHAT] Last message is not from user");
            return NextResponse.json(
                { error: "Last message must be from user" },
                { status: 400 },
            );
        }

        // Get system prompt if exists
        const systemMessage = messages.find((m: any) => m.role === "system");
        const systemPrompt = systemMessage?.content || "";

        // Send the user message directly WITHOUT combining with system prompt
        // AnythingLLM handles system prompt via workspace config
        // Preserving the raw message allows @agent mentions and other syntax to work
        const messageToSend = lastMessage.content;

        console.log("📤 [DASHBOARD CHAT] Sending to AnythingLLM...");
        console.log(
            "📍 [DASHBOARD CHAT] Full URL:",
            `${ANYTHINGLLM_URL}/api/v1/workspace/${DASHBOARD_WORKSPACE}/stream-chat`,
        );
        console.log(
            "💬 [DASHBOARD CHAT] Message preview:",
            messageToSend.substring(0, 100),
        );

        // Call AnythingLLM streaming chat endpoint
        const fetchUrl = `${ANYTHINGLLM_URL}/api/v1/workspace/${DASHBOARD_WORKSPACE}/stream-chat`;
        console.log("🚀 [DASHBOARD CHAT] About to fetch:", fetchUrl);

        let response;
        try {
            response = await fetch(fetchUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${ANYTHINGLLM_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: messageToSend,
                    mode: "chat",
                }),
            });
            console.log("✅ [DASHBOARD CHAT] Fetch completed successfully");
        } catch (fetchError) {
            console.error(
                "❌ [DASHBOARD CHAT] Fetch failed with error:",
                fetchError,
            );
            console.error(
                "❌ [DASHBOARD CHAT] Error name:",
                fetchError instanceof Error ? fetchError.name : "Unknown",
            );
            console.error(
                "❌ [DASHBOARD CHAT] Error message:",
                fetchError instanceof Error ? fetchError.message : "Unknown",
            );
            console.error(
                "❌ [DASHBOARD CHAT] Error stack:",
                fetchError instanceof Error ? fetchError.stack : "No stack",
            );
            return NextResponse.json(
                {
                    error: "Failed to connect to AnythingLLM service",
                    details:
                        fetchError instanceof Error
                            ? fetchError.message
                            : "Unknown error",
                    url: fetchUrl,
                },
                { status: 503 },
            );
        }

        console.log("📥 [DASHBOARD CHAT] Response received");
        console.log(
            "📥 [DASHBOARD CHAT] Status:",
            response.status,
            response.statusText,
        );
        console.log(
            "📥 [DASHBOARD CHAT] Headers:",
            Object.fromEntries(response.headers.entries()),
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                "❌ [DASHBOARD CHAT] AnythingLLM error:",
                response.status,
                errorText,
            );
            return NextResponse.json(
                {
                    error: `AnythingLLM API error: ${response.statusText}`,
                    details: errorText,
                },
                { status: response.status },
            );
        }

        console.log(
            "✅ [DASHBOARD CHAT] Response OK - checking content type...",
        );

        // Check if response is streaming
        const contentType = response.headers.get("content-type");

        if (
            contentType?.includes("text/event-stream") ||
            contentType?.includes("stream")
        ) {
            console.log("📡 [DASHBOARD CHAT] Streaming response detected");

            // Return streaming response
            return new NextResponse(response.body, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    Connection: "keep-alive",
                },
            });
        } else {
            // Handle JSON response
            console.log("📦 [DASHBOARD CHAT] JSON response detected");
            const data = await response.json();

            // Format response to match OpenAI structure
            return NextResponse.json({
                id: data.id || Date.now().toString(),
                object: "chat.completion",
                created: Date.now(),
                model: "anythingllm-dashboard",
                choices: [
                    {
                        index: 0,
                        message: {
                            role: "assistant",
                            content: data.textResponse || "No response",
                        },
                        finish_reason: "stop",
                    },
                ],
                usage: {
                    prompt_tokens: 0,
                    completion_tokens: 0,
                    total_tokens: 0,
                },
            });
        }
    } catch (error) {
        console.error("❌ [DASHBOARD CHAT] Critical error:", error);
        return NextResponse.json(
            { error: "Internal server error in dashboard chat" },
            { status: 500 },
        );
    }
}
