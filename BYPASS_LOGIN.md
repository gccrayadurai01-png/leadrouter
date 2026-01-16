# Login Bypass Enabled

The app has been configured to skip the login page and go directly to the dashboards.

## Access URLs

- **Admin Dashboard**: http://localhost:3000/admin
- **BDR Dashboard**: http://localhost:3000/dashboard
- **Default (Admin)**: http://localhost:3000

## What Changed

1. **Authentication bypassed** - No login required
2. **Direct dashboard access** - Routes go straight to dashboards
3. **Mock users** - Admin and BDR users are automatically set

## To Re-enable Login

If you want to restore login functionality:

1. Revert changes in `client/src/App.js`
2. Revert changes in `client/src/context/AuthContext.js`
3. Restart the app

## Note

The backend API still requires authentication. For full functionality, you'll need to:
- Set up the database (run `npm run setup`)
- Or the API calls will fail

But you can now see the UI without logging in!

