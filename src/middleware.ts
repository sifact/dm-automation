import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define protected routes
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/payment(.*)", "/callback(.*)", "/complete-profile(.*)", "/api/payment(.*)"]);

// Define public auth routes that should never be protected
const isPublicAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/api/webhook(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Don't protect auth routes, protect everything else that matches protected patterns
  if (!isPublicAuthRoute(req) && isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
