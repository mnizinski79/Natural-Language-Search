# Vercel Deployment Checklist

Use this checklist to ensure a smooth deployment to Vercel.

## Pre-Deployment

- [ ] **Test build locally**
  ```bash
  npm run build
  ```
  - Verify build completes without errors
  - Check `dist/hotel-search/` directory is created

- [ ] **Test application locally**
  ```bash
  npm run start:dev
  ```
  - Verify all features work
  - Test AI search functionality
  - Test map interactions
  - Test hotel detail views

- [ ] **Run tests**
  ```bash
  npm test
  ```
  - All tests should pass

- [ ] **Check environment variables**
  - [ ] `.env` file exists locally (for development)
  - [ ] `.env.example` is up to date
  - [ ] Gemini API key is valid

- [ ] **Review configuration files**
  - [ ] `vercel.json` exists and is valid
  - [ ] `angular.json` has production configuration
  - [ ] `package.json` has `build:vercel` script

## Vercel Setup

- [ ] **Install Vercel CLI**
  ```bash
  npm i -g vercel
  ```

- [ ] **Login to Vercel**
  ```bash
  vercel login
  ```

- [ ] **Set environment variables in Vercel**
  ```bash
  vercel env add GEMINI_API_KEY
  ```
  - Set for: Production, Preview, Development

## Initial Deployment

- [ ] **Deploy to Vercel**
  ```bash
  vercel
  ```
  - Follow prompts to create new project
  - Note the deployment URL

- [ ] **Verify deployment**
  - [ ] Visit deployment URL
  - [ ] Landing page loads correctly
  - [ ] Can start a search
  - [ ] AI responses work
  - [ ] Map displays correctly
  - [ ] Hotel cards render
  - [ ] Detail views open

- [ ] **Test API endpoint**
  - Visit: `https://your-app.vercel.app/api/config`
  - Should return: `{"geminiApiKey": "your-key"}`
  - Key should NOT be "YOUR_API_KEY_HERE"

## Post-Deployment

- [ ] **Check build logs**
  ```bash
  vercel logs
  ```
  - No errors in build process
  - All assets compiled successfully

- [ ] **Test on different devices**
  - [ ] Desktop browser (Chrome, Firefox, Safari)
  - [ ] Mobile browser (iOS Safari, Android Chrome)
  - [ ] Tablet

- [ ] **Performance check**
  - [ ] Page loads in < 3 seconds
  - [ ] No console errors
  - [ ] Images load correctly
  - [ ] Map tiles load

- [ ] **Functionality check**
  - [ ] Search works with various queries
  - [ ] Filters apply correctly
  - [ ] Date picker works
  - [ ] Hotel details display
  - [ ] Responsive layout works

## Production Deployment

- [ ] **Deploy to production**
  ```bash
  vercel --prod
  ```

- [ ] **Update DNS (if using custom domain)**
  - Configure domain in Vercel dashboard
  - Update DNS records

- [ ] **Enable analytics** (optional)
  - Enable Vercel Analytics in dashboard
  - Monitor performance metrics

## Monitoring

- [ ] **Set up monitoring**
  - [ ] Check Vercel dashboard regularly
  - [ ] Monitor function execution times
  - [ ] Watch for errors in logs

- [ ] **Performance monitoring**
  - [ ] Check Core Web Vitals
  - [ ] Monitor bundle sizes
  - [ ] Track API response times

## Rollback Plan

If deployment has issues:

1. **Immediate rollback**
   ```bash
   vercel rollback [deployment-url]
   ```

2. **Or promote previous deployment**
   - Go to Vercel dashboard
   - Find working deployment
   - Click "Promote to Production"

## Common Issues

### Build Fails
- Check build logs: `vercel logs`
- Test build locally: `npm run build`
- Verify all dependencies are in `package.json`

### API Not Working
- Verify environment variable is set: `vercel env ls`
- Check API endpoint: `/api/config`
- Review function logs: `vercel logs --follow`

### Assets Not Loading
- Check browser console for 404 errors
- Verify `vercel.json` routes configuration
- Check MIME type headers

### Routing Issues
- Verify Angular routing configuration
- Check `vercel.json` catch-all route
- Test direct URL access to routes

## Success Criteria

✅ Application loads without errors
✅ AI search returns results
✅ Map displays with hotel markers
✅ Hotel details can be viewed
✅ Responsive design works on mobile
✅ No console errors
✅ API endpoint returns valid configuration
✅ Performance is acceptable (< 3s load time)

## Next Steps After Deployment

1. Share deployment URL with stakeholders
2. Set up custom domain (if needed)
3. Enable monitoring and analytics
4. Document any deployment-specific configurations
5. Create runbook for common issues

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Detailed deployment guide
- [Vercel Support](https://vercel.com/support)
