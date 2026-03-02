import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~lib/auth";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DashboardAuthBar } from "@/components/dashboard-auth-bar";
import { Shield, ArrowLeft, Box } from "lucide-react";

export default async function AdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const user = session.user as { role?: string };
  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <SidebarInset className="h-dvh bg-[#F4F4F5] overflow-hidden">
      <header className="flex h-16 shrink-0 items-center justify-between px-6 bg-white/75 backdrop-blur-xl border-b border-white/40">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-2 bg-white/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-white/50" />
          <Separator orientation="vertical" className="h-4 bg-gray-300" />
          <div className="flex items-center gap-2">
            <Box className="size-5 text-[#BC804C]" />
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">
              Admin Panel
            </h1>
          </div>
        </div>
        <DashboardAuthBar />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="size-16 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Shield className="size-8 text-amber-700" />
            </div>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">
            Administrator Area
          </h2>
          <p className="text-zinc-500 text-sm">
            This area is restricted to administrators. Add your admin-specific
            features here.
          </p>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </main>
    </SidebarInset>
  );
}
