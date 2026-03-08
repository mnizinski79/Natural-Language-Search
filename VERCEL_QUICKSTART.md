# Vercel Deployment - Quick Start

Get your IHG Hotel Search app deployed to Vercel in 5 minutes.

## Prerequisites

- Vercel account ([sign up free](https://vercel.com/signup))
- Google Gemini API key ([get one](https://makersuite.google.com/app/apikey))

## 5-Minute Deploy

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Login

```bash
vercel login
```

### 3. Set Your API Key

```bash
vercel env add GEMINI_API_KEY
```

When prompted:
- **Value**: Paste your Gemini API key
- **Environments**: Select all (Production, Preview, Development)

### 4. Deploy

```bash
vercel --prod
```

That's it! Your app is live. 🎉

## Verify Deployment

1. **Visit your app**: Open the URL Vercel provides
2. **Test the API**: Visit `https://your-app.vercel.app/api/config`
   - Should return: `{"geminiApiKey": "your-key"}`
3. **Try a search**: Use the chat interface to search for hotels

## What Just Happened?

Vercel automatically:
- ✅ Built your Angular app
- ✅ Deployed static files to global CDN
- ✅ Created serverless function for API
- ✅ Configured routing for SPA
- ✅ Set up HTTPS with SSL certificate
- ✅ Enabled automatic deployments from Git

## Common Issues

### "Build failed"
```bash
# Test build locally first
npm run build
```

### "API key not working"
```bash
# Verify environment variable is set
vercel env ls

# Should show: GEMINI_API_KEY (Production, Preview, Development)
```

### "404 on routes"
- This is normal! Vercel's configuration handles Angular routing
- Direct URL access works after the catch-all route is configured

## Next Steps

- **Custom domain**: Add in Vercel dashboard → Settings → Domains
- **Analytics**: Enable in Vercel dashboard → Analytics
- **Monitoring**: Check Vercel dashboard → Deployments for logs

## Need More Help?

- 📖 [Full Deployment Guide](./VERCEL_DEPLOYMENT.md)
- ✅ [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- 📝 [Changes Summary](./VERCEL_CHANGES_SUMMARY.md)

## Rollback

If something goes wrong:

```bash
vercel rollback
```

Or use the Vercel dashboard to promote a previous deployment.

---

**Pro Tip**: Every `git push` to your main branch will automatically deploy to Vercel once you connect your repository!
