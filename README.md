# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

## Backend API (Vercel + Supabase)

Production builds use the Vercel functions in `api/` instead of browser `localStorage`. The API uses PostgreSQL and a signed, `HttpOnly` session cookie. Public signup always creates a patient account; an administrator must be provisioned separately. Passwords are hashed with bcrypt and role checks are enforced by the API.

### Supabase setup

1. Create a new Supabase project and open its SQL Editor.
2. Run `api/schema.sql` once against the empty project. This script does not drop tables, but it is still a one-time schema initializer and will fail if those tables already exist.
3. If the app tables already exist, run `api/migrations/001_email_verification.sql` instead. It preserves existing accounts as verified and requires verification for newly created accounts.
4. Copy the PostgreSQL connection string from Supabase. Use a connection pooler URL supported by Vercel and include `sslmode=require`.
5. Create a long random session secret (at least 32 characters). Do not commit it or put it in React source.
6. In Supabase Dashboard > Authentication > Providers > Email, enable email confirmations. Under URL Configuration, set the Site URL to the deployed app and allow that URL under Redirect URLs.
7. Supabase's built-in email service needs no custom domain and is suitable for capstone testing, but it is rate-limited and may only deliver to authorized/verified addresses in the Supabase organization. To verify arbitrary recipients, configure a custom SMTP provider.

### Vercel setup

Import the GitHub repository with `hiv-website` as its Root Directory. The included `vercel.json` configures Create React App's `npm run build` and `build` output. Add these Project Environment Variables for Preview and Production:

- `DATABASE_URL`: Supabase PostgreSQL connection string
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anon/publishable key
- `SUPABASE_SERVICE_ROLE_KEY`: server-only service key; never expose it in browser code
- `SESSION_SECRET`: unique random secret of at least 32 characters
- `RESEND_API_KEY` and `EMAIL_FROM` (optional): only needed for arbitrary admin/event emails; Supabase Auth verification does not use them
- `APP_URL` (optional): canonical HTTPS site origin for verification links; otherwise Vercel's deployment URL is used

Deploy, then check `/api/health`; it should return `{"status":"ok"}`. New public and administrator-created accounts must verify through Supabase Auth before signing in. Existing accounts remain verified after the migration and are linked to Supabase Auth on their next successful sign-in. Supabase controls verification-link expiry and reuse. Admins can resend verification from the Users or Health Workers list. Supabase's built-in sender is limited/rate-limited for development; use custom SMTP if the capstone must deliver to arbitrary email addresses. Resend remains optional for custom admin/event notifications.

### Create the first administrator

Public registration intentionally cannot create an administrator. Run this from the `hiv-website` folder on a trusted machine, with `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` set in the terminal. The initial administrator is created and verified in Supabase Auth because this is an operator-provisioned account. The script prompts for the administrator password without echoing it:

```powershell
npm run create-admin
```

Sign in through the app using the provisioned email and password. Do not create administrator accounts through public signup.

### Local API development

The CRA development server does not run Vercel functions. For local API work, install/use the Vercel CLI and run `vercel dev` from this folder with `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`, `APP_URL`, and `REACT_APP_USE_API=true` in an ignored `.env.local` file. Do not use real patient data during development.

### Email and security status

Email notifications contain no message body or clinical notes; private chat notices ask the recipient to sign in to view the message. Admin-composed email is sent only to the address stored for the selected account. Keep provider credentials in Vercel environment variables and never expose them through `REACT_APP_*` variables.

This is an initial API integration, not a certification or compliance claim. Before handling real health information, add and test production-grade login rate limiting, account recovery and verification, operational monitoring, backups and restore drills, and a formal privacy/security review. Keep the site in demo use until those controls and applicable legal requirements have been reviewed.

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
