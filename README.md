# ReExplain Web

## Authentication setup

Authentication uses Better Auth with Google OAuth and PostgreSQL.

1. Copy the variable names from `.env.example` into `.env` and provide real values.
2. Generate `BETTER_AUTH_SECRET` with `openssl rand -base64 32`.
3. Set `BETTER_AUTH_URL` and `BETTER_AUTH_TRUSTED_ORIGINS` to the app origin. For local development, use `http://localhost:3000`.
4. In Google Cloud Console, create a Web OAuth client and add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.
5. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `POSTGRES_SERVER`, `POSTGRES_PORT`, `POSTGRES_DATABASE`, `POSTGRES_USERNAME`, `POSTGRES_PASSWORD`.
6. Apply the Better Auth tables with `npm run auth:migrate`.

For production, add `https://your-domain.com/api/auth/callback/google` in Google Cloud and use the production origin for the Better Auth URL and trusted origins.
