#!/usr/bin/env python3
"""
Script to fix the hasThinkTag logic in streaming-thought-accordion.tsx
"""

import re


def fix_thinking_tag_logic():
    # Read the file
    with open(
        "/root/the11-dev/frontend/components/tailwind/streaming-thought-accordion.tsx",
        "r",
        encoding="utf-8",
    ) as f:
        content = f.read()

    # Pattern to match the exact line with hasThinkTag
    pattern = r"hasThinkTag: content\?\.\includes\(\\\"\u003e\\\"\) \|\| false,"

    # Replacement string
    replacement = 'hasThinkTag: content?.includes("\\u003e") || content?.includes("<thinking>") || content?.includes(">") || content?.includes("<AI_THINK>") || false,'

    # Replace the pattern
    if pattern in content:
        content = content.replace(pattern, replacement)
        print("✅ Fixed hasThinkTag logic successfully")
    else:
        print("❌ Pattern not found, checking alternative...")
        # Try alternative pattern with the actual character
        alt_pattern = r"hasThinkTag: content\?\.\includes\(\\\"\u003e\\\"\) \|\| false,"
        if alt_pattern in content:
            content = content.replace(alt_pattern, replacement)
            print("✅ Fixed hasThinkTag logic successfully (alternative pattern)")
        else:
            print("❌ Could not find hasThinkTag pattern to fix")
            return False

    # Write back to file
    with open(
        "/root/the11-dev/frontend/components/tailwind/streaming-thought-accordion.tsx",
        "w",
        encoding="utf-8",
    ) as f:
        f.write(content)

    return True

    return True

if __name__ == "__main__":
    success = fix_thinking_tag_logic()
    if success:
        print("File fix completed!")
    else:
        print("File fix failed!")
