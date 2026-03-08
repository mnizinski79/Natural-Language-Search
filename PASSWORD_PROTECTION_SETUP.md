# Password Protection Setup

This application includes optional password protection that can be enabled for production deployments (Vercel) while keeping local development unrestricted.

## How It Works

- **Local Development**: Password protection is disabled by default (set in `.env`)
- **Vercel Production**: Enable password protection via environment variables
- **Session-Based**: Once authenticated, users stay logged in for the browser session
- **Simple & Secure**: Password stored in environment variables, checked server-side

## Setup for Vercel Deployment

### 1. Enable Password Protection

In your Vercel project dashboard or via CLI, add these environment variables:

```bash
# Enable password protection
vercel env add PASSWORD_PROTECTED
# Enter: true

# Set your password
vercel env add APP_PASSWORD
# Enter: your_secure_password_here
```

### 2. Apply to All Environments

When prompted, select which environments to apply to:
- ✅ Production
- ✅ Preview
- ✅ Development (optional)

### 3. Redeploy

After setting environment variables, redeploy your application:

```bash
vercel --prod
```

## Updating the Password

To change the password:

### Via Vercel Dashboard

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Find `APP_PASSWORD`
4. Click "Edit" and enter new password
5. Redeploy the application

### Via CLI

```bash
# Remove old password
vercel env rm APP_PASSWORD

# Add new password
vercel env add APP_PASSWORD
# Enter your new password

# Redeploy
vercel --prod
```

## Disabling Password Protection

To disable password protection on Vercel:

### Option 1: Set to false

```bash
vercel env rm PASSWORD_PROTECTED
vercel env add PASSWORD_PROTECTED
# Enter: false
```

### Option 2: Remove the variable

```bash
vercel env rm PASSWORD_PROTECTED
vercel env rm APP_PASSWORD
```

Then redeploy.

## Local Development

Password protection is disabled by default in `.env`:

```env
PASSWORD_PROTECTED=false
APP_PASSWORD=
```

If you want to test password protection locally:

1. Edit `.env`:
   ```env
   PASSWORD_PROTECTED=true
   APP_PASSWORD=test123
   ```

2. Restart your development server:
   ```bash
   npm run start:dev
   ```

3. The password gate will appear at `http://localhost:4200`

## Security Notes

- ✅ Password is stored in environment variables (not in code)
- ✅ Password is checked server-side via API endpoint
- ✅ Session-based authentication (no cookies)
- ✅ Password never exposed in client-side code
- ⚠️ This is basic protection suitable for demos/previews
- ⚠️ For production apps, consider proper authentication (OAuth, JWT, etc.)

## Troubleshooting

### Password gate not showing on Vercel

1. Check environment variables are set:
   ```bash
   vercel env ls
   ```
   Should show `PASSWORD_PROTECTED` and `APP_PASSWORD`

2. Verify `PASSWORD_PROTECTED` is set to `true` (not `"true"` with quotes)

3. Check the API endpoint:
   ```
   https://your-app.vercel.app/api/config
   ```
   Should return:
   ```json
   {
     "geminiApiKey": "...",
     "passwordProtected": true,
     "appPassword": "your_password"
   }
   ```

### Password gate showing on localhost

Check your `.env` file:
```env
PASSWORD_PROTECTED=false
```

Restart the development server after changing.

### "Incorrect password" error

1. Verify the password in Vercel environment variables
2. Check for extra spaces or special characters
3. Password is case-sensitive

### Can't access after entering correct password

1. Clear browser session storage:
   - Open DevTools (F12)
   - Go to Application > Session Storage
   - Clear all entries
   - Refresh page

2. Try incognito/private browsing mode

## Architecture

```
┌─────────────────┐
│   User visits   │
│   application   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  App loads and  │
│ fetches /api/   │
│     config      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ PASSWORD_PROTECTED = true?  │
└────────┬────────────────────┘
         │
    ┌────┴────┐
    │         │
   Yes       No
    │         │
    ▼         ▼
┌─────────┐ ┌──────────────┐
│  Show   │ │ Show normal  │
│Password │ │ application  │
│  Gate   │ └──────────────┘
└────┬────┘
     │
     ▼
┌─────────────────┐
│ User enters     │
│ password        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Password match? │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
   Yes       No
    │         │
    ▼         ▼
┌─────────┐ ┌──────────┐
│  Store  │ │  Show    │
│  auth   │ │  error   │
│  flag   │ └──────────┘
└────┬────┘
     │
     ▼
┌─────────────────┐
│ Show normal     │
│ application     │
└─────────────────┘
```

## Files Modified

- `src/app/components/password-gate.component.ts` - Password gate UI
- `src/app/services/config.service.ts` - Added password protection config
- `src/app/app.component.ts` - Added password gate logic
- `api/config.js` - Returns password protection settings
- `.env.example` - Documented new environment variables

## Example Vercel Environment Variables

```
GEMINI_API_KEY=AIzaSy...
PASSWORD_PROTECTED=true
APP_PASSWORD=MySecurePassword123!
```
