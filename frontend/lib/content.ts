// Clean slate: Empty editor state (no hardcoded placeholder content)
// Users see a blank canvas when creating a new workspace/document
export const defaultEditorContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [],
    },
  ],
};