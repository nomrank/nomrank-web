// Focused screens (sign-in, onboarding, rating) get the whole phone; every other page shows the bottom nav.
const HIDDEN = ["/login", "/onboarding", "/rate", "/reset-password", "/suspended", "/coming-soon", "/auth"];

export const hidesMobileNav = (pathname: string) => HIDDEN.some((p) => pathname === p || pathname.startsWith(`${p}/`));
