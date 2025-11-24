"use client";
import { defaultEditorContent } from "@/lib/content";
import {
    EditorCommand,
    EditorCommandEmpty,
    EditorCommandItem,
    EditorCommandList,
    EditorContent,
    type EditorInstance,
    EditorRoot,
    type JSONContent,
    EditorBubble,
} from "novel";
import { ImageResizer, handleCommandNavigation } from "novel/extensions";
import { handleImageDrop, handleImagePaste } from "novel/plugins";
import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { useDebouncedCallback } from "use-debounce";
import { defaultExtensions } from "./extensions";
import { ColorSelector } from "./selectors/color-selector";
import { LinkSelector } from "./selectors/link-selector";
import { MathSelector } from "./selectors/math-selector";
import { NodeSelector } from "./selectors/node-selector";
import { Separator } from "./ui/separator";

import { uploadFn } from "./image-upload";
import { TextButtons } from "./selectors/text-buttons";
import { slashCommand, suggestionItems } from "./slash-command";
import { TableMenu } from "./extensions/table-menu";
import { InlineEditor } from "./inline-editor";
import { extractJSONFromContent } from "@/json-editor-conversion-fix";

const hljs = require("highlight.js");

const extensions = [...defaultExtensions, slashCommand];

interface TailwindAdvancedEditorProps {
    initialContent?: JSONContent | null;
    onUpdate?: (content: JSONContent) => void;
    onContentChange?: (content: JSONContent) => void;
}

const TailwindAdvancedEditor = forwardRef(
    (
        {
            initialContent: propInitialContent,
            onUpdate,
            onContentChange,
        }: TailwindAdvancedEditorProps,
        ref,
    ) => {
        const [initialContent, setInitialContent] =
            useState<null | JSONContent>(null);
        const [saveStatus, setSaveStatus] = useState("Saved");
        const [charsCount, setCharsCount] = useState();

        const [openNode, setOpenNode] = useState(false);
        const [openColor, setOpenColor] = useState(false);
        const [openLink, setOpenLink] = useState(false);
        const [openAI, setOpenAI] = useState(false);
        const [editor, setEditor] = useState<EditorInstance | null>(null);

        // Expose methods to parent component
        useImperativeHandle(
            ref,
            () => ({
                insertContent: async (content: JSONContent | string) => {
                    if (editor) {
                        console.log(
                            "ADVANCED-EDITOR: Received content to insert:",
                            typeof content === "string"
                                ? content
                                : JSON.stringify(content, null, 2),
                        );
                        console.log(
                            "ADVANCED-EDITOR: Content type:",
                            typeof content,
                            "Content length:",
                            typeof content === "string"
                                ? content.length
                                : "N/A",
                        );

                        // ✅ FIX: Use insertContent to add at cursor position instead of replacing all content
                        try {
                            // If content is a string, check if it contains JSON code blocks or unfenced JSON
                            if (typeof content === "string") {
                                // First check for unfenced JSON that might be a pricing response
                                const extractedJSONData =
                                    extractJSONFromContent(content);
                                if (extractedJSONData) {
                                    console.log(
                                        "ADVANCED-EDITOR: Detected unfenced V4.1 JSON, converting to markdown format",
                                    );
                                    // Convert JSON to markdown format for processing
                                    const { convertV41JSONToEditorFormat } =
                                        await import(
                                            "@/json-editor-conversion-fix"
                                        );
                                    const formattedContent =
                                        convertV41JSONToEditorFormat(
                                            extractedJSONData,
                                        );
                                    editor.commands.insertContent(
                                        formattedContent,
                                    );
                                    return;
                                }

                                // Check if content contains JSON code blocks that need special handling
                                const jsonBlockRegex =
                                    /```json\s*\n([\s\S]*?)\n```/i;
                                const jsonBlockMatch =
                                    jsonBlockRegex.exec(content);
                                if (jsonBlockMatch && jsonBlockMatch[1]) {
                                    console.log(
                                        "ADVANCED-EDITOR: Found JSON code block, attempting to parse and insert",
                                    );
                                    try {
                                        // Parse the JSON and insert as structured content
                                        const jsonData = JSON.parse(
                                            jsonBlockMatch[1],
                                        );
                                        // Avoid inserting empty JSON doc
                                        if (
                                            jsonData &&
                                            jsonData.type === "doc" &&
                                            Array.isArray(jsonData.content) &&
                                            jsonData.content.length === 1 &&
                                            jsonData.content[0].type ===
                                            "paragraph" &&
                                            (!jsonData.content[0].content ||
                                                jsonData.content[0].content
                                                    .length === 0)
                                        ) {
                                            console.warn(
                                                "⚠️ [ADVANCED-EDITOR] JSON code block is an empty doc, skipping insertion",
                                            );
                                            return;
                                        }
                                        const jsonNode =
                                            editor.schema.nodeFromJSON({
                                                type: "codeBlock",
                                                attrs: { language: "json" },
                                                content: [
                                                    {
                                                        type: "text",
                                                        text: JSON.stringify(
                                                            jsonData,
                                                            null,
                                                            2,
                                                        ),
                                                    },
                                                ],
                                            });
                                        if (jsonNode) {
                                            const tr = editor.state.tr.insert(
                                                editor.state.selection.from,
                                                jsonNode,
                                            );
                                            editor.view.dispatch(tr);
                                            console.log(
                                                "ADVANCED-EDITOR: Successfully inserted JSON as code block",
                                            );
                                        } else {
                                            // Fallback: insert as text
                                            editor.commands.insertContent(
                                                content,
                                            );
                                        }
                                    } catch (e) {
                                        console.error(
                                            "ADVANCED-EDITOR: Failed to parse JSON block:",
                                            e,
                                        );
                                        // Insert as regular text if parsing fails
                                        editor.commands.insertContent(content);
                                    }
                                } else {
                                    // Regular text content - use chunked insertion for large content
                                    console.log(
                                        "ADVANCED-EDITOR: Inserting string content at cursor position",
                                    );

                                    // 🔥 FIX: Chunked insertion for large content to prevent UI freeze
                                    const CHUNK_SIZE = 10000; // 10KB chunks
                                    if (content.length > CHUNK_SIZE) {
                                        console.log(
                                            `⚡ [CHUNKED INSERT] Large content detected (${content.length} chars), using chunked insertion`
                                        );

                                        // Split content into chunks
                                        const chunks: string[] = [];
                                        for (let i = 0; i < content.length; i += CHUNK_SIZE) {
                                            chunks.push(content.substring(i, i + CHUNK_SIZE));
                                        }

                                        // Insert chunks progressively using requestAnimationFrame
                                        let chunkIndex = 0;
                                        const insertNextChunk = () => {
                                            if (chunkIndex < chunks.length) {
                                                editor.commands.insertContent(chunks[chunkIndex]);
                                                chunkIndex++;
                                                requestAnimationFrame(insertNextChunk);
                                            } else {
                                                console.log("✅ [CHUNKED INSERT] All chunks inserted successfully");
                                            }
                                        };

                                        requestAnimationFrame(insertNextChunk);
                                    } else {
                                        // Small content, insert directly
                                        editor.commands.insertContent(content);
                                    }
                                }
                            } else {
                                // For JSONContent, prefer to set content when a full 'doc' is provided
                                try {
                                    const isDoc =
                                        (content as any)?.type === "doc";
                                    const contentArray = (content as any)
                                        ?.content;
                                    const isTrulyEmptyDoc =
                                        !contentArray ||
                                        (Array.isArray(contentArray) &&
                                            contentArray.length === 0) ||
                                        (Array.isArray(contentArray) &&
                                            contentArray.length === 1 &&
                                            contentArray[0].type ===
                                            "paragraph" &&
                                            (!contentArray[0].content ||
                                                contentArray[0].content
                                                    .length === 0));

                                    if (isDoc && isTrulyEmptyDoc) {
                                        console.warn(
                                            "⚠️ [ADVANCED-EDITOR] incoming JSON doc is empty, not inserting",
                                        );
                                        return;
                                    }

                                    if (isDoc && editor.commands?.setContent) {
                                        // This was the original pre-refactor behavior — replace the full document when a root doc is provided
                                        console.log(
                                            "ADVANCED-EDITOR: Replacing entire document with provided ProseMirror doc via setContent",
                                        );
                                        editor
                                            .chain()
                                            .focus()
                                            .setContent(content as any)
                                            .run();
                                    } else {
                                        // Otherwise, create a node from the JSON and insert it at the current selection
                                        const node = editor.schema.nodeFromJSON(
                                            content as any,
                                        );
                                        if (node) {
                                            const pos =
                                                editor.state.selection.from;
                                            const tr = editor.state.tr.insert(
                                                pos,
                                                node,
                                            );
                                            editor.view.dispatch(tr);
                                            console.log(
                                                "ADVANCED-EDITOR: Successfully inserted JSON content as node",
                                            );
                                        } else {
                                            console.error(
                                                "ADVANCED-EDITOR: Failed to create node from JSON; falling back to string insertion",
                                            );
                                            editor
                                                .chain()
                                                .focus()
                                                .insertContent(
                                                    JSON.stringify(
                                                        content,
                                                        null,
                                                        2,
                                                    ),
                                                )
                                                .run();
                                        }
                                    }
                                } catch (error) {
                                    console.error(
                                        "ADVANCED-EDITOR: Error inserting JSON content:",
                                        error,
                                    );
                                    // Final fallback: insert as formatted text
                                    editor
                                        .chain()
                                        .focus()
                                        .insertContent(
                                            JSON.stringify(content, null, 2),
                                        )
                                        .run();
                                }
                            }
                            setSaveStatus("Unsaved");
                            console.log(
                                "ADVANCED-EDITOR: Successfully inserted content at cursor position.",
                            );
                        } catch (error) {
                            console.error("Error inserting content:", error);
                        }
                    }
                },
                getContent: () => {
                    return editor?.getJSON() || null;
                },
                getHTML: () => {
                    return editor?.getHTML() || "";
                },
            }),
            [editor],
        );

        //Apply Codeblock Highlighting on the HTML from editor.getHTML()
        const highlightCodeblocks = (content: string) => {
            const doc = new DOMParser().parseFromString(content, "text/html");
            doc.querySelectorAll("pre code").forEach((el) => {
                // @ts-ignore
                // https://highlightjs.readthedocs.io/en/latest/api.html?highlight=highlightElement#highlightelement
                hljs.highlightElement(el);
            });
            return new XMLSerializer().serializeToString(doc);
        };

        // Thinking injection removed - thinking content now only shows in chat, not in editor

        const debouncedUpdates = useDebouncedCallback(
            async (editor: EditorInstance) => {
                const json = editor.getJSON();
                setCharsCount(editor.storage.characterCount.words());
                if (onUpdate) {
                    onUpdate(json);
                    // Database auto-save handles persistence - no localStorage needed
                }
                setSaveStatus("Saved");
            },
            500,
        );

        useEffect(() => {
            if (propInitialContent !== undefined) {
                setInitialContent(propInitialContent);
            } else {
                // No localStorage fallback - content comes from database via propInitialContent
                setInitialContent(defaultEditorContent);
            }
        }, [propInitialContent]);

        if (!initialContent) return null;

        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col">
                <div className="flex absolute right-5 top-5 z-10 mb-5 gap-2">
                    <div className="rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground">
                        {saveStatus}
                    </div>
                    <div
                        className={
                            charsCount
                                ? "rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground"
                                : "hidden"
                        }
                    >
                        {charsCount} Words
                    </div>
                </div>
                <EditorRoot>
                    <EditorContent
                        immediatelyRender={false}
                        initialContent={initialContent}
                        extensions={extensions}
                        className="relative w-full h-full border-none bg-background overflow-y-auto"
                        onCreate={({ editor }) => setEditor(editor)}
                        editorProps={{
                            handleDOMEvents: {
                                keydown: (_view, event) =>
                                    handleCommandNavigation(event),
                            },
                            handlePaste: (view, event) =>
                                handleImagePaste(view, event, uploadFn),
                            handleDrop: (view, event, _slice, moved) =>
                                handleImageDrop(view, event, moved, uploadFn),
                            attributes: {
                                class: "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full px-8 py-12",
                            },
                        }}
                        onUpdate={({ editor }) => {
                            debouncedUpdates(editor);
                            setSaveStatus("Unsaved");
                        }}
                        slotAfter={<ImageResizer />}
                    >
                        <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
                            <EditorCommandEmpty className="px-2 text-muted-foreground">
                                No results
                            </EditorCommandEmpty>
                            <EditorCommandList>
                                {suggestionItems.map((item) => (
                                    <EditorCommandItem
                                        value={item.title}
                                        onCommand={(val) => item.command(val)}
                                        className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
                                        key={item.title}
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {item.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.description}
                                            </p>
                                        </div>
                                    </EditorCommandItem>
                                ))}
                            </EditorCommandList>
                        </EditorCommand>

                        {/* Text formatting bubble menu - NO Ask AI button */}
                        <EditorBubble
                            tippyOptions={{
                                placement: "top",
                                hideOnClick: false,
                            }}
                            className="flex w-fit max-w-[90vw] overflow-hidden rounded border border-muted bg-background shadow-xl"
                        >
                            <Separator orientation="vertical" />
                            <NodeSelector
                                open={openNode}
                                onOpenChange={setOpenNode}
                            />
                            <Separator orientation="vertical" />

                            <LinkSelector
                                open={openLink}
                                onOpenChange={setOpenLink}
                            />
                            <Separator orientation="vertical" />
                            <MathSelector />
                            <Separator orientation="vertical" />
                            <TextButtons />
                            <Separator orientation="vertical" />
                            <ColorSelector
                                open={openColor}
                                onOpenChange={setOpenColor}
                            />
                        </EditorBubble>

                        {editor && <TableMenu editor={editor} />}

                        {/* Floating AI Assistant Bar - Inside EditorContent for proper context */}
                        <InlineEditor editor={editor} />
                    </EditorContent>
                </EditorRoot>
            </div>
        );
    },
);

TailwindAdvancedEditor.displayName = "TailwindAdvancedEditor";

export default TailwindAdvancedEditor;
