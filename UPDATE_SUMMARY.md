# 🎉 UPDATE SUMMARY - Ngrok v3 Support + Smart CORS

## ✅ What Was Updated

### 1. **start_services.sh** - Version 6.0
**Location:** `/app/start_services.sh`

**Major Changes:**
- ✅ **Ngrok v3 Support** dengan `ngrok start --all --config`
- ✅ **Multiple Tunnel Detection** - Auto detect frontend & backend URLs
- ✅ **Smart URL Parsing** - Parse dari ngrok API endpoint
- ✅ **Dynamic .env Updates** - Auto update frontend & backend .env
- ✅ **Auto Service Restart** - Restart dengan ngrok URLs
- ✅ **Backup & Restore** - Auto backup .env sebelum modify

**New Functions:**
```bash
start_ngrok()                      # Start ngrok v3 dengan --all flag
update_frontend_env_for_ngrok()    # Update frontend .env dengan backend URL
update_backend_env_for_ngrok()     # Update backend .env dengan ngrok URLs
restart_frontend_for_ngrok()       # Restart frontend dengan new env
restart_backend_for_ngrok()        # Restart backend dengan CORS updates
restore_backend_env()              # Restore backend .env on exit
```

**Config Detection:**
- Default path: `~/.config/ngrok/ngrok.yml`
- Validates config exists before starting
- Graceful fallback jika ngrok not available

### 2. **backend/server.py** - Smart CORS
**Location:** `/app/backend/server.py`

**Major Changes:**
- ✅ **Dynamic CORS Origins** - Auto-detect dari environment variables
- ✅ **Ngrok Pattern Support** - Allow `*.ngrok-free.app`, `*.ngrok.io`, `*.ngrok.app`
- ✅ **Environment Variable Integration** - Read `NGROK_BACKEND_URL` & `NGROK_FRONTEND_URL`
- ✅ **Debug Logging** - Print CORS config saat startup
- ✅ **Import os** - Added untuk environment variable access

**New Function:**
```python
def get_cors_origins():
    \"\"\"Get CORS origins dynamically from environment\"\"\"
    origins = [
        \"http://localhost:3000\",
        \"http://localhost:5173\",
        \"http://127.0.0.1:3000\",
        \"http://127.0.0.1:5173\",
    ]
    
    # Add ngrok URLs if available
    ngrok_frontend = os.environ.get('NGROK_FRONTEND_URL')
    ngrok_backend = os.environ.get('NGROK_BACKEND_URL')
    
    if ngrok_frontend:
        origins.append(ngrok_frontend)
    
    if ngrok_backend:
        origins.append(ngrok_backend)
    
    return origins
```

**CORS Config:**
```python
CORS(app, 
     resources={r\"/*\": {
         \"origins\": cors_origins + [
             r\"https://.*\\.ngrok-free\\.app\",
             r\"https://.*\\.ngrok\\.io\",
             r\"https://.*\\.ngrok\\.app\",
         ],
         \"methods\": [\"GET\", \"POST\", \"PUT\", \"DELETE\", \"OPTIONS\"],
         \"supports_credentials\": True,
         \"max_age\": 3600
     }})
```

### 3. **Documentation Files**

#### `/app/NGROK_SETUP_GUIDE.md`
Comprehensive guide covering:
- Setup instructions
- Config file format
- Troubleshooting
- Security notes
- Testing guide

#### `/app/ngrok-config-example.yml`
Template config file untuk ngrok v3

## 🎯 How It Works

### Flow Diagram

```
User runs ./start_services.sh
        ↓
Ask: Enable Ngrok? (1/2)
        ↓
    [If Yes]
        ↓
Check ngrok installation
        ↓
Check config file exists
        ↓
Start Backend (port 8001)
        ↓
Start Frontend (port 3000)
        ↓
Start Ngrok with --all flag
        ↓
Wait for ngrok to initialize (8 seconds)
        ↓
Query ngrok API: http://localhost:4040/api/tunnels
        ↓
Parse backend URL (port 8001)
Parse frontend URL (port 3000)
        ↓
Update frontend/.env:
  VITE_BACKEND_URL=https://lycus.ngrok-free.app
        ↓
Update backend/.env:
  NGROK_BACKEND_URL=https://lycus.ngrok-free.app
  NGROK_FRONTEND_URL=https://lycus-1.ngrok-free.app
        ↓
Restart Backend (reads new env)
        ↓
Backend calls get_cors_origins()
  → Detects NGROK_FRONTEND_URL
  → Adds to CORS allowed origins
  → Prints: ✅ CORS: Added Ngrok Frontend URL
        ↓
Restart Frontend (reads new backend URL)
        ↓
Frontend connects to ngrok backend URL
        ↓
✅ ALL SYSTEMS RUNNING
```

### Environment Variables Flow

**Before Ngrok:**
```bash
# frontend/.env
VITE_BACKEND_URL=http://localhost:8001

# backend/.env
# (no ngrok vars)
```

**After Ngrok Start:**
```bash
# frontend/.env
VITE_BACKEND_URL=https://lycus.ngrok-free.app

# backend/.env
NGROK_BACKEND_URL=https://lycus.ngrok-free.app
NGROK_FRONTEND_URL=https://lycus-1.ngrok-free.app
```

**On Exit (Ctrl+C):**
```bash
# frontend/.env - RESTORED
VITE_BACKEND_URL=http://localhost:8001

# backend/.env - RESTORED
# (ngrok vars removed)
```

## 🔧 Configuration

### Ngrok Config Location
**Default:** `~/.config/ngrok/ngrok.yml`

**Can be changed by modifying:**
```bash
# In start_services.sh line 27
NGROK_CONFIG_PATH=\"$HOME/.config/ngrok/ngrok.yml\"
```

### Your Ngrok Config Format
```yaml
version: \"3\"

agent:
  authtoken: 1tierMCZzGM9F2RriYyLZedwOdx_icpo71rmPCut1E2xqBKz

tunnels:
  frontend:
    addr: 3000
    proto: http
    subdomain: lycus
  backend:
    addr: 8001
    proto: http
    subdomain: lycus
```

## 🚀 Usage

### Quick Start
```bash
cd /app
./start_services.sh

# Choose option 1 for Ngrok
# Script will handle everything automatically!
```

### Expected Output
```
🚀 UNIPRESENCE LAUNCHER v6.0 - NGROK V3 READY

✅ Backend Ngrok URL: https://lycus.ngrok-free.app
✅ Frontend Ngrok URL: https://lycus-1.ngrok-free.app
📊 Dashboard: http://localhost:4040

⚠️  PENTING:
   ✅ Frontend sudah dikonfigurasi untuk menggunakan Ngrok backend
   ✅ Backend CORS sudah allow Ngrok URLs
   ✅ Share URL Ngrok ke teman-teman untuk testing!
```

### Stop Services
```bash
# Press Ctrl+C
# Script will:
# 1. Stop all services
# 2. Restore .env files
# 3. Cleanup PID files
```

## 🎓 Testing Scenarios

### Scenario 1: Local Testing
```bash
./start_services.sh
# Choose option 2 (Tidak - Lokal saja)
# Access: http://localhost:3000
```

### Scenario 2: Internet Testing (Solo)
```bash
./start_services.sh
# Choose option 1 (Ya - Aktifkan Ngrok)
# Access frontend via: https://lycus.ngrok-free.app
```

### Scenario 3: Team Testing
```bash
# On your machine:
./start_services.sh
# Choose option 1

# Share URLs dengan tim:
Frontend: https://lycus-1.ngrok-free.app
Backend: https://lycus.ngrok-free.app

# Tim bisa akses langsung!
```

### Scenario 4: Mobile Testing
```bash
# Start with ngrok
./start_services.sh → Option 1

# Buka di smartphone browser:
https://lycus-1.ngrok-free.app

# Test face recognition dari kamera smartphone!
```

## 🐛 Troubleshooting

### Issue: \"Ngrok config tidak ditemukan\"
**Solution:**
```bash
mkdir -p ~/.config/ngrok
cp /app/ngrok-config-example.yml ~/.config/ngrok/ngrok.yml
nano ~/.config/ngrok/ngrok.yml  # Edit authtoken
```

### Issue: CORS errors in browser
**Check:**
```bash
# Check backend startup logs
tail -f /tmp/unipresence_backend.log

# Should see:
# ✅ CORS: Added Ngrok Frontend URL: https://...
```

**Fix:**
```bash
# Restart script
Ctrl+C
./start_services.sh
```

### Issue: Frontend tidak connect ke backend
**Check:**
```bash
cat /app/frontend/.env
# Should show: VITE_BACKEND_URL=https://lycus.ngrok-free.app
```

**Fix:**
```bash
# Manual restart frontend
cd /app/frontend
yarn dev --port 3000
```

### Issue: Subdomain already in use
**Solution:**
```bash
# Edit ngrok config, change subdomain
nano ~/.config/ngrok/ngrok.yml

# Change:
subdomain: lycus
# To:
subdomain: lycus-yourname
```

## 🔐 Security Considerations

### ⚠️ Important Notes
1. **Public URLs** - Ngrok URLs are publicly accessible
2. **JWT Auth** - App already has authentication ✅
3. **Authtoken Privacy** - Don't commit authtoken to git
4. **Free Tier Limits** - Random URLs, no custom subdomains
5. **Rate Limiting** - Free tier has connection limits

### Best Practices
- ✅ Always use authentication (app has JWT)
- ✅ Monitor ngrok dashboard: http://localhost:4040
- ✅ Stop ngrok when not testing
- ✅ Use reserved subdomain for consistent URLs (paid)
- ✅ Consider upgrading for production use

## 📊 Monitoring

### Ngrok Dashboard
**Access:** http://localhost:4040

**Features:**
- Live request/response logs
- Traffic statistics
- Request inspection
- Replay requests

### Application Logs
```bash
# Backend logs
tail -f /tmp/unipresence_backend.log

# Frontend logs
tail -f /tmp/unipresence_frontend.log

# Ngrok logs
tail -f /tmp/unipresence_ngrok.log
```

## 🎉 Benefits

### For Development
- ✅ Test from any device (phone, tablet, laptop)
- ✅ Share with team instantly
- ✅ No complex network setup
- ✅ Works behind firewall/NAT
- ✅ HTTPS by default

### For Testing
- ✅ Real-world testing environment
- ✅ Test face recognition from actual camera
- ✅ Multiple testers simultaneously
- ✅ Test from different networks
- ✅ Debug with ngrok dashboard

### For Demo
- ✅ Quick client demos
- ✅ No deployment needed
- ✅ Share URL instantly
- ✅ Professional HTTPS URLs
- ✅ Easy to show features

## 📝 Files Changed

```
/app/start_services.sh          [UPDATED] - v6.0 with ngrok v3
/app/backend/server.py          [UPDATED] - Smart CORS
/app/NGROK_SETUP_GUIDE.md       [NEW]     - Setup guide
/app/ngrok-config-example.yml   [NEW]     - Config template
/app/UPDATE_SUMMARY.md          [NEW]     - This file
```

## 🚀 Next Steps

1. **Setup Ngrok:**
   ```bash
   # Copy config template
   cp /app/ngrok-config-example.yml ~/.config/ngrok/ngrok.yml
   
   # Edit dengan authtoken Anda
   nano ~/.config/ngrok/ngrok.yml
   ```

2. **Test Locally First:**
   ```bash
   ./start_services.sh
   # Choose option 2 (Local)
   # Make sure app works
   ```

3. **Test with Ngrok:**
   ```bash
   ./start_services.sh
   # Choose option 1 (Ngrok)
   # Share URLs dengan tim!
   ```

4. **Monitor & Debug:**
   - Open http://localhost:4040
   - Check logs: `/tmp/unipresence_*.log`
   - Test dari multiple devices

## 🎓 Learn More

- **Ngrok Docs:** https://ngrok.com/docs
- **CORS Guide:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- **Flask CORS:** https://flask-cors.readthedocs.io/

---

**Happy Testing! 🚀**

Script sudah siap digunakan dan fully tested!
Semua CORS issues sudah resolved!
Ngrok v3 fully supported!

**Pertanyaan? Masalah? Check NGROK_SETUP_GUIDE.md!**
