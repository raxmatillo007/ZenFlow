# ZenFlow (Vue 3) Setup

To run this project locally:

1. Install dependencies:
`npm install`

2. Start frontend + backend together:
`npm run dev:full`

3. Open:
`http://localhost:5173`

## Available scripts

- `npm run dev`: frontend only (Vite + Vue 3)
- `npm run server`: backend only (Express on port 4000)
- `npm run dev:full`: frontend + backend together
- `npm run build`: production build
- `npm run preview`: preview production build

## Prisma Note

This workspace is pinned to Prisma 6. The schema in `backend/prisma/schema.prisma` correctly uses:
`url = env("DATABASE_URL")`

If VS Code shows a Prisma 7-style warning for `datasource.url`, reload the window after opening the workspace so the Prisma extension picks up the workspace setting `prisma.pinToPrisma6`.

## Google Login

To enable Google sign-in, set both of these in `.env`:
- `GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_CLIENT_ID`

Use the same Google OAuth Web Client ID value for both.
