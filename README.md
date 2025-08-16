This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install dependencies:

```bash
pnpm i
```

Then, copy the environment variables template:

```bash
cp .env.example .env
```

> **Note:** Make sure to update the values in `.env` with your actual configuration

Then, generate the local SQLite database:

```bash
pnpm db:migrate:dev
```

Finally, start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Management

When making schema changes:

1. Generate new migrations:

```bash
pnpm db:generate
```

2. Apply migrations locally:

```bash
pnpm db:migrate:dev
```

3. Apply migrations to production:

```bash
pnpm db:migrate:remote
```

To restart/reset your local database:

1. Delete the .wrangler directory:

```bash
rm -rf .wrangler
```

2. Re-run the migration:

```bash
pnpm db:migrate:dev
```

## Overview

This project uses OpenNext.js with Cloudflare. The application is optimized for Cloudflare's edge network, providing fast global distribution and serverless execution.

## Initial Deploy Process

When deploying the project for the first time, you may encounter TypeScript errors related to missing `.open-next/worker.js` files. This is expected because these files are generated during the build process, but TypeScript checks for them before they exist.

To resolve this, you'll need to add `// @ts-expect-error: Generated at build time` comments above the imports in `worker.ts`:

```typescript
// @ts-expect-error: Generated at build time
import { default as handler } from "./.open-next/worker.js";

// ... your code ...

// @ts-expect-error: Generated at build time
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";
```

After adding these comments, you can proceed with the build process. These files will be generated during the build, and the TypeScript errors will be resolved for subsequent builds.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Known Issues

### Development Server Warnings

When running `pnpm dev`, you may see the following warning about Durable Objects (see [OpenNext.js Cloudflare Known Issues](https://opennext.js.org/cloudflare/known-issues#caching-durable-objects-doqueuehandler-and-doshardedtagcache)):
