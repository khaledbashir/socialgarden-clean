#!/bin/bash
# Git Push Configuration for the11-dev-clean
# Automatically detects frontend vs backend changes and pushes to correct branch

REPO_PATH="/root/the11-dev-clean"
FRONTEND_BRANCH="sow-latest"
BACKEND_BRANCH="backend-service"

cd "$REPO_PATH" || exit 1

# Get list of changed files
CHANGED_FILES=$(git diff --cached --name-only 2>/dev/null || git diff --name-only 2>/dev/null)

if [ -z "$CHANGED_FILES" ]; then
    echo "❌ No changes detected. Please stage files first with 'git add'"
    exit 1
fi

# Check if changes are in frontend or backend
HAS_FRONTEND=false
HAS_BACKEND=false

for file in $CHANGED_FILES; do
    if [[ $file == frontend/* ]]; then
        HAS_FRONTEND=true
    elif [[ $file == backend/* ]]; then
        HAS_BACKEND=true
    fi
done

# Determine which branch to push to
if [ "$HAS_FRONTEND" = true ] && [ "$HAS_BACKEND" = true ]; then
    echo "⚠️  Mixed changes detected (both frontend and backend)"
    echo "   Frontend changes will go to: $FRONTEND_BRANCH"
    echo "   Backend changes will go to: $BACKEND_BRANCH"
    echo ""
    echo "   Please push manually or separate the changes."
    exit 1
elif [ "$HAS_FRONTEND" = true ]; then
    TARGET_BRANCH="$FRONTEND_BRANCH"
    TYPE="frontend"
elif [ "$HAS_BACKEND" = true ]; then
    TARGET_BRANCH="$BACKEND_BRANCH"
    TYPE="backend"
else
    # Root level or other changes - default to frontend branch
    TARGET_BRANCH="$FRONTEND_BRANCH"
    TYPE="root/other"
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
    echo "🔄 Switching from '$CURRENT_BRANCH' to '$TARGET_BRANCH'..."
    git checkout "$TARGET_BRANCH" || exit 1
fi

echo "✅ Detected $TYPE changes"
echo "📤 Pushing to branch: $TARGET_BRANCH"
echo ""

# Push to the correct branch
git push origin "$TARGET_BRANCH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to $TARGET_BRANCH"
else
    echo ""
    echo "❌ Push failed"
    exit 1
fi

