"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Camera, BarChart3, Shield, Users, Map } from "lucide-react"

const navigation = [
  { name: "Overview", href: "/dashboard", icon: BarChart3 },
  { name: "Cameras", href: "/dashboard/cameras", icon: Camera },
  { name: "Heat Map", href: "/dashboard/heat-map", icon: Users },
  { name: "Maps", href: "/dashboard/maps", icon: Map },
  { name: "Admin", href: "/dashboard/admin", icon: Shield, adminOnly: true },
]

interface DashboardNavigationProps {
  userRole?: string
}

export function DashboardNavigation({ userRole }: DashboardNavigationProps) {
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navigation.map((item) => {
            if (item.adminOnly && userRole !== "admin") return null

            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                )}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
