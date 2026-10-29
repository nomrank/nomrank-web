// The superadmin signs in with the username "superadmin". It's an ordinary Supabase account at a reserved address
// (created by supabase/migrations/20261029170000_superadmin.sql); the admin sign-in form maps the username onto it.
export const SUPERADMIN_USERNAME = "superadmin";
export const SUPERADMIN_EMAIL = "superadmin@admin.nomrank.in";

// What was typed on the admin sign-in form → the email to sign in with ("superadmin" or a real email address).
export const signInEmail = (typed: string) => {
  const value = typed.trim();
  return value.toLowerCase() === SUPERADMIN_USERNAME ? SUPERADMIN_EMAIL : value;
};

// Where an invitation link goes: back to the admin site (admin.nomrank.in, or admin.localhost:3000 in development).
export const inviteUrl = (origin: string, token: string) => `${origin}/invite/${token}`;
