// Complete Editor Insertion Fix - Restore Communication Chain
// Add these functions to your main page.tsx or appropriate component

import { useCallback, useRef, useState, useEffect } from 'react';

// Emergency direct insertion function (bypasses broken component communication)
const emergencyDirectInsertion = (content: string) => {
  console.log("🚨 [EMERGENCY] Direct editor insertion triggered");
  
  try {
    // Try multiple methods to access the editor
    const editorElement = document.querySelector('[data-editor]');
    const tipTapEditor = (window as any).__tiptap_editor;
    
    if (tipTapEditor && typeof tipTapEditor.commands?.setContent === 'function') {
      console.log("✅ [EMERGENCY] Using TipTap editor direct insertion");
      tipTapEditor.commands.setContent(content);
      return true;
    }
    
    if (editorElement && (window as any).editorRef?.current) {
      console.log("✅ [EMERGENCY] Using editorRef current insertion");
      (window as any).editorRef.current.commands.setContent(content);
      return true;
    }
    
    console.error("❌ [EMERGENCY] No editor access found");
    return false;
  } catch (error) {
    console.error("❌ [EMERGENCY] Insertion failed:", error);
    return false;
  }
};

// Restored handleInsertContent function (from original working version)
export const restoredHandleInsertContent = (content: string) => {
  console.log("🔄 [INSERTION] HandleInsertContent called with:", content.length, "characters");
  
  try {
    // Check if we have processed content from streaming accordion
    const processedContent = (window as any).__latestProcessedContent;
    
    if (processedContent) {
      console.log("📝 [INSERTION] Using processed content from streaming accordion");
      content = processedContent;
      // Clear the global processed content
      (window as any).__latestProcessedContent = null;
    }
    
    // Extract pricing JSON if present
    console.log("🔍 [INSERTION] Extracting pricing JSON from content...");
    const pricingData = (window as any).extractPricingJSON?.(content);
    
    if (pricingData) {
      console.log("💰 [INSERTION] Pricing data extracted:", pricingData);
      
      // Store multi-scope data for PDF export
      if (pricingData.scopes && pricingData.scopes.length > 0) {
        console.log("📊 [INSERTION] Storing multi-scope pricing data:", pricingData.scopes.length, "scopes");
        (window as any).setMultiScopePricingData?.(pricingData);
      }
    }
    
    // Convert to editor JSON if needed
    let editorContent = content;
    const convertMarkdownToNovelJSON = (window as any).convertMarkdownToNovelJSON;
    
    if (convertMarkdownToNovelJSON && typeof convertMarkdownToNovelJSON === 'function') {
      console.log("🔄 [INSERTION] Converting markdown to editor JSON...");
      try {
        editorContent = convertMarkdownToNovelJSON(content);
        console.log("✅ [INSERTION] Content converted to editor JSON");
      } catch (convertError) {
        console.warn("⚠️ [INSERTION] Content conversion failed, using raw content:", convertError);
      }
    }
    
    // Insert into editor
    console.log("📝 [INSERTION] Inserting content into editor...");
    
    const editorRef = (window as any).editorRef?.current;
    if (editorRef && typeof editorRef.commands?.setContent === 'function') {
      editorRef.commands.setContent(editorContent);
      console.log("✅ [INSERTION] Content inserted via editorRef");
    } else {
      // Try emergency insertion
      const emergencySuccess = emergencyDirectInsertion(editorContent);
      if (emergencySuccess) {
        console.log("✅ [INSERTION] Content inserted via emergency method");
      } else {
        throw new Error("No editor access available");
      }
    }
    
    // Update latest editor JSON state
    const setLatestEditorJSON = (window as any).setLatestEditorJSON;
    if (setLatestEditorJSON && editorContent) {
      setLatestEditorJSON(editorContent);
    }
    
    console.log("✅ [INSERTION] Editor content updated successfully");
    
  } catch (error) {
    console.error("❌ [INSERTION] Failed to insert content:", error);
    
    // Show user-friendly error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.log("📢 [INSERTION] Showing error to user:", errorMessage);
    
    // You could add a toast notification here if you have one
    alert(`Insertion failed: ${errorMessage}. Please try again.`);
  }
};

// ChatInterface callback restoration
export const createChatInterfaceProps = () => {
  return {
    onInsertToEditor: (content: string) => {
      console.log("🔗 [CALLBACK] ChatInterface calling onInsertToEditor");
      console.log("🔍 [CALLBACK] Content length:", content.length);
      
      // Add debugging to track the callback chain
      (window as any).__lastInsertCallback = {
        timestamp: Date.now(),
        contentLength: content.length,
        hasContent: !!content
      };
      
      restoredHandleInsertContent(content);
    },
    
    onSendMessage: (message: string) => {
      console.log("💬 [CALLBACK] ChatInterface calling onSendMessage");
      // Your existing send message logic here
    },
    
    // Add emergency insertion button for debugging
    emergencyInsertion: () => {
      console.log("🚨 [EMERGENCY] Emergency insertion triggered by user");
      
      // Try to get last AI response content
      const lastAIResponse = (window as any).__lastAIResponse;
      if (lastAIResponse) {
        console.log("📄 [EMERGENCY] Using last AI response for insertion");
        restoredHandleInsertContent(lastAIResponse);
      } else {
        console.warn("⚠️ [EMERGENCY] No AI response found to insert");
        alert("No AI response available to insert. Please generate content first.");
      }
    }
  };
};

// Global function to manually trigger insertion (for debugging)
(window as any).manualInsertToEditor = (content: string) => {
  console.log("🔧 [MANUAL] Manual insertion triggered with content length:", content.length);
  restoredHandleInsertContent(content);
};

// Export the emergency insertion function globally
(window as any).emergencyInsert = emergencyDirectInsertion;