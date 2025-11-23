# VPS Setup Instructions

## Quick Setup on Your VPS

1. **Clone the repository:**
```bash
git clone https://github.com/khaledbashir/the11.git
cd the11
```

2. **Start with Docker (default port 3000):**
```bash
docker-compose up --build
```

That's it! The app will be available at `http://your-vps-ip:3000`

---

## Using a Custom Port (e.g., 3333)

If port 3000 is already in use on your VPS:

**Option 1: Using environment variable**
```bash
git clone https://github.com/khaledbashir/the11.git
cd the11
FRONTEND_PORT=3333 docker-compose up --build
```

**Option 2: Using .env file**
```bash
git clone https://github.com/khaledbashir/the11.git
cd the11
echo "FRONTEND_PORT=3333" > .env
docker-compose up --build
```

The app will be available at `http://your-vps-ip:3333`

---

## Use the Setup Script for Port Checking

The setup script will check if port 3000 is available and guide you:

```bash
git clone https://github.com/khaledbashir/the11.git
cd the11
./setup.sh
```

---

## Troubleshooting

**If you get "port already in use" errors:**
```bash
# Use a different port
FRONTEND_PORT=3333 docker-compose up --build
```

**To stop the services:**
```bash
docker-compose down
```

**To restart after changes:**
```bash
docker-compose up --build
```

**To run in background (detached mode):**
```bash
docker-compose up -d --build
```

**To view logs:**
```bash
docker-compose logs -f
```
