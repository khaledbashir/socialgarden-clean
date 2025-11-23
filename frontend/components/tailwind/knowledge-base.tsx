"use client";

export function KnowledgeBase() {
  return (
    <div className="w-full h-full flex flex-col bg-[#0e0f0f]">
      <div className="flex-1 overflow-hidden bg-[#0e0f0f]">
        <iframe
          src="https://ahmad-anything-llm.840tjq.easypanel.host/"
          className="w-full h-full border-0"
          title="AnythingLLM Knowledge Base"
          allow="microphone; camera; clipboard-read; clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}
