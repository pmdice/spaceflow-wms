import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~lib/auth";
import { Button } from "@/components/ui/button";
import { Box } from "lucide-react";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-amber-50/30 p-4">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="flex justify-center">
          <div className="size-16 rounded-2xl bg-amber-100 flex items-center justify-center">
            <Box className="size-8 text-amber-700" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            SpaceFlow WMS
          </h1>
          <p className="text-zinc-500">
            Warehouse Management System with 2D/3D logistics views
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="h-11 px-6">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11 px-6">
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
