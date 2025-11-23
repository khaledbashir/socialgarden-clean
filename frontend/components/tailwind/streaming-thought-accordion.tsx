"use client";

import React, {
    useState,
    useEffect,
    useMemo,
    useCallback,
    useRef,
} from "react";
import { ChevronDown, FileText, DollarSign, Brain } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cleanSOWContent } from "@/lib/export-utils";

interface StreamingThoughtAccordionProps {
    content: string;
    isStreaming?: boolean;
    messageId?: string;
    onThinkingExtracted?: (thinking: string) => void;
    onInsertClick?: (content: string) => void;
}

export function StreamingThoughtAccordion({
    content,
    isStreaming = false,
    messageId,
    onThinkingExtracted,
}: StreamingThoughtAccordionProps) {
    const [isThinkingOpen, setIsThinkingOpen] = useState(false);
    const [displayedThinking, setDisplayedThinking] = useState<string>("");
    const streamTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Process content once per change
    const { thinking, cleanContent, pricingBlocks } = useMemo(() => {
        if (!content)
            return { thinking: "", cleanContent: "", pricingBlocks: [] };

        console.log("🔍 [Accordion] Processing content:", {
            contentLength: content.length,
            messageId,
        });

        // Extract thinking content
        const thinkingPatterns = [
            /<thinking>([\s\S]*?)<\/thinking>/gi,
            /<think>([\s\S]*?)<\/think>/gi,
            /<AI_THINK>([\s\S]*?)<\/AI_THINK>/gi,
        ];

        let extractedThinking = "";
        let workingContent = content;

        for (const pattern of thinkingPatterns) {
            const matches = Array.from(workingContent.matchAll(pattern));
            for (const match of matches) {
                const inner = (match[1] || "").trim();
                if (inner) {
                    extractedThinking +=
                        (extractedThinking ? "\n\n" : "") + inner;
                }
            }
            workingContent = workingContent.replace(pattern, "").trim();
        }

        // Remove tool calls
        workingContent = workingContent
            .replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, "")
            .trim();

        // Extract pricing JSON blocks
        const pricingBlocks: any[] = [];
        const jsonMatches = workingContent.matchAll(
            /\{[\s\S]*?"scope_name"[\s\S]*?\}/g,
        );

        for (const match of jsonMatches) {
            try {
                const parsed = JSON.parse(match[0]);
                if (parsed.scope_name && parsed.role_allocation) {
                    pricingBlocks.push(parsed);
                    // Remove this JSON from content
                    workingContent = workingContent
                        .replace(match[0], "")
                        .trim();
                }
            } catch (e) {
                console.warn("Could not parse JSON block:", e);
            }
        }

        // Clean the remaining content
        const cleanedContent = cleanSOWContent(workingContent);

        return {
            thinking: extractedThinking,
            cleanContent: cleanedContent,
            pricingBlocks,
        };
    }, [content, messageId]);

    // Handle thinking extraction callback
    const handleThinkingExtracted = useCallback(() => {
        if (onThinkingExtracted && thinking) {
            onThinkingExtracted(thinking);
        }
    }, [thinking, onThinkingExtracted]);

    // Stream thinking display
    useEffect(() => {
        if (streamTimeoutRef.current) {
            clearTimeout(streamTimeoutRef.current);
            streamTimeoutRef.current = null;
        }

        if (thinking && isStreaming) {
            setDisplayedThinking("");
            let currentIndex = 0;

            const streamThinking = () => {
                if (currentIndex < thinking.length) {
                    setDisplayedThinking(
                        (prev) => prev + thinking[currentIndex],
                    );
                    currentIndex++;
                    streamTimeoutRef.current = setTimeout(streamThinking, 15);
                }
            };

            streamThinking();
        } else if (thinking) {
            setDisplayedThinking(thinking);
        }

        return () => {
            if (streamTimeoutRef.current) {
                clearTimeout(streamTimeoutRef.current);
                streamTimeoutRef.current = null;
            }
        };
    }, [thinking, isStreaming]);

    // Call thinking callback
    useEffect(() => {
        handleThinkingExtracted();
    }, [handleThinkingExtracted]);

    // Show loading state when streaming but no content yet
    if (
        isStreaming &&
        !cleanContent &&
        pricingBlocks.length === 0 &&
        !thinking
    ) {
        return (
            <div className="w-full">
                <div className="bg-[#0a0a0a] border border-[#1b5e5e] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-4 h-4 border-2 border-[#20e28f] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-[#20e28f]">
                            Generating SOW...
                        </span>
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 bg-[#1b5e5e]/30 rounded animate-pulse"></div>
                        <div className="h-3 bg-[#1b5e5e]/30 rounded animate-pulse w-3/4"></div>
                        <div className="h-3 bg-[#1b5e5e]/30 rounded animate-pulse w-1/2"></div>
                    </div>
                </div>
            </div>
        );
    }

    // If no content at all, show nothing
    if (!cleanContent && pricingBlocks.length === 0 && !thinking) {
        return null;
    }

    return (
        <div className="w-full space-y-4">
            {/* Thinking Accordion - Only show if there's thinking content */}
            {thinking && (
                <details
                    className="border border-[#20e28f]/30 rounded-lg overflow-hidden bg-[#0a0a0a] group"
                    open={isThinkingOpen}
                    onToggle={(e) =>
                        setIsThinkingOpen((e.target as HTMLDetailsElement).open)
                    }
                >
                    <summary className="cursor-pointer px-4 py-3 bg-[#20e28f]/5 hover:bg-[#20e28f]/10 transition-colors text-sm font-medium flex items-center gap-2 select-none list-none">
                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 flex-shrink-0 text-[#20e28f]" />
                        <Brain className="w-4 h-4 text-[#20e28f]" />
                        <span className="text-[#20e28f]">
                            AI Reasoning Process
                        </span>
                        {isStreaming && (
                            <div className="ml-auto flex items-center gap-1">
                                <div className="w-2 h-2 bg-[#20e28f] rounded-full animate-pulse"></div>
                                <span className="text-xs text-gray-400">
                                    Thinking...
                                </span>
                            </div>
                        )}
                    </summary>
                    <div className="px-4 py-3 bg-[#000000]/30 border-t border-[#20e28f]/20">
                        <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {displayedThinking || thinking}
                        </div>
                    </div>
                </details>
            )}

            {/* Main SOW Content */}
            {cleanContent && (
                <div className="bg-[#0a0a0a] border border-[#1b5e5e] rounded-lg overflow-hidden">
                    <div className="bg-[#1b5e5e]/10 px-4 py-3 border-b border-[#1b5e5e]/30">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#20e28f]" />
                            <span className="text-sm font-medium text-[#20e28f]">
                                Statement of Work
                            </span>
                            {isStreaming && (
                                <div className="ml-auto flex items-center gap-1">
                                    <div className="w-2 h-2 bg-[#20e28f] rounded-full animate-pulse"></div>
                                    <span className="text-xs text-gray-400">
                                        Generating...
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-4">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h1: ({ node, ...props }) => (
                                    <h1
                                        className="text-lg font-bold mt-4 mb-3 text-white border-b border-[#1b5e5e]/30 pb-2"
                                        {...props}
                                    />
                                ),
                                h2: ({ node, ...props }) => (
                                    <h2
                                        className="text-base font-bold mt-3 mb-2 text-white"
                                        {...props}
                                    />
                                ),
                                h3: ({ node, ...props }) => (
                                    <h3
                                        className="text-sm font-bold mt-2 mb-1 text-white"
                                        {...props}
                                    />
                                ),
                                p: ({ node, ...props }) => (
                                    <p
                                        className="text-sm text-white mb-2 leading-relaxed"
                                        {...props}
                                    />
                                ),
                                ul: ({ node, ...props }) => (
                                    <ul
                                        className="list-disc list-inside text-sm text-white mb-2 pl-2"
                                        {...props}
                                    />
                                ),
                                ol: ({ node, ...props }) => (
                                    <ol
                                        className="list-decimal list-inside text-sm text-white mb-2 pl-2"
                                        {...props}
                                    />
                                ),
                                li: ({ node, ...props }) => (
                                    <li
                                        className="text-sm text-white mb-1"
                                        {...props}
                                    />
                                ),
                                strong: ({ node, ...props }) => (
                                    <strong
                                        className="font-bold text-white"
                                        {...props}
                                    />
                                ),
                                em: ({ node, ...props }) => (
                                    <em
                                        className="italic text-gray-200"
                                        {...props}
                                    />
                                ),
                                blockquote: ({ node, ...props }) => (
                                    <blockquote
                                        className="border-l-4 border-[#20e28f] pl-3 italic text-gray-300 my-2 text-sm"
                                        {...props}
                                    />
                                ),
                                code: ({
                                    node,
                                    className,
                                    children,
                                    ...props
                                }: any) => {
                                    const isInline =
                                        !className?.includes("language-");
                                    return isInline ? (
                                        <code
                                            className="bg-[#1b5e5e]/30 text-[#20e28f] px-2 py-1 rounded text-xs font-mono"
                                            {...props}
                                        >
                                            {children}
                                        </code>
                                    ) : (
                                        <pre className="bg-[#1b5e5e]/20 p-3 rounded text-xs font-mono overflow-x-auto mb-2 border border-[#1b5e5e]/30">
                                            <code
                                                className="text-[#20e28f]"
                                                {...props}
                                            >
                                                {children}
                                            </code>
                                        </pre>
                                    );
                                },
                            }}
                            className="prose prose-invert max-w-none text-sm"
                        >
                            {cleanContent}
                        </ReactMarkdown>
                    </div>
                </div>
            )}

            {/* Pricing Blocks */}
            {pricingBlocks.length > 0 && (
                <div className="space-y-3">
                    {pricingBlocks.map((block, index) => (
                        <div
                            key={index}
                            className="bg-[#0a0a0a] border border-[#20e28f]/30 rounded-lg overflow-hidden"
                        >
                            {/* Header */}
                            <div className="bg-[#20e28f]/10 px-4 py-3 border-b border-[#20e28f]/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-[#20e28f]" />
                                        <span className="text-sm font-medium text-[#20e28f]">
                                            {block.scope_name}
                                        </span>
                                    </div>
                                    <span className="text-sm font-bold text-[#20e28f]">
                                        $
                                        {(
                                            block.scope_total || 0
                                        ).toLocaleString("en-AU", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                                {block.scope_description && (
                                    <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                                        {block.scope_description}
                                    </p>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-4">
                                {/* Deliverables */}
                                {block.deliverables &&
                                    block.deliverables.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-white mb-2">
                                                Key Deliverables
                                            </h4>
                                            <ul className="text-xs text-gray-300 space-y-1">
                                                {block.deliverables.map(
                                                    (
                                                        deliverable: string,
                                                        idx: number,
                                                    ) => (
                                                        <li
                                                            key={idx}
                                                            className="flex items-start gap-2"
                                                        >
                                                            <span className="text-[#20e28f] mt-1">
                                                                •
                                                            </span>
                                                            <span>
                                                                {deliverable}
                                                            </span>
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                {/* Resource Allocation */}
                                {block.role_allocation &&
                                    block.role_allocation.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-white mb-2">
                                                Resource Allocation
                                            </h4>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="border-b border-[#1b5e5e]/30">
                                                            <th className="text-left py-2 text-gray-300 font-medium">
                                                                Role
                                                            </th>
                                                            <th className="text-right py-2 text-gray-300 font-medium">
                                                                Hours
                                                            </th>
                                                            <th className="text-right py-2 text-gray-300 font-medium">
                                                                Rate
                                                            </th>
                                                            <th className="text-right py-2 text-gray-300 font-medium">
                                                                Cost
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {block.role_allocation.map(
                                                            (
                                                                role: any,
                                                                roleIndex: number,
                                                            ) => (
                                                                <tr
                                                                    key={
                                                                        roleIndex
                                                                    }
                                                                    className="border-b border-[#1b5e5e]/10"
                                                                >
                                                                    <td className="py-2 text-white text-left">
                                                                        {
                                                                            role.role
                                                                        }
                                                                    </td>
                                                                    <td className="py-2 text-right text-gray-300">
                                                                        {
                                                                            role.hours
                                                                        }
                                                                    </td>
                                                                    <td className="py-2 text-right text-gray-300">
                                                                        $
                                                                        {role.rate?.toFixed(
                                                                            2,
                                                                        )}
                                                                    </td>
                                                                    <td className="py-2 text-right text-white font-medium">
                                                                        $
                                                                        {role.cost?.toFixed(
                                                                            2,
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                {/* Financial Summary */}
                                <div className="bg-[#1b5e5e]/10 rounded p-3 space-y-2">
                                    <h4 className="text-sm font-medium text-white mb-2">
                                        Financial Summary
                                    </h4>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-300">
                                                Subtotal:
                                            </span>
                                            <span className="text-white">
                                                $
                                                {(
                                                    block.scope_subtotal || 0
                                                ).toLocaleString("en-AU", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                        {block.discount_percent > 0 && (
                                            <>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-300">
                                                        Discount (
                                                        {block.discount_percent}
                                                        %):
                                                    </span>
                                                    <span className="text-red-400">
                                                        -$
                                                        {(
                                                            block.discount_amount ||
                                                            0
                                                        ).toLocaleString(
                                                            "en-AU",
                                                            {
                                                                minimumFractionDigits: 2,
                                                            },
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-300">
                                                        After Discount:
                                                    </span>
                                                    <span className="text-white">
                                                        $
                                                        {(
                                                            block.subtotal_after_discount ||
                                                            0
                                                        ).toLocaleString(
                                                            "en-AU",
                                                            {
                                                                minimumFractionDigits: 2,
                                                            },
                                                        )}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                        {block.gst_percent && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-300">
                                                    GST ({block.gst_percent}%):
                                                </span>
                                                <span className="text-white">
                                                    $
                                                    {(
                                                        block.gst_amount || 0
                                                    ).toLocaleString("en-AU", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm font-medium pt-2 border-t border-[#1b5e5e]/30">
                                            <span className="text-[#20e28f]">
                                                Total:
                                            </span>
                                            <span className="text-[#20e28f] font-bold">
                                                $
                                                {(
                                                    block.scope_total || 0
                                                ).toLocaleString("en-AU", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default StreamingThoughtAccordion;
