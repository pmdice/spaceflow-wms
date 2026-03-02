"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "~lib/auth-client";
import { Button } from "@/components/ui/button";
import { LogOut, Shield } from "lucide-react";

export function DashboardAuthBar() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  if (isPending || !session) {
    return null;
  }

  const user = session.user as { email?: string; name?: string; role?: string };
  const displayName = user?.name || user?.email || "User";
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-600">
        Welcome, <span className="font-medium text-zinc-900">{displayName}</span>
      </span>
      {isAdmin && (
        <Button asChild variant="outline" size="sm" className="h-8 gap-1.5">
          <Link href="/admin">
            <Shield className="size-3.5" />
            Admin Panel
          </Link>
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="h-8 gap-1.5 text-zinc-600 hover:text-zinc-900"
      >
        <LogOut className="size-3.5" />
        Log out
      </Button>
    </div>
  );
}
