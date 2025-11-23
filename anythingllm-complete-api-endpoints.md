# AnythingLLM Complete API Endpoints Reference

## API Information
- **Title**: AnythingLLM Developer API
- **Version**: 1.0.0
- **Description**: API endpoints that enable programmatic reading, writing, and updating of your AnythingLLM instance
- **Base URL**: `/api`
- **Security**: Bearer Authentication (JWT)

---

## Authentication Endpoints

### 1. GET /v1/auth
**Description**: Verify the attached Authentication header contains a valid API token
- **Tags**: Authentication
- **Parameters**: None
- **Responses**:
  - `200`: Valid auth token was found
    ```json
    {
      "authenticated": true
    }
    ```
  - `403`: Forbidden - Invalid API Key

---

## Admin Endpoints

### 2. GET /v1/admin/is-multi-user-mode
**Description**: Check to see if the instance is in multi-user-mode first
- **Tags**: Admin
- **Parameters**: None
- **Responses**:
  - `200`: OK
    ```json
    {
      "isMultiUser": true
    }
    ```

### 3. GET /v1/admin/users
**Description**: List all existing users (requires multi-user mode)
- **Tags**: Admin
- **Parameters**: None
- **Responses**:
  - `200`: OK
    ```json
    {
      "users": [
        {
          "username": "sample-sam",
          "role": "default"
        }
      ]
    }
    ```
  - `401`: Instance is not in Multi-User mode

### 4. POST /v1/admin/users/new
**Description**: Create a new user with username and password (requires multi-user mode)
- **Tags**: Admin
- **Parameters**: None
- **Request Body**:
  ```json
  {
    "username": "sample-sam",
    "password": "hunter2",
    "role": "default | admin"
  }
  ```
- **Responses**:
  - `200`: OK
    ```json
    {
      "user": {
        "id": 1,
        "username": "sample-sam",
        "role": "default"
      },
      "error": null
    }
    ```

### 5. POST /v1/admin/users/{id}
**Description**: Update existing user settings (requires multi-user mode)
- **Tags**: Admin
- **Parameters**:
  - `id` (path, required): id of the user in the database
- **Request Body**:
  ```json
  {
    "username": "sample-sam",
    "password": "hunter2",
    "role": "default | admin",
    "suspended": 0
  }
  ```
- **Responses**:
  - `200`: OK
    ```json
    {
      "success": true,
      "error": null
    }
    ```

### 6. DELETE /v1/admin/users/{id}
**Description**: Delete existing user by id (requires multi-user mode)
- **Tags**: Admin
- **Parameters**:
  - `id` (path, required): id of the user in the database
- **Responses**:
  - `200`: OK
    ```json
    {
      "success": true,
      "error": null
    }
    ```

### 7. GET /v1/admin/invites
**Description**: List all existing invitations (requires multi-user mode)
- **Tags**: Admin
- **Parameters**: None
- **Responses**:
  - `200`: OK
    ```json
    {
      "invites": [
        {
          "id": 1,
          "status": "pending",
          "code": "abc-123",
          "claimedBy": null
        }
      ]
    }
    ```

### 8. POST /v1/admin/invite/new
**Description**: Create a new invite code (requires multi-user mode)
- **Tags**: Admin
- **Parameters**: None
- **Request Body** (optional):
  ```json
  {
    "workspaceIds": [1, 2, 45]
  }
  ```
- **Responses**:
  - `200`: OK
    ```json
    {
      "invite": {
        "id": 1,
        "status": "pending",
        "code": "abc-123"
      },
      "error": null
    }
    ```

### 9. DELETE /v1/admin/invite/{id}
**Description**: Deactivates (soft-delete) invite by id (requires multi-user mode)
- **Tags**: Admin
- **Parameters**:
  - `id` (path, required): id of the invite in the database
- **Responses**:
  - `200`: OK
    ```json
    {
      "success": true,
      "error": null
    }
    ```

### 10. GET /v1/admin/workspaces/{workspaceId}/users
**Description**: Retrieve a list of users with permissions to access the specified workspace
- **Tags**: Admin
- **Parameters**:
  - `workspaceId` (path, required): id of the workspace
- **Responses**:
  - `200`: OK
    ```json
    {
      "users": [
        {
          "userId": 1,
          "role": "admin"
        },
        {
          "userId": 2,
          "role": "member"
        }
      ]
    }
    ```

### 11. POST /v1/admin/workspaces/{workspaceSlug}/manage-users
**Description**: Set workspace permissions to be accessible by the given user ids and admins
- **Tags**: Admin
- **Parameters**:
  - `workspaceSlug` (path, required): slug of the workspace in the database
- **Request Body**:
  ```json
  {
    "userIds": [1, 2, 4, 12],
    "reset": false
  }
  ```
- **Responses**:
  - `200`: OK
    ```json
    {
      "success": true,
      "error": null,
      "users": [
        {
          "userId": 1,
          "username": "main-admin",
          "role": "admin"
        },
        {
          "userId": 2,
          "username": "sample-sam",
          "role": "default"
        }
      ]
    }
    ```

### 12. POST /v1/admin/preferences
**Description**: Update multi-user preferences for instance (requires multi-user mode)
- **Tags**: Admin
- **Parameters**: None
- **Request Body**:
  ```json
  {
    "support_email": "support@example.com"
  }
  ```
- **Responses**:
  - `200`: OK
    ```json
    {
      "success": true,
      "error": null
    }
    ```

---

## Document Management Endpoints

### 13. POST /v1/document/upload
**Description**: Upload a new file to AnythingLLM to be parsed and prepared for embedding
- **Tags**: Documents
- **Parameters**: None
- **Request Body** (multipart/form-data):
  - `file` (binary, required): The file to upload
  - `addToWorkspaces` (string, optional): comma-separated text-string of workspace slugs
  - `metadata` (object, optional): Key:Value pairs of metadata
    ```json
    {
      "title": "Custom Title",
      "docAuthor": "Author Name",
      "description": "A brief description",
      "docSource": "Source of the document"
    }
    ```
- **Responses**:
  - `200`: OK
    ```json
    {
      "success": true,
      "error": null,
      "documents": [
        {
          "location": "custom-documents/anythingllm.txt-6e8be64c-c162-4b43-9997-b068c0071e8b.json",
          "name": "anythingllm.txt-6e8be64c-c162-4b43-9997-b068c0071e8b.json",
          "url": "file://Users/tim/Documents/anything-llm/collector/hotdir/anythingllm.txt",
          "title": "anythingllm.txt",
          "docAuthor": "Unknown",
          "description": "Unknown",
          "docSource": "a text file uploaded by the user.",
          "chunkSource": "anythingllm.txt",
          "published": "1/16/2024, 3:07:00 PM",
          "wordCount": 93,
          "token_count_estimate": 115
        }
      ]
    }
    ```

### 14. POST /v1/document/upload/{folderName}
**Description**: Upload a new file to a specific folder (creates folder if it doesn't exist)
- **Tags**: Documents
- **Parameters**:
  - `folderName` (path, required): Target folder path
- **Request Body** (multipart/form-data): Same as /v1/document/upload
- **Responses**:
  - `200`: OK (same structure as upload endpoint)
  - `500`: Document processing API is not online

### 15. POST /v1/document/upload-link
**Description**: Upload a valid URL for AnythingLLM to scrape and prepare for embedding
- **Tags**: Documents
- **Parameters**: None
- **Request Body**:
  ```json
  {
    "link": "https://anythingllm.com",
    "addToWorkspaces": "workspace1,workspace2",
    "scraperHeaders": {
      "Authorization": "Bearer token123",
      "My-Custom-Header": "value"
    },
    "metadata": {
      "title": "Custom Title",
      "docAuthor": "Author Name",
      "description": "A brief description",
      "docSource": "Source of the document"
    }
  }
  ```
- **Responses**:
  - `200`: OK
    ```json
    {
      "success": true,
      "error": null,
      "documents": [
        {
          "id": "c530dbe6-bff1-4b9e-b87f-710d539d20bc",
          "url": "file://useanything_com.html",
          "title": "useanything_com.html",
          "docAuthor": "no author found",
          "description": "No description found.",
          "docSource": "URL link uploaded by the user.",
          "chunkSource": "https:anythingllm.com.html",
          "published": "1/16/2024, 3:46:33 PM",
          "wordCount": 252,
          "pageContent": "AnythingLLM is the best....",
          "token_count_estimate": 447,
          "location": "custom-documents/url-useanything_com-c530dbe6-bff1-4b9e-b87f-710d539d20bc.json"
        }
      ]
    }
    ```

### 16. POST /v1/document/raw-text
**Description**: Upload a file by specifying its raw text content without uploading a file
- **Tags**: Documents
- **Parameters**: None
- **Request Body**:
  ```json
  {
    "textContent": "This is the raw text that will be saved as a document in AnythingLLM.",
    "addToWorkspaces": "workspace1,workspace2",
    "metadata": {
      "title": "This key is required. See in /server/endpoints/api/document/index.js:287",
      "keyOne": "valueOne",
      "keyTwo": "valueTwo",
      "etc": "etc"
    }
  }
  ```
- **Responses**:
  - `200`: OK
  - `422`: Unprocessable Entity

### 17. GET /v1/documents
**Description**: List of all locally-stored documents in instance
- **Tags**: Documents
- **Parameters**: None
- **Responses**:
  - `200`: OK
    ```json
    {
      "localFiles": {
        "name": "documents",
        "type": "folder",
        "items": [
          {
            "name": "my-stored-document.json",
            "type": "file",
            "id": "bb07c334-4dab-4419-9462-9d00065a49a1",
            "url": "file://my-stored-document.txt",
            "title": "my-stored-document.txt",
            "cached": false
          }
        ]
      }
    }
    ```

### 18. GET /v1/documents/folder/{folderName}
**Description**: Get all documents stored in a specific folder
- **Tags**: Documents
- **Parameters**:
  - `folderName` (path, required): Name of the folder to retrieve documents from
- **Responses**:
  - `200`: OK
    ```json
    {
      "folder": "custom-documents",
      "documents": [
        {
          "name": "document1.json",
          "type": "file",
          "cached": false,
          "pinnedWorkspaces": [],
          "watched": false,
          "more": "data"
        }
      ]
    }
    ```

### 19. GET /v1/document/accepted-file-types
**Description**: Check available filetypes and MIMEs that can be uploaded
- **Tags**: Documents
- **Parameters**: None
- **Responses**:
  - `200`: OK
    ```json
    {
      "types": {
        "application/mbox": [".mbox"],
        "application/pdf": [".pdf"],
        "application/vnd.oasis.opendocument.text": [".odt"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
        "text/plain": [".txt", ".md"]
      }
    }
    ```

### 20. GET /v1/document/metadata-schema
**Description**: Get the known available metadata schema for raw-text upload
- **Tags**: Documents
- **Parameters**: None
- **Responses**:
  - `200`: OK
    ```json
    {
      "schema": {
        "keyOne": "string | number | nullable",
        "keyTwo": "string | number | nullable",
        "specialKey": "number",
        "title": "string"
      }
    }
    ```

### 21. GET /v1/document/{docName}
**Description**: Get a single document by its unique AnythingLLM document name
- **Tags**: Documents
- **Parameters**:
  - `docName` (path, required): Unique document name to find
- **Responses**:
  - `200`: OK
  - `404`: Not Found

### 22. POST /v1/document/create-folder
**Description**: Create a new folder inside the documents storage directory
- **Tags**: Documents
- **Parameters**: None
- **Request Body**:
  ```json
  {
    "name": "new-folder"
  }
  ```
- **Responses**:
  - `200`: OK
    ```json
    {
      "success": true,
      "message": null
    }
    ```

### 23. DELETE /v1/document/remove-folder
**Description**: Remove a folder and all its contents from the documents storage directory
- **Tags**: Documents
- **Parameters**: None
- **Request Body**:
  ```json
  {
    "name": "my-folder"
  }
  ```
- **Responses**:
  - `200`: OK
    ```json
    {
      "success": true,
      "message": "Folder removed successfully"
    }
    ```

### 24. POST /v1/document/move-files
**Description**: Move files within the documents storage directory
- **Tags**: Documents
- **Parameters**: None
- **Request Body**:
  ```json
  {
    "files": [
      {
        "from": "custom-documents/file.txt-fc4beeeb-e436-454d-8bb4-e5b8979cb48f.json",
        "to": "folder/file.txt-fc4beeeb-e436-454d-8bb4-e5b8979cb48f.json"
      }
    ]
  }
  ```
- **Responses**:
  - `200`: OK
    ```json
    {
      "success": true,
      "message": null
    }
    ```

---

## Workspace Management Endpoints

### 25. POST /v1/workspace/new
**Description**: Create a new workspace
- **Tags**: Workspaces
- **Parameters**: None
- **Request Body**:
  ```json
  {
    "name": "My New Workspace",
    "similarityThreshold": 0.7,
    "openAiTemp": 0.7,
    "openAiHistory": 20,
    "openAiPrompt": "Custom prompt for responses",
    "queryRefusalResponse": "Custom refusal message",
    "chatMode": "chat",
    "topN": 4
  }
  ```
- **Responses**:
  - `200`: OK
    ```json
    {
      "workspace": {
        "id": 79,
        "name": "Sample workspace",
        "slug": "sample-workspace",
        "createdAt": "2023-08-17 00:45:03",
        "openAiTemp": null,
        "lastUpdatedAt": "2023-08-17 00:45:03",
        "openAiHistory": 20,
        "openAiPrompt": null
      },
      "message": "Workspace created"
    }
    ```

### 26. GET /v1/workspaces
**Description**: List all current workspaces
- **Tags**: Workspaces
- **Parameters**: None
- **Responses**:
  - `200`: OK
    ```json
    {
      "workspaces": [
        {
          "id": 79,
          "name": "Sample workspace",
          "slug": "sample-workspace",
          "createdAt": "2023-08-17 00:45:03",
          "openAiTemp": null,
          "lastUpdatedAt": "2023-08-17 00:45:03",
          "openAiHistory": 20,
          "openAiPrompt": null,
          "threads": []
        }
      ]
    }
    ```

### 27. GET /v1/workspace/{slug}
**Description**: Get a workspace by its unique slug
- **Tags**: Workspaces
- **Parameters**:
  - `slug` (path, required): Unique slug of workspace to find
- **Responses**:
  - `200`: OK
    ```json
    {
      "workspace": [
        {
          "id": 79,
          "name": "My workspace",
          "slug": "my-workspace-123",
          "createdAt": "2023-08-17 00:45:03",
          "openAiTemp": null,
          "lastUpdatedAt": "2023-08-17 00:45:03",
          "openAiHistory": 20,
          "openAiPrompt": null,
          "documents": [],
          "threads": []
        }
      ]
    }
    ```

### 28. DELETE /v1/workspace/{slug}
**Description**: Deletes a workspace by its slug
- **Tags**: Workspaces
- **Parameters**:
  - `slug` (path, required): Unique slug of workspace to delete
- **Responses**:
  - `200`: OK
  - `400`: Bad Request

### 29. POST /v1/workspace/{slug}/update
**Description**: Update workspace settings by its unique slug
- **Tags**: Workspaces
- **Parameters**:
  - `slug` (path, required): Unique slug of workspace to find
- **Request Body**:
  ```json
  {
    "name": "Updated Workspace Name",
    "openAiTemp": 0.2,
    "openAiHistory": 20,
    "openAiPrompt": "Respond to all inquires and questions in binary - do not respond in any other format."
  }
  ```
- **Responses**:
  - `200`: OK
    ```json
    {
      "workspace": {
        "id": 79,
        "name": "My workspace",
        "slug": "my-workspace-123",
        "createdAt": "2023-08-17 00:45:03",
        "openAiTemp": null,
        "lastUpdatedAt": "2023-08-17 00:45:03",
        "openAiHistory": 20,
        "openAiPrompt": null,
        "documents": []
      },
      "message": null
    }
    ```

### 30. GET /v1/workspace/{slug}/chats
**Description**: Get a workspace's chats regardless of user by its unique slug
- **Tags**: Workspaces
- **Parameters**:
  - `slug` (path, required): Unique slug of workspace to find
  - `apiSessionId` (query, optional): Filter by session ID
  - `limit` (query, optional): Number of chat messages to return (default: 100)
  - `orderBy` (query, optional): Order of chat messages (asc or desc)
- **Responses**:
  - `200`: OK
    ```json
    {
      "history": [
        {
          "role": "user",
          "content": "What is AnythingLLM?",
          "sentAt": 1692851630
        },
        {
          "role": "assistant",
          "content": "AnythingLLM is a platform...",
          "sources": [
            {
              "source": "object about source document and snippets used"
            }
          ]
        }
      ]
    }
    ```

### 31. POST /v1/workspace/{slug}/update-embeddings
**Description**: Add or remove documents from a workspace by its unique slug
- **Tags**: Workspaces
- **Parameters**:
  - `slug` (path, required): Unique slug of workspace to find
- **Request Body**:
  ```json
  {
    "adds": ["custom-documents/my-pdf.pdf-hash.json"],
    "deletes": ["custom-documents/anythingllm.txt-hash.json"]
  }
  ```
- **Responses**:
  - `200`: OK

### 32. POST /v1/workspace/{slug}/update-pin
**Description**: Add or remove pin from a document in a workspace by its unique slug
- **Tags**: Workspaces
- **Parameters**:
  - `slug` (path, required): Unique slug of workspace to find
- **Request Body**:
  ```json
  {
    "docPath": "custom-documents/my-pdf.pdf-hash.json",
    "pinStatus": true
  }
  ```
- **Responses**:
  - `200`: OK
    ```json
    {
      "message": "Pin status updated successfully"
    }
    ```
  - `404`: Document not found

---

## Workspace Chat Endpoints

### 33. POST /v1/workspace/{slug}/chat
**Description**: Execute a chat with a workspace
- **Tags**: Workspaces
- **Parameters**:
  - `slug` (path, required): Unique slug of workspace
- **Request Body**:
  ```json
  {
    "message": "What is AnythingLLM?",
    "mode": "query | chat",
    "sessionId": "identifier-to-partition-chats-by-external-id",
    "attachments": [
      {
        "name": "image.png",
        "mime": "image/png",
        "contentString": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
      }
    ],
    "reset": false
  }
  ```
- **Responses**:
  - `200`: OK
    ```json
    {
      "id": "chat-uuid",
      "type": "abort | textResponse",
      "textResponse": "Response to your query",
      "sources": [
        {
          "title": "anythingllm.txt",
          "chunk": "This is a context chunk used in the answer of the prompt by the LLM,"
        }
      ],
      "close": true,
      "error": "null | text string of the failure mode."
    }
    ```

### 34. POST /v1/workspace/{slug}/stream-chat
**Description**: Execute a streamable chat with a workspace
- **Tags**: Workspaces
- **Parameters**:
  - `slug` (path, required): Unique slug of workspace
- **Request Body**: Same as /v1/workspace/{slug}/chat
- **Responses**:
  - `200`: OK (text/event-stream)
    ```json
    [
      {
        "id": "uuid-123",
        "type": "abort | textResponseChunk",
        "textResponse": "First chunk",
        "sources": [],
        "close": false,
        "error": "null | text string of the failure mode."
      }
    ]
    ```

### 35. POST /v1/workspace/{slug}/vector-search
**Description**: Perform a vector similarity search in a workspace
- **Tags**: Workspaces
- **Parameters**:
  - `slug` (path, required): Unique slug of workspace to search in
- **Request Body**:
  ```json
  {
    "query": "What is the meaning of life?",
    "topN": 4,
    "scoreThreshold": 0.75
  }
  ```
- **Responses**:
  - `200`: OK
    ```json
    {
      "results": [
        {
          "id": "5a6bee0a-306c-47fc-942b-8ab9bf3899c4",
          "text": "Document chunk content...",
          "metadata": {
            "url": "file://document.txt",
            "title": "document.txt",
            "author": "no author specified",
            "description": "no description found",
            "docSource": "post:123456",
            "chunkSource": "document.txt",
            "published": "12/1/2024, 11:39:39 AM",
            "wordCount": 8,
            "tokenCount": 9
          },
          "distance": 0.541887640953064,
          "score": 0.45811235904693604
        }
      ]
    }
    ```

---

## System Settings Endpoints

### 36. GET /v1/system/env-dump
**Description**: Dump all settings to file storage
- **Tags**: System Settings
- **Parameters**: None
- **Responses**:
  - `200`: OK

### 37. GET /v1/system
**Description**: Get all current system settings that are defined
- **Tags**: System Settings
- **Parameters**: None
- **Responses**:
  - `200`: OK
    ```json
    {
      "settings": {
        "VectorDB": "pinecone",
        "PineConeKey": true,
        "PineConeIndex": "my-pinecone-index",
        "LLMProvider": "azure",
        "[KEY_NAME]": "KEY_VALUE"
      }
    }
    ```

### 38. GET /v1/system/vector-count
**Description**: Number of all vectors in connected vector database
- **Tags**: System Settings
- **Parameters**: None
- **Responses**:
  - `200`: OK
    ```json
    {
      "vectorCount": 5450
    }
    ```

### 39. POST /v1/system/update-env
**Description**: Update a system setting or preference
- **Tags**: System Settings
- **Parameters**: None
- **Request Body**:
  ```json
  {
    "VectorDB": "lancedb",
    "AnotherKey": "updatedValue"
  }
  ```
- **Responses**:
  - `200`: OK
    ```json
    {
      "newValues": {
        "[ENV_KEY]": "Value"
      },
      "error": "error goes here, otherwise null"
    }
    ```

### 40. GET /v1/system/export-chats
**Description**: Export all of the chats from the system in a known format
- **Tags**: System Settings
- **Parameters**:
  - `type` (query, optional): Export format (jsonl, json, csv, jsonAlpaca)
- **Responses**:
  - `200`: OK
    ```json
    [
      {
        "role": "user",
        "content": "What is AnythinglLM?"
      },
      {
        "role": "assistant",
        "content": "AnythingLLM is a knowledge graph and vector database management system..."
      }
    ]
    ```

### 41. DELETE /v1/system/remove-documents
**Description**: Permanently remove documents from the system
- **Tags**: System Settings
- **Parameters**: None
- **Request Body**:
  ```json
  {
    "names": [
      "custom-documents/file.txt-fc4beeeb-e436-454d-8bb4-e5b8979cb48f.json"
    ]
  }
  ```
- **Responses**:
  - `200`: Documents removed successfully
    ```json
    {
      "success": true,
      "message": "Documents removed successfully"
    }
    ```

---

## Workspace Threads Endpoints

### 42. POST /v1/workspace/{slug}/thread/new
**Description**: Create a new workspace thread
- **Tags**: Workspace Threads
- **Parameters**:
  - `slug` (path, required): Unique slug of workspace
- **Request Body** (optional):
  ```json
  {
    "userId": 1,
    "name": "Name",
    "slug": "thread-slug"
  }
  ```
- **Responses**:
  - `200`: OK
    ```json
    {
      "thread": {
        "id": 1,
        "name": "Thread",
        "slug": "thread-uuid",
        "user_id": 1,
        "workspace_id": 1
      },
      "message": null
    }
    ```

### 43. POST /v1/workspace/{slug}/thread/{threadSlug}/update
**Description**: Update thread name by its unique slug
- **Tags**: Workspace Threads
- **Parameters**:
  - `slug` (path, required): Unique slug of workspace
  - `threadSlug` (path, required): Unique slug of thread
- **Request Body**:
  ```json
  {
    "name": "Updated Thread Name"
  }
  ```
- **Responses**:
  - `200`: OK
    ```json
    {
      "thread": {
        "id": 1,
        "name": "Updated Thread Name",
        "slug": "thread-uuid",
        "user_id": 1,
        "workspace_id": 1
      },
      "message": null
    }
    ```

### 44. DELETE /v1/workspace/{slug}/thread/{threadSlug}
**Description**: Delete a workspace thread
- **Tags**: Workspace Threads
- **Parameters**:
  - `slug` (path, required): Unique slug of workspace
  - `threadSlug` (path, required): Unique slug of thread
- **Responses**:
  - `200`: Thread deleted successfully

### 45. GET /v1/workspace/{slug}/thread/{threadSlug}/chats
**Description**: Get chats for a workspace thread
- **Tags**: Workspace Threads
- **Parameters**:
  - `slug` (path, required): Unique slug of workspace
  - `threadSlug` (path, required): Unique slug of thread
- **Responses**:
  - `200`: OK (same structure as workspace chats)

### 46. POST /v1/workspace/{slug}/thread/{threadSlug}/chat
**Description**: Chat with a workspace thread
- **Tags**: Workspace Threads
- **Parameters**:
  - `slug` (path, required): Unique slug of workspace
  - `threadSlug` (path, required): Unique slug of thread
- **Request Body**:
  ```json
  {
    "message": "What is AnythingLLM?",
    "mode": "query | chat",
    "userId": 1,
    "attachments": [
      {
        "name": "image.png",
        "mime": "image/png",
        "contentString": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
      }
    ],
    "reset": false
  }
  ```
- **Responses**:
  - `200`: OK (same structure as workspace chat)

### 47. POST /v1/workspace/{slug}/thread/{threadSlug}/stream-chat
**Description**: Stream chat with a workspace thread
- **Tags**: Workspace Threads
- **Parameters**:
  - `slug` (path, required): Unique slug of workspace
  - `threadSlug` (path, required): Unique slug of thread
- **Request Body**: Same as thread chat endpoint
- **Responses**:
  - `200`: OK (text/event-stream, same structure as workspace stream-chat)

---

## User Management Endpoints

### 48. GET /v1/users
**Description**: List all users (requires multi-user mode)
- **Tags**: User Management
- **Parameters**: None
- **Responses**:
  - `200`: OK
    ```json
    {
      "users": [
        {
          "id": 1,
          "username": "john_doe",
          "role": "admin"
        },
        {
          "id": 2,
          "username": "jane_smith",
          "role": "default"
        }
      ]
    }
    ```
  - `401`: Instance is not in Multi-User mode

### 49. GET /v1/users/{id}/issue-auth-token
**Description**: Issue a temporary auth token for a user (requires multi-user mode)
- **Tags**: User Management
- **Parameters**:
  - `id` (path, required): The ID of the user to issue a temporary auth token for
- **Responses**:
  - `200`: OK
    ```json
    {
      "token": "1234567890",
      "loginPath": "/sso/simple?token=1234567890"
    }
    ```
  - `404`: Not Found

---

## OpenAI Compatible Endpoints

### 50. GET /v1/openai/models
**Description**: Get all available "models" which are workspaces you can use for chatting
- **Tags**: OpenAI Compatible Endpoints
- **Parameters**: None
- **Responses**:
  - `200`: OK
    ```json
    {
      "object": "list",
      "data": [
        {
          "id": "model-id-0",
          "object": "model",
          "created": 1686935002,
          "owned_by": "organization-owner"
        }
      ]
    }
    ```

### 51. POST /v1/openai/chat/completions
**Description**: Execute a chat with a workspace with OpenAI compatibility (supports streaming)
- **Tags**: OpenAI Compatible Endpoints
- **Parameters**: None
- **Request Body**:
  ```json
  {
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant"
      },
      {
        "role": "user",
        "content": "What is AnythingLLM?"
      }
    ],
    "model": "sample-workspace",
    "stream": true,
    "temperature": 0.7
  }
  ```
- **Responses**:
  - `200`: OK
  - `400`: Bad Request
  - `401`: Unauthorized

### 52. POST /v1/openai/embeddings
**Description**: Get the embeddings of any arbitrary text string using the configured embedder
- **Tags**: OpenAI Compatible Endpoints
- **Parameters**: None
- **Request Body**:
  ```json
  {
    "input": [
      "This is my first string to embed",
      "This is my second string to embed"
    ],
    "model": null
  }
  ```
- **Responses**:
  - `200`: OK

### 53. GET /v1/openai/vector_stores
**Description**: List all the vector database collections connected to AnythingLLM (essentially workspaces)
- **Tags**: OpenAI Compatible Endpoints
- **Parameters**: None
- **Responses**:
  - `200`: OK
    ```json
    {
      "data": [
        {
          "id": "slug-here",
          "object": "vector_store",
          "name": "My workspace",
          "file_counts": {
            "total": 3
          },
          "provider": "LanceDB"
        }
      ]
    }
    ```

---

## Embed Management Endpoints

### 54. GET /v1/embed
**Description**: List all active embeds
- **Tags**: Embed
- **Parameters**: None
- **Responses**:
  - `200`: OK
    ```json
    {
      "embeds": [
        {
          "id": 1,
          "uuid": "embed-uuid-1",
          "enabled": true,
          "chat_mode": "query",
          "createdAt": "2023-04-01T12:00:00Z",
          "workspace": {
            "id": 1,
            "name": "Workspace 1"
          },
          "chat_count": 10
        }
      ]
    }
    ```

### 55. GET /v1/embed/{embedUuid}/chats
**Description**: Get all chats for a specific embed
- **Tags**: Embed
- **Parameters**:
  - `embedUuid` (path, required): UUID of the embed
- **Responses**:
  - `200`: OK
    ```json
    {
      "chats": [
        {
          "id": 1,
          "session_id": "session-uuid-1",
          "prompt": "Hello",
          "response": "Hi there!",
          "createdAt": "2023-04-01T12:00:00Z"
        }
      ]
    }
    ```
  - `404`: Embed not found

### 56. GET /v1/embed/{embedUuid}/chats/{sessionUuid}
**Description**: Get chats for a specific embed and session
- **Tags**: Embed
- **Parameters**:
  - `embedUuid` (path, required): UUID of the embed
  - `sessionUuid` (path, required): UUID of the session
- **Responses**:
  - `200`: OK (same structure as embed chats)
  - `404`: Embed or session not found

### 57. POST /v1/embed/new
**Description**: Create a new embed configuration
- **Tags**: Embed
- **Parameters**: None
- **Request Body**:
  ```json
  {
    "workspace_slug": "workspace-slug-1",
    "chat_mode": "chat",
    "allowlist_domains": ["example.com"],
    "allow_model_override": false,
    "allow_temperature_override": false,
    "allow_prompt_override": false,
    "max_chats_per_day": 100,
    "max_chats_per_session": 10
  }
  ```
- **Responses**:
  - `200`: OK
    ```json
    {
      "embed": {
        "id": 1,
        "uuid": "embed-uuid-1",
        "enabled": true,
        "chat_mode": "chat",
        "allowlist_domains": ["example.com"],
        "allow_model_override": false,
        "allow_temperature_override": false,
        "allow_prompt_override": false,
        "max_chats_per_day": 100,
        "max_chats_per_session": 10,
        "createdAt": "2023-04-01T12:00:00Z",
        "workspace_slug": "workspace-slug-1"
      },
      "error": null
    }
    ```
  - `404`: Workspace not found

### 58. POST /v1/embed/{embedUuid}
**Description**: Update an existing embed configuration
- **Tags**: Embed
- **Parameters**:
  - `embedUuid` (path, required): UUID of the embed to update
- **Request Body**:
  ```json
  {
    "enabled": true,
    "chat_mode": "chat",
    "allowlist_domains": ["example.com"],
    "allow_model_override": false,
    "allow_temperature_override": false,
    "allow_prompt_override": false,
    "max_chats_per_day": 100,
    "max_chats_per_session": 10
  }
  ```
- **Responses**:
  - `200`: OK
    ```json
    {
      "success": true,
      "error": null
    }
    ```
  - `404`: Embed not found

### 59. DELETE /v1/embed/{embedUuid}
**Description**: Delete an existing embed configuration
- **Tags**: Embed
- **Parameters**:
  - `embedUuid` (path, required): UUID of the embed to delete
- **Responses**:
  - `200`: OK
    ```json
    {
      "success": true,
      "error": null
    }
    ```
  - `404`: Embed not found

---

## Error Responses

All endpoints can return these common error responses:
- `403`: Forbidden - Invalid API Key
- `500`: Internal Server Error

### Error Schema
```json
{
  "message": "Invalid API Key"
}
```

---

## Authentication

All endpoints (except health checks) require Bearer token authentication:

**Header**: `Authorization: Bearer YOUR_API_TOKEN`

**Schema**: 
- Type: http
- Scheme: bearer
- Bearer Format: JWT

---

## File Upload Support

Supported file types include:
- `.mbox` (application/mbox)
- `.pdf` (application/pdf)
- `.odt` (application/vnd.oasis.opendocument.text)
- `.docx` (application/vnd.openxmlformats-officedocument.wordprocessingml.document)
- `.txt`, `.md` (text/plain)

---

*Generated from AnythingLLM API Documentation at https://ahmad-anything-llm.840tjq.easypanel.host/api/docs*
