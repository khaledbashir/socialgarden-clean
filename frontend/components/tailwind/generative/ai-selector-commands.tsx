import { ArrowDownWideNarrow, CheckCheck, RefreshCcwDot, StepForward, WrapText, Sparkles, RotateCcw } from "lucide-react";
import { useEditor } from "novel";
import { getPrevText } from "novel/utils";
import { Button } from "../ui/button";

const options = [
  {
    value: "improve",
    label: "Improve writing",
    icon: RefreshCcwDot,
    description: "Enhance clarity and flow",
  },
  {
    value: "fix",
    label: "Fix grammar",
    icon: CheckCheck,
    description: "Correct grammar and spelling",
  },
  {
    value: "shorter",
    label: "Make shorter",
    icon: ArrowDownWideNarrow,
    description: "Concise and to the point",
  },
  {
    value: "longer",
    label: "Make longer",
    icon: WrapText,
    description: "Add more detail and context",
  },
  {
    value: "continue",
    label: "Continue writing",
    icon: StepForward,
    description: "Generate next paragraph",
  },
  {
    value: "bullets-to-table",
    label: "Turn bullets into table",
    icon: Sparkles,
    description: "Convert bullet points to formatted table",
  },
  {
    value: "expand",
    label: "Expand and detail",
    icon: WrapText,
    description: "Make more comprehensive and detailed",
  },
  {
    value: "summarize",
    label: "Summarize",
    icon: ArrowDownWideNarrow,
    description: "Create concise summary",
  },
  {
    value: "simplify",
    label: "Simplify language",
    icon: CheckCheck,
    description: "Make easier to understand",
  },
  {
    value: "professional",
    label: "Make professional",
    icon: RefreshCcwDot,
    description: "Convert to professional tone",
  },
  {
    value: "casual",
    label: "Make casual",
    icon: RefreshCcwDot,
    description: "Convert to casual, friendly tone",
  },
  {
    value: "add-examples",
    label: "Add examples",
    icon: Sparkles,
    description: "Include relevant examples",
  },
  {
    value: "add-numbers",
    label: "Add statistics",
    icon: Sparkles,
    description: "Include numbers and data",
  },
  {
    value: "rewrite",
    label: "Rewrite completely",
    icon: RotateCcw,
    description: "Fresh take on the content",
  },
];

interface AISelectorCommandsProps {
  onSelect: (value: string, option: string) => void;
}

const AISelectorCommands = ({ onSelect }: AISelectorCommandsProps) => {
  const { editor } = useEditor();

  const handleSelect = async (option: string) => {
    try {
      if (option === "continue") {
        const pos = editor.state.selection.from;
        const text = getPrevText(editor, pos);
        onSelect(text, option);
      } else {
        const slice = editor.state.selection.content();
        const text = editor.storage.markdown.serializer.serialize(slice.content);
        onSelect(text, option);
      }
    } catch (error) {
      console.error("Command error:", error);
    }
  };

  return (
    <div className="grid grid-cols-5 gap-2 mb-4">
      {options.map((option) => (
        <Button
          key={option.value}
          variant="ghost"
          className="flex flex-col items-center gap-2 h-20 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-purple-500 transition-all"
          onClick={() => handleSelect(option.value)}
        >
          <option.icon className="h-4 w-4 text-purple-400" />
          <div className="text-center">
            <div className="text-sm font-medium text-white">{option.label}</div>
            <div className="text-xs text-gray-400">{option.description}</div>
          </div>
        </Button>
      ))}
    </div>
  );
};

export default AISelectorCommands;
