import { Outlet, createFileRoute, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { cn } from "@workerSmtp/ui/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarItem,
  useSidebar,
} from "@workerSmtp/ui/components/sidebar";
import { Button } from "@workerSmtp/ui/components/button";
import {
  ActivityIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  KeyIcon,
  LogOutIcon,
  MenuIcon,
  ServerIcon,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { ModeToggle } from "@/components/mode-toggle";

const NAV_ITEMS = [
  { to: "/deliveries", label: "Deliveries", icon: ActivityIcon },
  { to: "/templates", label: "Templates", icon: FileTextIcon },
  { to: "/profiles", label: "SMTP Profiles", icon: ServerIcon },
  { to: "/api-keys", label: "API Keys", icon: KeyIcon },
  { to: "/docs", label: "Docs", icon: BookOpenIcon },
] as const;

export const Route = createFileRoute("/_auth/_admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const sidebar = useSidebar();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: session } = authClient.useSession();

  const sidebarW = sidebar.collapsed ? "56px" : "256px";

  return (
    <div className="flex min-h-svh" style={{ "--sidebar-w": sidebarW } as React.CSSProperties}>
      <Sidebar open={sidebar.open} collapsed={sidebar.collapsed} onClick={sidebar.close}>
          <SidebarHeader className={sidebar.collapsed ? "items-center py-3" : ""}>
            <div className={`flex items-center ${sidebar.collapsed ? "justify-center" : "gap-3"}`}>
              <img src="/Worker_SMTP_light.png" alt="Logo" className="size-8 shrink-0 dark:hidden" />
              <img src="/Worker_SMTP_dark.png" alt="Logo" className="size-8 shrink-0 hidden dark:block" />
              {!sidebar.collapsed && (
                <div className="min-w-0">
                  <div className="text-sm font-bold leading-tight" style={{ fontFamily: "var(--font-heading)" }}><span className="text-orange-500">worker</span> SMTP</div>
                  <div className="text-[10px] text-sidebar-foreground/40 font-medium leading-tight mt-0.5">Mail Dispatch</div>
                </div>
              )}
            </div>
          </SidebarHeader>
        <SidebarContent>
          {NAV_ITEMS.map(({ to, label, icon: Icon }, i) => (
            <Link key={to} to={to} onClick={sidebar.close}>
              <SidebarItem
                active={pathname.startsWith(to)}
                icon={<Icon />}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {!sidebar.collapsed && label}
              </SidebarItem>
            </Link>
          ))}
        </SidebarContent>
        {!sidebar.collapsed && session?.user && (
          <div className="border-t border-sidebar-border px-4 py-2.5 mt-auto">
            <span className="text-xs text-sidebar-foreground/60 truncate block">
              {session.user.name ?? session.user.email}
            </span>
          </div>
        )}
      </Sidebar>
      <main className="flex-1 w-full min-h-svh lg:ml-[var(--sidebar-w)] transition-[margin-left] duration-200 ease-out flex flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 h-14 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={sidebar.toggle}
              className="lg:hidden text-muted-foreground"
            >
              <MenuIcon className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={sidebar.toggleCollapse}
              className="max-lg:hidden text-muted-foreground"
            >
              <ChevronLeftIcon className={cn("size-4 transition-[transform] duration-200 ease-out", sidebar.collapsed && "rotate-180")} />
            </Button>
            <div className="flex items-center gap-1.5 text-sm ml-2">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
              {NAV_ITEMS.filter((i) => pathname.startsWith(i.to)).map((item) => (
                <span key={item.to} className="flex items-center gap-1.5">
                  <ChevronRightIcon className="size-3 text-muted-foreground/50" />
                  <span className="font-semibold text-foreground">{item.label}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ModeToggle />
            {session?.user && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {(session.user.name ?? session.user.email ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground hidden sm:inline">
                    {session.user.name ?? session.user.email}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    authClient.signOut({
                      fetchOptions: { onSuccess: () => navigate({ to: "/login" }) },
                    })
                  }
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOutIcon className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </header>
        <div className="flex-1 px-5 py-5 lg:px-7 lg:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
