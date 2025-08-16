import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  registerUserInputSchema,
  loginUserInputSchema,
  updateUserProfileInputSchema,
  createLinkInputSchema,
  updateLinkInputSchema,
  getPublicProfileInputSchema,
  trackClickInputSchema
} from './schema';

// Import handlers
import { registerUser } from './handlers/register_user';
import { loginUser } from './handlers/login_user';
import { updateUserProfile } from './handlers/update_user_profile';
import { createLink } from './handlers/create_link';
import { updateLink } from './handlers/update_link';
import { deleteLink } from './handlers/delete_link';
import { getUserLinks } from './handlers/get_user_links';
import { getPublicProfile } from './handlers/get_public_profile';
import { trackClick } from './handlers/track_click';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User authentication routes
  registerUser: publicProcedure
    .input(registerUserInputSchema)
    .mutation(({ input }) => registerUser(input)),

  loginUser: publicProcedure
    .input(loginUserInputSchema)
    .mutation(({ input }) => loginUser(input)),

  updateUserProfile: publicProcedure
    .input(updateUserProfileInputSchema)
    .mutation(({ input }) => updateUserProfile(input)),

  // Link management routes
  createLink: publicProcedure
    .input(createLinkInputSchema)
    .mutation(({ input }) => createLink(input)),

  updateLink: publicProcedure
    .input(updateLinkInputSchema)
    .mutation(({ input }) => updateLink(input)),

  deleteLink: publicProcedure
    .input(z.object({ linkId: z.number() }))
    .mutation(({ input }) => deleteLink(input.linkId)),

  getUserLinks: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserLinks(input.userId)),

  // Public routes
  getPublicProfile: publicProcedure
    .input(getPublicProfileInputSchema)
    .query(({ input }) => getPublicProfile(input)),

  trackClick: publicProcedure
    .input(trackClickInputSchema)
    .mutation(({ input }) => trackClick(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();