import { convexAuthNextjsMiddleware, createRouteMatcher, isAuthenticatedNextjs, nextjsMiddlewareRedirect } from "@convex-dev/auth/nextjs/server";

const isSignInPage = createRouteMatcher(["/login", "/signup"]);
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default convexAuthNextjsMiddleware(async (request) => {
    if (isSignInPage(request) && await isAuthenticatedNextjs()) {
        return nextjsMiddlewareRedirect(request, "/dashboard/Profile");
    }

    if (isProtectedRoute(request) && !(await isAuthenticatedNextjs())) {
        return nextjsMiddlewareRedirect(request, "/login");
    }
});

export const config = {
    // The following matcher runs middleware on all routes
    // except static assets.
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
