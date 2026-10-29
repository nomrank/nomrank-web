import type { Metadata } from "next";
import { AdminShell } from "../shell";
import { AdminLogin } from "./admin-login";

export const metadata: Metadata = { title: "Sign in · Nomrank Admin", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <AdminShell signedIn={false}>
      <AdminLogin />
    </AdminShell>
  );
}
