"use client";

import { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import {
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Table as TableIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

interface TableMenuProps {
  editor: Editor | null;
}

export function TableMenu({ editor }: TableMenuProps) {
  const [isInTable, setIsInTable] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const updateMenu = () => {
      try {
        const inTable = editor.isActive("table");
        setIsInTable(inTable);
      } catch (e) {
        setIsInTable(false);
      }
    };

    // Update on selection change
    editor.on("selectionUpdate", updateMenu);
    editor.on("update", updateMenu);

    return () => {
      editor.off("selectionUpdate", updateMenu);
      editor.off("update", updateMenu);
    };
  }, [editor]);

  if (!editor || !isInTable) {
    return null;
  }

  const safeExecute = (command: () => boolean) => {
    try {
      command();
    } catch (error) {
      console.error("Table operation failed:", error);
    }
  };

  return (
    <div className="fixed top-20 right-8 z-50 flex items-center gap-1 rounded-lg border border-[#0e2e33] bg-[#0e2e33]/5 backdrop-blur-sm p-1 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Row Operations */}
      <div className="flex items-center gap-0.5">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => safeExecute(() => editor.chain().focus().addRowBefore().run())}
          className="h-8 w-8 p-0"
          title="Add row above"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => safeExecute(() => editor.chain().focus().addRowAfter().run())}
          className="h-8 w-8 p-0"
          title="Add row below"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => safeExecute(() => editor.chain().focus().deleteRow().run())}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          title="Delete row"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 bg-[#0e2e33]/20" />

      {/* Column Operations */}
      <div className="flex items-center gap-0.5">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => safeExecute(() => editor.chain().focus().addColumnBefore().run())}
          className="h-8 w-8 p-0"
          title="Add column left"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => safeExecute(() => editor.chain().focus().addColumnAfter().run())}
          className="h-8 w-8 p-0"
          title="Add column right"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => safeExecute(() => editor.chain().focus().deleteColumn().run())}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          title="Delete column"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 bg-[#0e2e33]/20" />

      {/* Table Operations */}
      <div className="flex items-center gap-0.5">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => safeExecute(() => editor.chain().focus().toggleHeaderRow().run())}
          className="h-8 w-8 p-0"
          title="Toggle header row"
        >
          <TableIcon className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => safeExecute(() => editor.chain().focus().deleteTable().run())}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          title="Delete table"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
