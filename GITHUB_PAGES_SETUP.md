# GitHub Pages Deployment Guide

## 🚀 How to Deploy to GitHub Pages

Your lab database frontend is now **secure and ready** for GitHub Pages deployment! Here's how to set it up:

### Option 1: Automatic Authentication (Recommended)

The app will automatically detect if users have access to your private data repository:

1. **If repository is public**: Users get immediate read-only access
2. **If repository is private**: Users are prompted to authenticate with GitHub

### Option 2: Deploy Steps

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to GitHub Pages**:
   
   **Method A: Using gh-pages package**
   ```bash
   npm install --save-dev gh-pages
   ```
   
   Add to `package.json`:
   ```json
   {
     "homepage": "https://rasilab.github.io/lab_database_django",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d build"
     }
   }
   ```
   
   Then deploy:
   ```bash
   npm run deploy
   ```

   **Method B: Manual GitHub Pages setup**
   1. Go to your repository settings
   2. Scroll to "Pages" section
   3. Select "Deploy from a branch"
   4. Choose "gh-pages" branch
   5. Save settings

### 3. Environment Configuration

Update your `.env` file for production:

```env
# GitHub Repository Configuration  
REACT_APP_GITHUB_OWNER=rasilab
REACT_APP_GITHUB_DATA_REPO=lab-database-data

# Optional: GitHub OAuth (for advanced authentication)
# REACT_APP_GITHUB_CLIENT_ID=your_client_id_here
# REACT_APP_GITHUB_REDIRECT_URI=https://rasilab.github.io/lab_database_django
```

## 🔐 Security Features

✅ **No secrets exposed**: All authentication is client-side  
✅ **Automatic access detection**: Checks if users can access your data repo  
✅ **Token validation**: Only valid GitHub tokens accepted  
✅ **Organization security**: Lab members get write access, others read-only  

## 🎯 User Experience

### For Repository Owners/Collaborators:
1. Visit the GitHub Pages URL
2. App automatically detects their GitHub access
3. If they have repo access → Immediate access
4. If not → Guided token creation process

### For External Users:
1. App detects they need authentication
2. Clear step-by-step token creation guide
3. Secure token validation before access

## 📋 Required GitHub Token Permissions

When users create tokens, they need:
- `repo` - Full control of private repositories  
- `user:email` - Access user email addresses
- `read:org` - Read organization membership

## 🎨 What Users Will See

1. **Loading screen** while checking access
2. **Automatic login** if they have repository access
3. **Token setup wizard** if authentication needed
4. **Full lab database interface** once authenticated

## 🔧 Customization

To customize for your organization:

1. Update repository names in `.env`
2. Change organization name in authentication service
3. Modify branding in login components
4. Add custom domain (optional)

Your lab database is now ready for secure, professional deployment! 🎉