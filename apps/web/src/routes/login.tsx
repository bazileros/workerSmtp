import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(true);
  const canSignUp = useQuery(orpc.canSignUp.queryOptions());

  if (canSignUp.isPending) {
    return (
      <div className="flex h-svh items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (canSignUp.data && !showSignIn) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center px-4">
        <img src="/Worker_SMTP_light.png" alt="Logo" className="size-20 mb-6 dark:hidden" />
        <img src="/Worker_SMTP_dark.png" alt="Logo" className="size-20 mb-6 hidden dark:block" />
        <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4">
      <img src="/Worker_SMTP_light.png" alt="Logo" className="size-20 mb-6 dark:hidden" />
      <img src="/Worker_SMTP_dark.png" alt="Logo" className="size-20 mb-6 hidden dark:block" />
      <SignInForm onSwitchToSignUp={canSignUp.data ? () => setShowSignIn(false) : undefined} />
    </div>
  );
}
