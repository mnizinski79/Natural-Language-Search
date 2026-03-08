# Vercel Deployment Guide

This guide walks you through deploying the IHG Hotel Search Application to Vercel.

## Prerequisites

- Vercel account ([sign up here](https://vercel.com/signup))
- Vercel CLI installed: `npm i -g vercel`
- Google Gemini API key ([get one here](https://makersuite.google.com/app/apikey))

## Project Configuration

The project has been configured for Vercel deployment with:

✅ **vercel.json** - Vercel configuration with routing and headers
✅ **api/config.js** - Serverless function for API configuration
✅ **angular.json** - Optimized build budgets (2MB initial, 5MB max)
✅ **.vercelignore** - Excludes unnecessary files from deployment
✅ **package.json** - Added `build:vercel` script

## Deployment Steps

### 1. Install Vercel CLI (if not already installed)

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Set Environment Variables

You need to set your Gemini API key in Vercel:

**Option A: Via Vercel Dashboard**
1. Go to your project settings on Vercel
2. Navigate to "Environment Variables"
3. Add: `GEMINI_API_KEY` with your API key value
4. Apply to: Production, Preview, and Development

**Option B: Via CLI**
```bash
vercel env add GEMINI_API_KEY
```
Enter your API key when prompted.

### 4. Deploy to Vercel

**For first-time deployment:**
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? **hotel-search** (or your preferred name)
- In which directory is your code located? **./**
- Want to override settings? **N**

**For subsequent deployments:**
```bash
vercel --prod
```

## Build Configuration

### Output Directory
- Angular builds to: `dist/hotel-search/`
- Vercel serves from: `dist/hotel-search/`

### Build Command
Vercel automatically runs: `npm run build:vercel`

### Serverless Functions
- Located in: `/api` directory
- Currently: `/api/config.js` (returns Gemini API key)

## Routing Configuration

The `vercel.json` configures:

1. **API Routes**: `/api/*` → Serverless functions
2. **Static Assets**: Cached for 1 year with immutable headers
3. **SPA Routing**: All other routes → `index.html` (Angular handles routing)

## Security Headers

Configured headers:
- **CORS**: Enabled for API endpoints
- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY
- **X-XSS-Protection**: 1; mode=block

## Build Budgets

Optimized for Vercel:
- **Initial bundle**: 2MB warning, 5MB error
- **Component styles**: 6KB warning, 10KB error

These are realistic for an Angular app with Leaflet maps and AI integration.

## Troubleshooting

### Build Fails

**Check build logs:**
```bash
vercel logs
```

**Common issues:**
- Missing dependencies: Run `npm install` locally first
- TypeScript errors: Run `npm run build` locally to test
- Budget exceeded: Analyze bundle with `npm run analyze`

### API Not Working

**Check environment variables:**
```bash
vercel env ls
```

**Verify API endpoint:**
- Visit: `https://your-app.vercel.app/api/config`
- Should return: `{"geminiApiKey": "your-key"}`

### Static Assets Not Loading

**Check MIME types:**
- Vercel automatically serves correct MIME types
- If issues persist, check browser console for errors

### Routing Issues

**Verify vercel.json routes:**
- API routes should match before catch-all
- SPA catch-all should be last route

## Performance Optimization

### Analyze Bundle Size
```bash
npm run build:stats
npm run analyze
```

### Optimization Tips
1. **Lazy load routes** - Load feature modules on demand
2. **Optimize images** - Use WebP format, compress images
3. **Tree shaking** - Remove unused code (automatic in production)
4. **CDN caching** - Vercel's edge network caches static assets

## Monitoring

### View Deployment Logs
```bash
vercel logs [deployment-url]
```

### View Function Logs
```bash
vercel logs --follow
```

### Analytics
Enable Vercel Analytics in your project dashboard for:
- Page views
- Performance metrics
- Error tracking

## Local Testing with Vercel

Test your deployment locally:

```bash
vercel dev
```

This runs:
- Angular dev server
- Serverless functions locally
- Simulates Vercel environment

## Rollback

If a deployment has issues:

```bash
vercel rollback [deployment-url]
```

Or use the Vercel dashboard to promote a previous deployment.

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Angular on Vercel](https://vercel.com/guides/deploying-angular-with-vercel)
- [Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Environment Variables](https://vercel.com/docs/environment-variables)

## Support

For issues specific to this deployment:
1. Check the troubleshooting section above
2. Review Vercel build logs
3. Test locally with `vercel dev`
4. Check browser console for client-side errors

For Vercel platform issues:
- [Vercel Support](https://vercel.com/support)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
