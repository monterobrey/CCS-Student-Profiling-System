# Frontend Deployment on Render

## Paano I-deploy ang React Frontend sa Render

### Option 1: Separate Static Site (Recommended)

#### Step 1: Create New Static Site
1. Go to Render dashboard: https://dashboard.render.com
2. Click **"New +"** → **"Static Site"**
3. Connect your GitHub repository
4. Select: `CCS-Student-Profiling-System`

#### Step 2: Configure Static Site

**Name:** `ccs-frontend` (or any name you want)

**Branch:** `faculty-backend` (or your main branch)

**Root Directory:** `frontend`

**Build Command:**
```bash
npm install && npm run build
```

**Publish Directory:**
```
build
```

#### Step 3: Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

- **Key:** `REACT_APP_API_URL`
- **Value:** `https://ccs-student-profiling-system.onrender.com/api`

#### Step 4: Deploy
1. Click **"Create Static Site"**
2. Wait 2-3 minutes for deployment
3. Your frontend will be available at: `https://ccs-frontend.onrender.com`

---

### Option 2: Using render.yaml (Both Backend + Frontend)

If you want to deploy both in one configuration:

#### Step 1: Update render.yaml
The `render.yaml` file is already created in your project root.

#### Step 2: Deploy from Dashboard
1. Go to Render dashboard
2. Click **"New +"** → **"Blueprint"**
3. Connect your repository
4. Render will automatically detect `render.yaml`
5. Click **"Apply"**

---

## After Deployment

### Update Backend CORS
After getting your frontend URL, update `backend/config/cors.php`:

```php
'allowed_origins' => [
    'http://localhost:3000',
    'https://ccs-frontend.onrender.com',  // Your actual Render frontend URL
],
```

Then redeploy the backend.

---

## Troubleshooting

### Build Failed - "Empty build command"
**Solution:** Make sure you set the build command:
```bash
npm install && npm run build
```

### Build Failed - "Publish directory does not exist"
**Solution:** Make sure publish directory is set to:
```
build
```

### Module not found errors
**Solution:** Make sure all dependencies are in `package.json` and committed to Git

### CORS Errors
**Solution:** Update backend CORS configuration to include your frontend URL

---

## Important Notes

- **Free Tier:** Static sites on Render are FREE
- **Auto-deploy:** Automatically redeploys when you push to GitHub
- **Custom Domain:** You can add custom domains in settings
- **HTTPS:** Automatic SSL certificate

---

## Render vs Vercel for Frontend

| Feature | Render | Vercel |
|---------|--------|--------|
| Price | Free | Free |
| Speed | Good | Faster |
| Setup | Manual config | Auto-detect |
| Best for | Full-stack | Frontend |

**Recommendation:** Use **Vercel** for frontend (easier and faster)

---

## Quick Vercel Alternative

If Render is giving you trouble, try Vercel instead:

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "New Project"
4. Select your repo
5. Set root directory to `frontend`
6. Add env var: `REACT_APP_API_URL`
7. Deploy!

Much simpler! 🚀
