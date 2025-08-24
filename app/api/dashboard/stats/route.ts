import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current stats
    const [camerasResult, crowdResult, alertsResult, locationsResult] = await Promise.all([
      // Active cameras count
      supabase
        .from("cameras")
        .select("id", { count: "exact" })
        .eq("status", "online"),

      // Current crowd count (last hour)
      supabase
        .from("crowd_data")
        .select("person_count")
        .gte("timestamp", new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order("timestamp", { ascending: false })
        .limit(50),

      // Active alerts count
      supabase
        .from("alerts")
        .select("id", { count: "exact" })
        .eq("status", "active"),

      // Total locations and capacity
      supabase
        .from("locations")
        .select("capacity"),
    ])

    const stats = {
      activeCameras: camerasResult.count || 0,
      currentCrowd: 0,
      activeAlerts: alertsResult.count || 0,
      capacityUsage: 0,
      totalCapacity: 0,
    }

    // Calculate current crowd (average of recent readings)
    if (crowdResult.data && crowdResult.data.length > 0) {
      const recentCrowdCounts = crowdResult.data.map((d) => d.person_count)
      stats.currentCrowd = Math.round(recentCrowdCounts.reduce((a, b) => a + b, 0) / recentCrowdCounts.length)
    }

    // Calculate total capacity and usage
    if (locationsResult.data) {
      stats.totalCapacity = locationsResult.data.reduce((sum, loc) => sum + (loc.capacity || 0), 0)
      if (stats.totalCapacity > 0) {
        stats.capacityUsage = Math.round((stats.currentCrowd / stats.totalCapacity) * 100)
      }
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
