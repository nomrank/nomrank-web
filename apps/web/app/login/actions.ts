"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, passwordSchema } from "@/lib/validation";

export type LoginState =
  | { status: "idle" }
  | { status: "sent"; email: string; kind: "confirm" | "reset" }
  | { status: "error"; message: string; email: string };

const fail = (message: string, email: string): LoginState => ({ status: "error", message, email });

// The links in our emails come back to whatever address the person is on (beta or main), see supabase/templates.
async function confirmUrl() {
  const h = await headers();
  const origin = h.get("origin") ?? `http://${h.get("host")}`;
  return `${origin}/auth/confirm`;
}

function parse(formData: FormData) {
  const raw = String(formData.get("email") ?? "");
  const email = emailSchema.safeParse(raw);
  return { raw, email };
}

export async function signIn(_: LoginState, formData: FormData): Promise<LoginState> {
  const { raw, email } = parse(formData);
  if (!email.success) return fail(email.error.issues[0].message, raw);
  const password = String(formData.get("password") ?? "");
  if (!password) return fail("Enter your password.", raw);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.data, password });
  if (error) {
    if (error.code === "email_not_confirmed") return fail("Confirm your email first. We sent you a link when you signed up.", raw);
    if (error.status === 429) return fail("Too many tries. Give it a minute, then try again.", raw);
    // One message for "no such account" and "wrong password", so this form can't be used to find who has an account.
    return fail("That email and password don't match. Signed up before passwords? Use Forgot password.", raw);
  }
  redirect("/");
}

export async function signUp(_: LoginState, formData: FormData): Promise<LoginState> {
  const { raw, email } = parse(formData);
  if (!email.success) return fail(email.error.issues[0].message, raw);
  const password = passwordSchema.safeParse(String(formData.get("password") ?? ""));
  if (!password.success) return fail(password.error.issues[0].message, raw);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.data,
    password: password.data,
    options: { emailRedirectTo: await confirmUrl() },
  });
  if (error) {
    if (error.code === "user_already_exists") return fail("That email already has an account. Sign in instead.", raw);
    if (error.status === 429) return fail("Too many tries. Give it a minute, then try again.", raw);
    if (error.code === "weak_password") return fail("Pick a stronger password: at least 8 characters.", raw);
    return fail("Couldn't create your account just now. Try again in a moment.", raw);
  }
  // With email confirmation on, an address that already has an account comes back with no identities and no email is
  // sent. This tells people so; it also means the form shows which emails are taken, which is fine for a beta.
  if (data.user && data.user.identities?.length === 0) return fail("That email already has an account. Sign in instead.", raw);
  if (data.session) redirect("/"); // email confirmation is off: they're already signed in
  return { status: "sent", email: email.data, kind: "confirm" };
}

export async function resendConfirm(_: LoginState, formData: FormData): Promise<LoginState> {
  const { raw, email } = parse(formData);
  if (!email.success) return fail(email.error.issues[0].message, raw);

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email: email.data, options: { emailRedirectTo: await confirmUrl() } });
  if (error?.status === 429) return fail("Too many tries. Give it a minute, then try again.", raw);
  return { status: "sent", email: email.data, kind: "confirm" };
}

export async function sendReset(_: LoginState, formData: FormData): Promise<LoginState> {
  const { raw, email } = parse(formData);
  if (!email.success) return fail(email.error.issues[0].message, raw);

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: await confirmUrl() });
  if (error?.status === 429) return fail("Too many tries. Give it a minute, then try again.", raw);
  // Same answer whether or not the address has an account.
  return { status: "sent", email: email.data, kind: "reset" };
}

// Sign in or sign up with Google (one flow: a new Google account goes on to onboarding). Supabase holds the
// Google client; the code it sends back to /auth/callback is swapped for a session there.
export async function signInWithGoogle() {
  const h = await headers();
  const origin = h.get("origin") ?? `http://${h.get("host")}`;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${origin}/auth/callback` } });
  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}
