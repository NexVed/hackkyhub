# Activate Next.js Sentry before the first monitored release

The Python worker already initializes Sentry when `SENTRY_DSN` is set. Next.js
instrumentation below is an activation template, not enabled application code.

1. Create separate Sentry projects for frontend and ingestion, then environments
   `staging` and `production`. Enable MFA on the organization.
2. In `frontend`, install a reviewed SDK release with `npm install --save-exact
   @sentry/nextjs`, commit the package lock and copy the three `.template` files
   in this directory to the frontend root, removing `.template`.
3. Set `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_APP_ENV` and
   `NEXT_PUBLIC_APP_RELEASE` during the frontend image build. A DSN identifies a
   project; it is public. Provider OAuth tokens and Sentry auth tokens are not.
4. Wrap the exported Next configuration with `withSentryConfig(config, {
   org: process.env.SENTRY_ORG, project: process.env.SENTRY_PROJECT,
   authToken: process.env.SENTRY_AUTH_TOKEN, silent: !process.env.CI,
   sourcemaps: { deleteSourcemapsAfterUpload: true } })`.
5. Upload source maps with a narrowly scoped Sentry token. Add a BuildKit secret
   mount to the Docker build instruction:
   `RUN --mount=type=secret,id=sentry_auth_token SENTRY_AUTH_TOKEN="$(cat
   /run/secrets/sentry_auth_token)" npm run build`. Supply the token with
   `docker build --secret id=sentry_auth_token,env=SENTRY_AUTH_TOKEN ...` from a
   protected release job. Do not use a Docker ARG for this credential.
6. Forward the public build variables as Docker ARG/ENV in the builder only;
   pass `SENTRY_DSN`, `APP_ENV`, `APP_RELEASE` as server runtime variables.
   Keep the build public release and runtime release identical.
7. In staging, trigger and then remove one test error in both browser and
   worker. Confirm symbolicated stacks and a real alert before production.

Templates disable PII collection and remove request metadata. Replay is disabled.
Review breadcrumbs and event contents against the privacy policy before enabling
additional integrations. Auth data and invite tokens must never be logged.

See [Sentry Next.js setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/)
and [Python SDK](https://docs.sentry.io/platforms/python/).
