"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Box,
  LayoutDashboard,
  Package,
  Settings,
  Truck,
  Users,
  LogOut,
  Bell,
  Shield,
} from "lucide-react"
import { authClient } from "~lib/auth-client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

function formatRole(role?: string) {
  if (!role) return "User"
  if (role === "ADMIN") return "Admin"
  if (role === "MANAGER") return "Manager"
  if (role === "PICKER") return "Picker"
  return role
}

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      enabled: true,
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: Package,
      enabled: true,
    },
    {
      title: "Shipments",
      url: "#",
      icon: Truck,
      enabled: false,
    },
    {
      title: "Staff",
      url: "#",
      icon: Users,
      enabled: false,
    },
  ],
  secondary: [
    {
      title: "Admin Panel",
      url: "/admin",
      icon: Shield,
      enabled: false,
      adminOnly: true,
    },
    {
      title: "Notifications",
      url: "#",
      icon: Bell,
      enabled: false,
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings,
      enabled: false,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/login")
  }

  const user = session?.user as { email?: string; name?: string; role?: string } | undefined
  const displayName = user?.name || user?.email || "User"
  const roleLabel = formatRole(user?.role)
  const isAdmin = user?.role === "ADMIN"

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#BC804C] text-white">
                  <Box className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="font-semibold text-[#2D2D2D]">SpaceFlow</span>
                  <span className="text-xs text-[#666666]">WMS Portal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.enabled ? (
                    <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url}>
                      <Link href={item.url}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      tooltip={`${item.title} (coming soon)`}
                      aria-disabled="true"
                      className="cursor-not-allowed opacity-45 hover:bg-transparent hover:text-sidebar-foreground"
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {data.secondary
                .filter((item) => !("adminOnly" in item && item.adminOnly) || isAdmin)
                .map((item) => {
                  const isAdminOnly = "adminOnly" in item && item.adminOnly
                  const enabled = item.enabled || (isAdminOnly && isAdmin)
                  return (
                    <SidebarMenuItem key={item.title}>
                      {enabled ? (
                        <SidebarMenuButton asChild size="sm" tooltip={item.title}>
                          <Link href={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          size="sm"
                          tooltip={`${item.title} (coming soon)`}
                          aria-disabled="true"
                          className="cursor-not-allowed opacity-45 hover:bg-transparent hover:text-sidebar-foreground"
                        >
                          <item.icon />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  )
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="sm"
              tooltip={`Signed in as ${displayName} (${roleLabel})`}
              className="cursor-default hover:bg-transparent"
            >
              <Users className="size-4 shrink-0" />
              <span>{isPending ? "…" : `${displayName} · ${roleLabel}`}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" tooltip="Logout" onClick={handleSignOut}>
              <LogOut className="size-4 shrink-0" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
