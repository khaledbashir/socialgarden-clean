<file_path>
the11-dev/PROJECT-OVERVIEW-UPDATED.md
</file_path>

<edit_description>
Create a new comprehensive project overview markdown file
</edit_description>

# 🌱 Social Garden SOW Generator - Comprehensive Project Overview

## Project Summary

The Social Garden SOW Generator is a production-ready web application designed to streamline the creation, management, and delivery of Statements of Work (SOWs) for professional services. Built with modern web technologies, it combines AI-powered content generation, interactive pricing tools, and professional document export capabilities to enhance efficiency in proposal development and client engagement.

## Core Architecture

### Technology Stack
- **Frontend**: Next.js 15.1.4 with App Router, React 18, TypeScript
- **Backend**: FastAPI (Python) for PDF generation service
- **Database**: MySQL 8.0 with full schema for documents, agents, and analytics
- **AI Integration**: AnythingLLM for contextual chat, OpenAI/OpenRouter for content generation
- **Styling**: Tailwind CSS with Radix UI components
- **Editor**: TipTap/ProseMirror for rich text editing
- **PDF Generation**: WeasyPrint with Jinja2 templates
- **Deployment**: Docker Compose for containerized production deployment

### Project Structure
```
/root/the11-dev/
├── frontend/                 # Next.js application (main UI)
│   ├── app/                  # App Router pages and API routes
│   ├── components/           # Reusable React components
│   ├── context/              # React context providers
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions and configurations
│   ├── public/               # Static assets and branding
│   └── styles/               # Global styles and themes
├── backend/                  # FastAPI PDF service
│   ├── services/             # Business logic modules
│   ├── templates/            # PDF template files
│   └── main.py               # API server entry point
├── database/                 # Database schemas and migrations
│   ├── migrations/           # SQL migration files
│   └── schema.sql            # Complete database schema
├── lib/                      # Shared TypeScript utilities
├── scripts/                  # Automation and maintenance scripts
├── tests/                    # Test suites and fixtures
├── docs/                     # Documentation and archives
└── track/                    # Simple tracking web interface
```

## Key Features

### 1. Rich Text Document Editor
- TipTap-based WYSIWYG editor with full formatting capabilities
- Real-time collaboration support
- Template system for consistent SOW structure
- Inline AI assistance for content suggestions

### 2. Interactive Pricing Tables
- Pre-loaded with 82 professional service roles
- Drag-and-drop reordering of line items
- Dynamic calculation of totals and subtotals
- Excel export functionality for client review
- Smart discount application system

### 3. AI-Powered Content Generation
- "The Architect" agent for complete SOW creation
- Context-aware content suggestions
- Integration with AnythingLLM for document-specific chat
- Prompt engineering for industry-specific templates

### 4. Professional PDF Export
- WeasyPrint-powered PDF generation
- Social Garden branded templates
- High-quality typography and layout
- Automatic table formatting and pagination

### 5. Client Portal and Collaboration
- Secure sharing links for client review
- Activity tracking and engagement analytics
- Comment system for feedback collection
- Digital signature collection for approvals

### 6. Intelligent Tagging and Analytics
- Automatic categorization by vertical (Property, Education, Finance, etc.)
- Service line tagging (CRM, Marketing Automation, etc.)
- BI dashboard for performance analytics
- Historical data backfilling capabilities

### 7. Database Persistence
- MySQL database with comprehensive schema
- Support for folders, documents, agents, and conversations
- Audit trails for all SOW activities
- User preferences and customization storage

## Development Environment

### Quick Start
```bash
./dev.sh
```
This single command initializes:
- Frontend development server on port 3333
- Backend PDF service on port 8000
- Hot reload for both services
- Database connectivity

### Environment Configuration
Required environment variables include:
- Database connection details (MySQL)
- AnythingLLM API credentials
- OpenAI/OpenRouter API keys
- Application URLs and ports

### Development Workflow
- Frontend: `pnpm dev` in `/frontend` directory
- Backend: `uvicorn main:app --reload` in `/backend` directory
- Database: Direct MySQL connection with provided credentials
- Testing: Integrated test suites in `/tests` directory

## Production Deployment

### Docker Compose Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```
Supports:
- Multi-container orchestration
- Environment-specific configurations
- Automatic scaling and load balancing
- SSL termination and security hardening

### Manual Deployment Options
- Frontend: Static export or server-side rendering
- Backend: Gunicorn for production WSGI serving
- Database: Managed MySQL instance
- Reverse proxy: Nginx configuration included

## Database Schema Overview

The application uses a normalized MySQL schema with the following key tables:

- `folders`: Hierarchical organization
- `documents`: Full SOW content storage
- `sows`: Client-facing metadata
- `agents`: AI agent configurations
- `ai_conversations`: Chat history
- `chat_messages`: Individual message storage
- `sow_activities`: Client interaction tracking
- `sow_comments`: Feedback collection
- `sow_acceptances`: Digital signature records
- `user_preferences`: Customization settings

## Integration Points

### AnythingLLM
- Workspace-based document context
- AI chat interface within the application
- Vector embeddings for semantic search
- Custom agent configurations

### External APIs
- OpenAI/OpenRouter for content generation
- Email services for notifications
- File storage for exports
- Analytics platforms for usage tracking

## Security Considerations

- Environment variable management for secrets
- Database connection encryption
- API key rotation and access controls
- Client data isolation and privacy
- Secure sharing link generation
- Audit logging for compliance

## Performance Optimizations

- Next.js App Router for efficient routing
- Database query optimization and indexing
- Caching strategies for frequently accessed data
- Lazy loading for large documents
- Background processing for PDF generation

## Maintenance and Operations

### Monitoring
- Application logs aggregation
- Database performance monitoring
- API endpoint health checks
- Error tracking and alerting

### Backup Strategy
- Automated database backups
- Document versioning
- Configuration snapshots
- Disaster recovery procedures

### Update Process
- Rolling deployments with zero downtime
- Database migration management
- Feature flag system for gradual rollouts
- Rollback procedures for quick recovery

## Future Roadmap

### Planned Enhancements
- Advanced analytics dashboard
- Mobile application companion
- Integration with project management tools
- Enhanced AI capabilities with custom models
- Multi-language support for international clients

### Technical Debt
- Legacy component refactoring
- Test coverage expansion
- Performance benchmarking
- Documentation standardization

## Contributing Guidelines

### Code Standards
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Python type hints for backend
- Comprehensive test coverage

### Git Workflow
- Feature branch development
- Pull request reviews
- Automated CI/CD pipelines
- Semantic versioning for releases

## Support and Documentation

### Key Resources
- API documentation in `/docs` directory
- Troubleshooting guides for common issues
- Database schema documentation
- Deployment playbooks

### Contact Information
- Development team for technical support
- Product team for feature requests
- Operations team for infrastructure issues

---

**Last Updated:** October 2025  
**Version:** 2.0.0  
**Status:** Production Ready with Active Development