"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Box,
  LayoutDashboard,
  Package,
  Settings,
  Truck,
  Users,
  LogOut,
  Bell,
} from "lucide-react"

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

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
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

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
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
              {data.secondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.enabled ? (
                    <SidebarMenuButton asChild size="sm" tooltip={item.title}>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
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
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Profile">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-slate-200">
                <Users className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="font-semibold">Patrick Mohr</span>
                <span className="text-xs">Admin</span>
              </div>
              <LogOut className="ml-auto size-4" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
