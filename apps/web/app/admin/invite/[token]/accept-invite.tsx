"use client";

import { useState, useTransition } from "react";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { acceptInvite } from "../../actions";

export function AcceptInvite({ token, email }: { token: string; email: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <div className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-5 lg:mt-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Become a Nomrank admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You&apos;re signed in as <span className="font-semibold wrap-anywhere text-foreground">{email}</span>. Accepting makes this account an admin.
        </p>
      </div>
      <Button
        type="button"
        size="xl"
        className="w-full"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await acceptInvite(token);
            if (result.error) setError(result.error);
            else window.location.replace("/"); // a full load, not a redirect()
          })
        }
      >
        {pending ? <Spinner data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
        Accept the invitation
      </Button>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
