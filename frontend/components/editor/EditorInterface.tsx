import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Placeholder } from "@tiptap/extension-placeholder";
import { CharacterCount } from "@tiptap/extension-character-count";
import { ThinkingAccordion } from "./ThinkingAccordion";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    List,
    ListOrdered,
    Quote,
    Code,
    Heading1,
    Heading2,
    Heading3,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Link as LinkIcon,
    Image as ImageIcon,
    Table as TableIcon,
    Undo,
    Redo,
    Save,
    Printer,
    Eye,
    Edit3,
} from "lucide-react";
import type { Document } from "@/types";
import { Button } from "@/components/tailwind/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/tailwind/ui/dropdown-menu";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/tailwind/ui/dialog";
import { Input } from "@/components/tailwind/ui/input";
import { Separator } from "@/components/tailwind/ui/separator";

const EditorInterface = forwardRef(
    (
        {
            document,
            onSave,
            onPreview,
            onPrint,
        }: {
            document: Document;
            onSave: (content: any) => void;
            onPreview: () => void;
            onPrint: () => void;
        },
        ref,
    ) => {
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [linkText, setLinkText] = useState("");
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [imageAlt, setImageAlt] = useState("");
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Link.configure({
                openOnClick: false,
            }),
            Image,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            Placeholder.configure({
                placeholder: ({ node }) => {
                    if (node.type.name === "heading") {
                        return "Heading";
                    }
                    return "Start writing...";
                },
            }),
            CharacterCount,
        ],
        content: document.content || "",
        onUpdate: ({ editor }) => {
            setIsDirty(true);
            // Auto-save logic could be implemented here
        },
    });

    useImperativeHandle(ref, () => editor ?? null, [editor]);

    useEffect(() => {
        if (editor && document.content && !isDirty) {
            editor.commands.setContent(document.content);
        }
    }, [document, editor, isDirty]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (editor && isDirty) {
                handleSave();
            }
        }, 30000); // Auto-save every 30 seconds

        return () => clearInterval(interval);
    }, [editor, isDirty]);

    const handleSave = () => {
        if (editor) {
            const content = editor.getJSON();
            onSave(content);
            setLastSaved(new Date());
            setIsDirty(false);
        }
    };

    const setLink = () => {
        if (editor) {
            editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: linkUrl })
                .run();
            setLinkDialogOpen(false);
            setLinkUrl("");
        }
    };

    const addImage = () => {
        if (editor) {
            editor
                .chain()
                .focus()
                .setImage({ src: imageUrl, alt: imageAlt })
                .run();
            setImageDialogOpen(false);
            setImageUrl("");
            setImageAlt("");
        }
    };

    const insertTable = () => {
        if (editor) {
            editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run();
        }
    };

    if (!editor) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="border-b p-2 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            editor.chain().focus().toggleBold().run()
                        }
                        className={editor.isActive("bold") ? "bg-gray-100" : ""}
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            editor.chain().focus().toggleItalic().run()
                        }
                        className={
                            editor.isActive("italic") ? "bg-gray-100" : ""
                        }
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            editor.chain().focus().toggleUnderline().run()
                        }
                        className={
                            editor.isActive("underline") ? "bg-gray-100" : ""
                        }
                    >
                        <UnderlineIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            editor.chain().focus().toggleStrike().run()
                        }
                        className={
                            editor.isActive("strike") ? "bg-gray-100" : ""
                        }
                    >
                        <Strikethrough className="h-4 w-4" />
                    </Button>

                    <Separator orientation="vertical" className="mx-1 h-6" />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <Heading1 className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem
                                onClick={() =>
                                    editor
                                        .chain()
                                        .focus()
                                        .toggleHeading({ level: 1 })
                                        .run()
                                }
                            >
                                <Heading1 className="h-4 w-4 mr-2" />
                                Heading 1
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    editor
                                        .chain()
                                        .focus()
                                        .toggleHeading({ level: 2 })
                                        .run()
                                }
                            >
                                <Heading2 className="h-4 w-4 mr-2" />
                                Heading 2
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    editor
                                        .chain()
                                        .focus()
                                        .toggleHeading({ level: 3 })
                                        .run()
                                }
                            >
                                <Heading3 className="h-4 w-4 mr-2" />
                                Heading 3
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    editor.chain().focus().setParagraph().run()
                                }
                            >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Paragraph
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Separator orientation="vertical" className="mx-1 h-6" />

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            editor.chain().focus().toggleBulletList().run()
                        }
                        className={
                            editor.isActive("bulletList") ? "bg-gray-100" : ""
                        }
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            editor.chain().focus().toggleOrderedList().run()
                        }
                        className={
                            editor.isActive("orderedList") ? "bg-gray-100" : ""
                        }
                    >
                        <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            editor.chain().focus().toggleBlockquote().run()
                        }
                        className={
                            editor.isActive("blockquote") ? "bg-gray-100" : ""
                        }
                    >
                        <Quote className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            editor.chain().focus().toggleCodeBlock().run()
                        }
                        className={
                            editor.isActive("codeBlock") ? "bg-gray-100" : ""
                        }
                    >
                        <Code className="h-4 w-4" />
                    </Button>

                    <Separator orientation="vertical" className="mx-1 h-6" />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <AlignLeft className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem
                                onClick={() =>
                                    editor
                                        .chain()
                                        .focus()
                                        .setTextAlign("left")
                                        .run()
                                }
                            >
                                <AlignLeft className="h-4 w-4 mr-2" />
                                Left
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    editor
                                        .chain()
                                        .focus()
                                        .setTextAlign("center")
                                        .run()
                                }
                            >
                                <AlignCenter className="h-4 w-4 mr-2" />
                                Center
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    editor
                                        .chain()
                                        .focus()
                                        .setTextAlign("right")
                                        .run()
                                }
                            >
                                <AlignRight className="h-4 w-4 mr-2" />
                                Right
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Separator orientation="vertical" className="mx-1 h-6" />

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            const { from, to } = editor.state.selection;
                            const text = editor.state.doc.textBetween(
                                from,
                                to,
                                "",
                            );
                            setLinkText(text);
                            setLinkDialogOpen(true);
                        }}
                    >
                        <LinkIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setImageDialogOpen(true)}
                    >
                        <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={insertTable}>
                        <TableIcon className="h-4 w-4" />
                    </Button>

                    <Separator orientation="vertical" className="mx-1 h-6" />

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                    >
                        <Undo className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                    >
                        <Redo className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center space-x-2">
                    {isDirty && (
                        <span className="text-xs text-orange-600">
                            Unsaved changes
                        </span>
                    )}
                    {lastSaved && (
                        <span className="text-xs text-gray-500">
                            Last saved: {lastSaved.toLocaleTimeString()}
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        className={isPreviewMode ? "bg-gray-100" : ""}
                    >
                        <Eye className="h-4 w-4 mr-1" />
                        {isPreviewMode ? "Edit" : "Preview"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onPrint}>
                        <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSave}
                        className={isDirty ? "text-orange-600" : ""}
                    >
                        <Save className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* AI Thinking Process Accordion */}
            <ThinkingAccordion className="mx-2 mt-2" />

            <div className="flex-1 overflow-auto">
                {isPreviewMode ? (
                    <div className="p-6 max-w-4xl mx-auto">
                        <div className="prose prose-lg max-w-none">
                            {editor?.getHTML()}
                        </div>
                    </div>
                ) : (
                    <EditorContent
                        editor={editor}
                        className="h-full p-6 prose prose-lg max-w-none focus:outline-none"
                    />
                )}
            </div>

            {/* Link Dialog */}
            <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Link</DialogTitle>
                        <DialogDescription>
                            Add a hyperlink to your document
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="link-text"
                                    className="text-sm font-medium"
                                >
                                    Text
                                </label>
                                <Input
                                    id="link-text"
                                    value={linkText}
                                    onChange={(e) =>
                                        setLinkText(e.target.value)
                                    }
                                    placeholder="Link text"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="link-url"
                                    className="text-sm font-medium"
                                >
                                    URL
                                </label>
                                <Input
                                    id="link-url"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="https://example.com"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                onClick={() => setLinkDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                        </DialogTrigger>
                        <Button onClick={setLink} disabled={!linkUrl}>
                            Add Link
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Image Dialog */}
            <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Image</DialogTitle>
                        <DialogDescription>
                            Add an image to your document
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="image-url"
                                    className="text-sm font-medium"
                                >
                                    Image URL
                                </label>
                                <Input
                                    id="image-url"
                                    value={imageUrl}
                                    onChange={(e) =>
                                        setImageUrl(e.target.value)
                                    }
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="image-alt"
                                    className="text-sm font-medium"
                                >
                                    Alt Text
                                </label>
                                <Input
                                    id="image-alt"
                                    value={imageAlt}
                                    onChange={(e) =>
                                        setImageAlt(e.target.value)
                                    }
                                    placeholder="Image description"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setImageDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={addImage} disabled={!imageUrl}>
                            Add Image
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
});

EditorInterface.displayName = "EditorInterface";

export default EditorInterface;
