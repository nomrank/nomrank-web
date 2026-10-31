// The superadmin signs in with the username "superadmin". It's an ordinary Supabase account at a reserved address
// (created by supabase/migrations/20261029170000_superadmin.sql); the admin sign-in form maps the username onto it.
export const SUPERADMIN_USERNAME = "superadmin";
export const SUPERADMIN_EMAIL = "superadmin@admin.nomrank.in";

// What was typed on the admin sign-in form → the email to sign in with ("superadmin" or a real email address).
export const signInEmail = (typed: string) => {
  const value = typed.trim();
  return value.toLowerCase() === SUPERADMIN_USERNAME ? SUPERADMIN_EMAIL : value;
};

// What to tell someone whose acceptance the database refused. The messages come from public.accept_admin_invite; one
// per way it can fail, so a missing profile is never reported as an expired link.
export function inviteProblem(message: string) {
  if (message.includes("another email")) return "This invitation was sent to a different email. Sign in with that account.";
  if (message.includes("banned")) return "This account can't be an admin.";
  if (message.includes("already used")) return "This invitation was already used.";
  if (message.includes("expired")) return "This invitation expired. Ask the superadmin for a new one.";
  if (message.includes("not found")) return "This invitation link isn't valid. It may have been replaced or cancelled. Ask for a new one.";
  if (message.includes("finish setting up")) return "Finish setting up your Nomrank account first, then open this link again.";
  if (message.includes("confirm your email")) return "Confirm your email first (check your inbox), then open this link again.";
  if (message.includes("sign in")) return "Sign in first, then open this link again.";
  return "Couldn't accept the invitation. Try again, or ask the superadmin for a new one.";
}

// Only the admin site's own addresses may go into an invitation link (admin.nomrank.in, or admin.localhost in
// development), so a request that carries some other Origin or Host can't point an invitee at another site.
export const isAdminOrigin = (origin: string) => /^https:\/\/admin\.nomrank\.in$|^http:\/\/admin\.localhost(:\d+)?$/.test(origin);

// Where an invitation link goes: back to the admin site (admin.nomrank.in, or admin.localhost:3000 in development).
export const inviteUrl = (origin: string, token: string) => `${origin}/invite/${token}`;
