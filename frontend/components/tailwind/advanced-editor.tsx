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
                insertContent: (content: JSONContent) => {
                    if (editor) {
                        console.log(
                            "ADVANCED-EDITOR: Received content to insert:",
                            JSON.stringify(content, null, 2),
                        );
                        // ✅ FIX: Call setContent synchronously (no setTimeout) to prevent race conditions
                        // where old content gets restored by concurrent state updates or auto-save
                        try {
                            editor.commands.setContent(content);
                            setSaveStatus("Unsaved");
                            console.log(
                                "ADVANCED-EDITOR: Successfully called setContent.",
                            );
                        } catch (error) {
                            console.error("Error setting content:", error);
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
