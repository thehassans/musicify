# Plesk Deployment Guide for Musicify

This guide will walk you through deploying the Musicify application on Plesk with the domain `hassanscode.com`.

## Prerequisites

- Plesk control panel access
- Domain: `hassanscode.com` with DNS configured
- Node.js 18+ support on Plesk
- Python 3.11+ support on Plesk
- SSH access (optional but recommended)

## Architecture Overview

The application consists of three components:
1. **Frontend** (React + Vite) - Main user interface
2. **Backend** (Node.js + Express) - API server  
3. **Python Analyzer** (FastAPI) - ML/audio analysis service

## Recommended Domain Structure

- **Frontend**: `musicify.hassanscode.com` or `hassanscode.com`
- **Backend**: `api.musicify.hassanscode.com`
- Python service runs internally on localhost:8001

---

## Step 1: Prepare Your Plesk Environment

### 1.1 Create Subdomain for Frontend

1. Log in to your Plesk control panel
2. Go to **Websites & Domains**
3. Click **Add New Subdomain**
4. Enter subdomain name: `musicify` (full domain: `musicify.hassanscode.com`)
5. Click **OK**

### 1.2 Create Subdomain for Backend API

1. Click **Add New Subdomain** again
2. Enter subdomain name: `api.musicify` (full domain: `api.musicify.hassanscode.com`)
3. Click **OK**

### 1.3 Enable Node.js

1. Go to **Websites & Domains** > Select your backend subdomain
2. Click **Node.js**
3. Enable Node.js
4. Select Node.js version **18.x** or higher
5. Set Application mode to **Production**

---

## Step 2: Upload Code to Server

### Option A: Using Git (Recommended)

1. SSH into your server
2. Navigate to the backend domain directory:
   ```bash
   cd /var/www/vhosts/hassanscode.com/api.musicify.hassanscode.com
   ```

3. Clone the repository:
   ```bash
   git clone https://github.com/thehassans/musicify.git .
   ```

### Option B: Using Plesk File Manager

1. Download the repository as a ZIP file from GitHub
2. In Plesk, go to **Files** > **File Manager**
3. Navigate to the domain directory
4. Upload and extract the ZIP file

---

## Step 3: Configure Backend

### 3.1 Set Environment Variables in Plesk

1. Go to **Websites & Domains** > `api.musicify.hassanscode.com`
2. Click **Node.js**
3. Click **Environment Variables** or use the **Custom Environment Variables** section
4. Add the following variables:

```
PORT=5000
NODE_ENV=production
PUBLIC_BACKEND_URL=https://api.musicify.hassanscode.com
PYTHON_ANALYZER_URL=http://127.0.0.1:8001
DATABASE_PATH=./data/musicify.db
CORS_ORIGINS=https://musicify.hassanscode.com,https://www.musicify.hassanscode.com
```

### 3.2 Install Backend Dependencies

1. SSH into your server or use Plesk Terminal
2. Navigate to backend directory:
   ```bash
   cd /var/www/vhosts/hassanscode.com/api.musicify.hassanscode.com/backend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

### 3.3 Configure Node.js Application in Plesk

1. Go to **Node.js** settings for the backend subdomain
2. Set **Application root**: `/backend`
3. Set **Application startup file**: `src/server.js`
4. Click **Enable Node.js** and **Apply**

---

## Step 4: Set Up Python Analyzer Service

### 4.1 Install Python Dependencies

1. SSH into your server
2. Navigate to the Python directory:
   ```bash
   cd /var/www/vhosts/hassanscode.com/api.musicify.hassanscode.com/backend/python
   ```

3. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

4. Install dependencies:
   ```bash
   pip install librosa numpy fastapi uvicorn pydantic yt-dlp
   ```

### 4.2 Create Systemd Service for Python Analyzer

1. Create a service file:
   ```bash
   sudo nano /etc/systemd/system/musicify-analyzer.service
   ```

2. Add the following content:
   ```ini
   [Unit]
   Description=Musicify Python Analyzer Service
   After=network.target

   [Service]
   Type=simple
   User=your-plesk-user
   WorkingDirectory=/var/www/vhosts/hassanscode.com/api.musicify.hassanscode.com/backend/python
   ExecStart=/var/www/vhosts/hassanscode.com/api.musicify.hassanscode.com/backend/python/venv/bin/uvicorn analyzer_service:app --host 127.0.0.1 --port 8001
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable musicify-analyzer
   sudo systemctl start musicify-analyzer
   sudo systemctl status musicify-analyzer
   ```

---

## Step 5: Build and Deploy Frontend

### 5.1 Build Frontend Locally

1. On your local machine, navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Update `.env.production` with correct API URL:
   ```
   VITE_API_BASE_URL=https://api.musicify.hassanscode.com/api
   ```

3. Build for production:
   ```bash
   npm install
   npm run build
   ```

### 5.2 Upload Built Files to Plesk

1. In Plesk File Manager, navigate to:
   ```
   /var/www/vhosts/hassanscode.com/musicify.hassanscode.com/httpdocs
   ```

2. Delete all default files in `httpdocs`

3. Upload all files from your local `frontend/dist` directory to `httpdocs`

---

## Step 6: Configure Web Server (Apache/Nginx)

### 6.1 Configure Frontend (SPA Routing)

1. Go to **Websites & Domains** > `musicify.hassanscode.com`
2. Click **Apache & nginx Settings**
3. Add to "Additional directives for HTTP":

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

4. Click **OK**

### 6.2 Configure Backend (Reverse Proxy)

This is typically handled by Plesk's Node.js integration, but verify:

1. Go to backend subdomain settings
2. Ensure the proxy pass is configured to forward requests to your Node.js application

---

## Step 7: Install yt-dlp (for YouTube analysis)

1. SSH into your server
2. Install yt-dlp globally:
   ```bash
   sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp
   sudo chmod a+rx /usr/local/bin/yt-dlp
   ```

---

## Step 8: Set Up SSL Certificates

1. Go to **Websites & Domains**
2. For each subdomain (`musicify` and `api.musicify`):
   - Click **SSL/TLS Certificates**
   - Click **Install** or **Get it free** (Let's Encrypt)
   - Follow the prompts to install SSL certificate
   - Enable **Permanent SEO-safe 301 redirect from HTTP to HTTPS**

---

## Step 9: Start the Application

### 9.1 Start Backend

1. Go to **Node.js** settings for `api.musicify.hassanscode.com`
2. Click **Restart App** or **Enable Node.js**
3. Verify it's running by visiting: `https://api.musicify.hassanscode.com`

### 9.2 Verify Python Service

```bash
sudo systemctl status musicify-analyzer
```

### 9.3 Test Frontend

1. Visit: `https://musicify.hassanscode.com`
2. Try uploading an audio file or analyzing a YouTube URL

---

## Step 10: Monitoring and Logs

### View Backend Logs

1. SSH into server
2. Check logs:
   ```bash
   cd /var/www/vhosts/hassanscode.com/api.musicify.hassanscode.com/backend
   tail -f backend.log
   ```

Or in Plesk:
- Go to **Node.js** settings
- Check the logs section

### View Python Analyzer Logs

```bash
sudo journalctl -u musicify-analyzer -f
```

---

## Troubleshooting

### Backend Not Starting

1. Check environment variables are set correctly in Plesk
2. Verify Node.js version: `node --version` (should be 18+)
3. Check logs for errors
4. Ensure all dependencies are installed: `npm install`

### Python Service Not Running

1. Check service status: `sudo systemctl status musicify-analyzer`
2. View logs: `sudo journalctl -u musicify-analyzer -n 50`
3. Verify Python dependencies: `pip list`

### CORS Errors

1. Verify `CORS_ORIGINS` environment variable includes your frontend domain
2. Check that frontend is using `https://` (not `http://`)
3. Clear browser cache and try again

### Upload Not Working

1. Verify `uploads` directory exists in backend with write permissions:
   ```bash
   mkdir -p /var/www/vhosts/hassanscode.com/api.musicify.hassanscode.com/backend/uploads
   chmod 755 /var/www/vhosts/hassanscode.com/api.musicify.hassanscode.com/backend/uploads
   ```

### Database Errors

1. Ensure `data` directory exists:
   ```bash
   mkdir -p /var/www/vhosts/hassanscode.com/api.musicify.hassanscode.com/backend/data
   chmod 755 /var/www/vhosts/hassanscode.com/api.musicify.hassanscode.com/backend/data
   ```

---

## Maintenance

### Updating the Application

1. SSH into server
2. Navigate to repository:
   ```bash
   cd /var/www/vhosts/hassanscode.com/api.musicify.hassanscode.com
   ```

3. Pull latest changes:
   ```bash
   git pull origin main
   ```

4. Update backend:
   ```bash
   cd backend
   npm install
   ```

5. Restart backend in Plesk Node.js settings

6. For frontend updates:
   - Build locally with `npm run build`
   - Upload new `dist` files to `httpdocs`

---

## Security Recommendations

1. **Firewall**: Ensure only necessary ports are open (80, 443)
2. **Environment Variables**: Never commit `.env` files to Git
3. **Regular Updates**: Keep Node.js, Python, and dependencies updated
4. **Backups**: Set up regular backups in Plesk
5. **Monitoring**: Set up uptime monitoring for your domains

---

## Quick Reference

- **Frontend URL**: https://musicify.hassanscode.com
- **Backend URL**: https://api.musicify.hassanscode.com
- **Backend Directory**: `/var/www/vhosts/hassanscode.com/api.musicify.hassanscode.com/backend`
- **Frontend Directory**: `/var/www/vhosts/hassanscode.com/musicify.hassanscode.com/httpdocs`
- **Python Service**: Port 8001 (localhost only)
- **Restart Backend**: Plesk > Node.js > Restart App
- **Restart Python**: `sudo systemctl restart musicify-analyzer`

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review application logs
3. Verify all environment variables are set correctly
4. Ensure SSL certificates are valid and installed

For Plesk-specific issues, consult Plesk documentation or contact your hosting provider.
