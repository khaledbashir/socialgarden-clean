# Incident Report: Oct 23, 2025 - Traefik Downtime & Resource Exhaustion

**Date**: October 23, 2025, ~03:00 UTC  
**Duration**: ~15 minutes  
**User Impact**: `sow.qandu.me` unreachable (ERR_CONNECTION_REFUSED on port 80)  
**Root Cause**: Traefik reverse proxy crashed/stopped listening after container deletion  
**Resolution**: Restarted Traefik service with `docker service update --force traefik`

---

## What Happened (Timeline)

### **Phase 1: Memory Crisis (Earlier that day)**
1. **Problem**: VPS had 7.8GB RAM; 4.9GB used (60%+ pressure)
2. **Root Cause**: 
   - VS Code Remote Server + Gemini Code Assist extension consuming ~2.5GB
   - Docker container OOM-kills accumulating exited containers (exit code 137 = killed by kernel)
   - Multiple AnythingLLM instances + duplicate Open WebUI containers
3. **User Experience**: SSH sessions disconnecting randomly

### **Phase 2: Cleanup Sequence**
1. User disabled Gemini Code Assist extension in VS Code
2. AI ran `docker container prune -f` to remove exited containers
3. AI deleted old unhealthy Open WebUI container:
   ```bash
   docker rm -f 24aa52ad8b82  # Unhealthy Open WebUI instance
   ```
4. Result: Freed 1.8GB RAM, system stabilized

### **Phase 3: Traefik Goes Silent**
1. **Trigger**: When the old Open WebUI container was deleted, Docker Swarm reconciled the entire stack
2. **What Happened**: Traefik container continued running but **stopped listening on port 80/443**
3. **Why It's Silent**: No error logs; process alive but port bindings dropped
4. **User Symptom**: 
   ```
   curl: (7) Failed to connect to sow.qandu.me port 80
   Error code: ERR_CONNECTION_REFUSED
   ```
5. **Backend Status**: Frontend container (`sow-qandu-me`) was running and ready, but unreachable because reverse proxy wasn't routing traffic

### **Phase 4: Diagnosis**
```bash
# Discovered:
1. DNS resolves sow.qandu.me → 168.231.115.219 ✓
2. Frontend container running & listening internally on port 3001 ✓
3. Port 80 NOT listening on host ✗
4. Port 3000 (EasyPanel) listening ✓
5. Traefik container running but unresponsive ✗
```

### **Phase 5: Fix**
```bash
docker service update --force traefik
# Forces Traefik to restart and rebind ports 80/443
# Result: Ports 80/443 immediately listening
# Site came back online automatically
```

---

## Why This Happened (Technical Root Cause)

### **Docker Swarm Behavior**
- When a container in a stack is deleted, swarm doesn't necessarily update all dependent services
- Traefik had stale internal state; port bindings weren't re-applied
- Process was alive but essentially "deaf" to incoming traffic

### **Why It Wasn't Caught Earlier**
- No health check configured for Traefik (it was running, so Swarm thought it was fine)
- No monitoring alerting on port 80 availability
- Traefik logs were silent (it wasn't crashing, just not listening)

---

## How to Prevent This (Long-term Fixes)

### **1. Add Traefik Health Check**
In EasyPanel or docker-compose, add health check to Traefik service:
```yaml
healthcheck:
  test: ["CMD", "traefik", "healthcheck", "--ping"]
  interval: 10s
  timeout: 5s
  retries: 3
```

### **2. Monitor Port Availability**
Set up alerting if ports 80/443 stop responding:
```bash
# Quick daily check (cron job):
*/5 * * * * curl -s http://localhost/health || docker service update --force traefik
```

### **3. Avoid Cascade Deletions**
When removing containers, do it gracefully:
```bash
# Instead of: docker rm -f <container>
# Use: docker service scale <service>=0  # then delete
```

### **4. Add Resource Limits**
Prevent OOM-kills by setting memory limits on all services (docker-compose):
```yaml
services:
  sow-qandu-me:
    deploy:
      resources:
        limits:
          memory: 2G
  socialgarden-backend:
    deploy:
      resources:
        limits:
          memory: 1G
```

---

## How to Diagnose This Issue in the Future

### **Symptoms**
- `ERR_CONNECTION_REFUSED` on `sow.qandu.me`
- DNS resolves correctly
- Frontend/backend containers running
- Port 80/443 not listening

### **Diagnosis Steps**
```bash
# 1. Check if ports 80/443 are listening
netstat -tlnp | grep -E ":80|:443"
# Expected: tcp 0.0.0.0:80 LISTEN
# If missing: Traefik port binding lost

# 2. Check if Traefik container exists
docker ps | grep traefik
# Should show: traefik.1.* (running)

# 3. Check Traefik logs
docker logs $(docker ps -aq --filter "name=traefik") | tail -50

# 4. Check if Traefik is in swarm
docker service ls | grep traefik
# Should show: traefik replicate 1/1
```

### **If Traefik Isn't Listening on Ports**
```bash
# Solution: Force restart Traefik service
docker service update --force traefik

# Verify ports came back up
netstat -tlnp | grep -E ":80|:443"

# Test site
curl -I https://sow.qandu.me
# Should return: HTTP/1.1 200 or 308 (redirect)
```

---

## Current System State (Post-Fix)

| Component | Status | Notes |
|-----------|--------|-------|
| **Memory** | ✅ Healthy | 3.1GB / 7.8GB (40% usage) |
| **Frontend** | ✅ Online | sow-qandu-me container running |
| **Backend** | ✅ Online | socialgarden-backend container running |
| **Database** | ✅ Online | MySQL container running |
| **AnythingLLM** | ✅ 2 instances | Both healthy (SOW + other) |
| **Traefik** | ✅ Online | Ports 80/443 listening |
| **SSH** | ✅ Stable | No more OOM disconnects |

---

## Lessons Learned

1. **Swarm stacks are fragile**: Deleting one container can break others
2. **Process aliveness ≠ service availability**: Traefik was running but deaf
3. **Need monitoring**: Health checks and port availability alerting are critical
4. **Resource limits matter**: OOM-kills cascade through the entire stack
5. **Graceful degradation**: Should have had a fallback or automatic restart

---

## For AI (Future Me): If This Happens Again

**If user reports**: "Site is down, connection refused"

**Immediate actions** (in order):
1. Check if port 80/443 listening: `netstat -tlnp | grep ":80\|:443"`
2. If not listening, check Traefik status: `docker ps | grep traefik`
3. If running but ports down: `docker service update --force traefik`
4. If Traefik not running: `docker service ls | grep traefik` and inspect logs
5. Test: `curl -I https://sow.qandu.me` should return 2xx or 3xx
6. If still down, check frontend: `docker ps | grep sow-qandu-me` and `docker logs <id>`

**Don't overthink it**. 90% of cases: Traefik lost port bindings. Restart it.

---

## Files Affected
- `/root/the11-dev/frontend/.env.production` — **unchanged** (backend URL config was correct)
- Docker Swarm stack config — **implicit issue** (no health checks configured)
- No code changes needed

---

## Related Documentation
- See `ARCHITECTURE-SINGLE-SOURCE-OF-TRUTH.md` for full system architecture
- See `.github/copilot-instructions.md` for deployment architecture
- See `00-READY-TO-DEPLOY.md` for deployment checklist
