import {
  AIHighlight,
  CharacterCount,
  CodeBlockLowlight,
  HorizontalRule,
  Placeholder,
  StarterKit,
  TaskItem,
  TaskList,
  Twitter,
  Youtube,
} from "novel/extensions";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
// import GlobalDragHandle from "tiptap-extension-global-drag-handle";
import { EditablePricingTable } from "./extensions/editable-pricing-table";

import { cx } from "class-variance-authority";
import { common, createLowlight } from "lowlight";

//TODO I am using cx here to get tailwind autocomplete working, idk if someone else can write a regex to just capture the class key in objects
const aiHighlight = AIHighlight;
//You can overwrite the placeholder with your own configuration
const placeholder = Placeholder;
const tiptapLink = Link.configure({
  HTMLAttributes: {
    class: cx(
      "text-muted-foreground underline underline-offset-[3px] hover:text-primary transition-colors cursor-pointer",
    ),
  },
});

const updatedImage = Image.configure({
  HTMLAttributes: {
    class: cx("rounded-lg border border-muted"),
  },
});

const taskList = TaskList.configure({
  HTMLAttributes: {
    class: cx("not-prose pl-2 "),
  },
});
const taskItem = TaskItem.configure({
  HTMLAttributes: {
    class: cx("flex gap-2 items-start my-4"),
  },
  nested: true,
});

const horizontalRule = HorizontalRule.configure({
  HTMLAttributes: {
    class: cx("mt-4 mb-6 border-t border-muted-foreground"),
  },
});

const starterKit = StarterKit.configure({
  bulletList: {
    HTMLAttributes: {
      class: cx("list-disc list-outside leading-3 -mt-2"),
    },
  },
  orderedList: {
    HTMLAttributes: {
      class: cx("list-decimal list-outside leading-3 -mt-2"),
    },
  },
  listItem: {
    HTMLAttributes: {
      class: cx("leading-normal -mb-2"),
    },
  },
  blockquote: {
    HTMLAttributes: {
      class: cx("border-l-4 border-primary"),
    },
  },
  codeBlock: false, // Disabled because we're using CodeBlockLowlight
  code: {
    HTMLAttributes: {
      class: cx("rounded-md bg-muted  px-1.5 py-1 font-mono font-medium"),
      spellcheck: "false",
    },
  },
  horizontalRule: false,
  dropcursor: {
    color: "#DBEAFE",
    width: 4,
  },
  gapcursor: false,
});

const codeBlockLowlight = CodeBlockLowlight.configure({
  // configure lowlight: common /  all / use highlightJS in case there is a need to specify certain language grammars only
  // common: covers 37 language grammars which should be good enough in most cases
  lowlight: createLowlight(common),
});

const youtube = Youtube.configure({
  HTMLAttributes: {
    class: cx("rounded-lg border border-muted"),
  },
  inline: false,
});

const twitter = Twitter.configure({
  HTMLAttributes: {
    class: cx("not-prose"),
  },
  inline: false,
});

const characterCount = CharacterCount.configure();

const table = Table.configure({
  resizable: true,
  HTMLAttributes: {
    class: cx("border-collapse table-auto w-full"),
  },
});

const tableRow = TableRow.configure({
  HTMLAttributes: {
    class: cx(""),
  },
});

const tableHeader = TableHeader.configure({
  HTMLAttributes: {
    class: cx("border border-border bg-muted px-3 py-2 text-left font-medium"),
  },
});

const tableCell = TableCell.configure({
  HTMLAttributes: {
    class: cx("border border-border px-3 py-2"),
  },
});

export const defaultExtensions: any[] = [
  starterKit,
  placeholder,
  tiptapLink,
  updatedImage,
  taskList,
  taskItem,
  horizontalRule,
  aiHighlight,
  codeBlockLowlight,
  youtube,
  twitter,
  characterCount,
  // GlobalDragHandle,
  table,
  tableRow,
  tableHeader,
  tableCell,
  EditablePricingTable,
];