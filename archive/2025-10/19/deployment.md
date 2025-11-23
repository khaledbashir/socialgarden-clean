# 🚀 Social Garden SOW Generator - Production Deployment

This is the **production-ready** branch. Clone this anywhere and it will run!

## ⚡ Quick Start (5 minutes)

### Prerequisites
- Docker and Docker Compose installed
- OpenRouter API key (get free at https://openrouter.ai/keys)

### Setup Steps

1. **Clone the repository:**
```bash
git clone https://github.com/khaledbashir/the11.git
cd the11
git checkout production-ready
```

2. **Configure environment:**
```bash
cp .env.example .env
nano .env  # Add your OpenRouter API key
```

3. **Start everything:**
```bash
docker-compose up -d
```

4. **Access the app:**
- Frontend: http://localhost:3333
- PDF Service: http://localhost:8000

That's it! ✨

## 🎨 Features

- **Novel Editor** with slash commands (/table, /divider, /heading, /list, /code, /image, /quote)
- **AI Writing Assistant** - improve, shorten, lengthen, simplify, fix spelling
- **PDF Export** with beautiful Social Garden branding
- **Dark Mode** - Pitch black with brand color accents
- **Auto-save** to localStorage
- **Image uploads**
- **Table creation** and formatting

## 🔧 Configuration

### Port Changes
If port 3333 is in use, edit `docker-compose.yml`:
```yaml
services:
  frontend:
    ports:
      - "YOUR_PORT:3000"  # Change YOUR_PORT to desired port
```

Or edit `.env`:
```
FRONTEND_PORT=YOUR_PORT
```

### Environment Variables

- `OPENROUTER_API_KEY` - Your OpenRouter API key (required for AI features)
- `FRONTEND_PORT` - Port for frontend (default: 3333)

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after changes
docker-compose build
docker-compose up -d

# Check status
docker-compose ps
```

## 📁 Project Structure

```
the11/
├── docker-compose.yml          # Orchestrates frontend + PDF service
├── .env.example               # Template for environment variables
├── novel-editor-demo/         # Next.js frontend
│   ├── apps/web/              # Main web app
│   ├── Dockerfile             # Frontend container
│   └── package.json           # Dependencies
└── pdf-service/               # Python PDF generation
    ├── Dockerfile             # PDF service container
    ├── requirements.txt       # Python dependencies
    └── main.py               # FastAPI server
```

## 🎨 Social Garden Branding

The app uses Social Garden's brand colors and logo:
- **Dark:** #0e2e33 (accents only)
- **Green:** #20e28f (accents only)
- **Dark Mode:** Pitch black backgrounds
- **Font:** Jakarta Sans
- **Logo:** 366x44 horizontal format

## 🔒 Security Notes

- Never commit `.env` file - it's in `.gitignore`
- Keep your OpenRouter API key private
- Use environment variables for all secrets

## 🐛 Troubleshooting

### Port already in use
```bash
# Change port in docker-compose.yml or .env
FRONTEND_PORT=3334
```

### Containers won't start
```bash
# Check logs
docker-compose logs

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

### API key not working
```bash
# Verify .env file exists and has correct key
cat .env

# Restart containers
docker-compose restart
```

## 📝 Development

To modify the app:

1. Edit files locally
2. Rebuild containers: `docker-compose build`
3. Restart: `docker-compose up -d`

Key files:
- Frontend code: `novel-editor-demo/apps/web/`
- Styling: `novel-editor-demo/apps/web/styles/globals.css`
- PDF service: `pdf-service/main.py`

## 🚀 Production Deployment

For VPS deployment:

1. SSH into your server
2. Follow Quick Start steps above
3. Optionally set up nginx reverse proxy
4. Optionally add SSL with Let's Encrypt

## 📞 Support

Issues? Check:
- Docker is running: `docker --version`
- Ports are available: `netstat -tulpn | grep 3333`
- Logs: `docker-compose logs -f`

---

Made with ❤️ for Social Garden
