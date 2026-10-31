import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminShell } from "../shell";
import { AdminLogin } from "./admin-login";

export const metadata: Metadata = { title: "Sign in · Nomrank Admin", robots: { index: false } };

const NOTICES: Record<string, string> = {
  google: "Google sign-in didn't finish. Try again.",
  link: "That sign-in link expired. Try again.",
  "not-admin": "That account isn't an admin. Admin access is by invitation from the superadmin.",
};

export default function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <AdminShell signedIn={false}>
      <Suspense fallback={<AdminLogin />}>
        <Login searchParams={searchParams} />
      </Suspense>
    </AdminShell>
  );
}

// The address says why they're back here (a cancelled Google sign-in, an account that isn't an admin).
async function Login({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  const { error } = await searchParams;
  return <AdminLogin notice={typeof error === "string" ? NOTICES[error] : undefined} />;
}
