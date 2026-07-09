import { createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    throw redirect({ to: "/deliveries" });
  },
  component: () => (
    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
      Redirecting...
    </div>
  ),
});
