import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const locationId = searchParams.get("location_id")
    const hours = Number.parseInt(searchParams.get("hours") || "24")

    const startTime = new Date()
    startTime.setHours(startTime.getHours() - hours)

    // Get crowd analytics
    let query = supabase
      .from("crowd_data")
      .select(`
        person_count,
        timestamp,
        locations(name, capacity, area_type),
        cameras(name)
      `)
      .gte("timestamp", startTime.toISOString())

    if (locationId) {
      query = query.eq("location_id", locationId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
    }

    // Calculate analytics
    const analytics = {
      totalReadings: data?.length || 0,
      averageCrowd: 0,
      peakCrowd: 0,
      currentCrowd: 0,
      capacityUtilization: 0,
      hourlyData: [] as Array<{ hour: string; avgCrowd: number; peakCrowd: number }>,
      locationBreakdown: {} as Record<string, { avgCrowd: number; peakCrowd: number; capacity: number }>,
    }

    if (data && data.length > 0) {
      const crowdCounts = data.map((d) => d.person_count)
      analytics.averageCrowd = Math.round(crowdCounts.reduce((a, b) => a + b, 0) / crowdCounts.length)
      analytics.peakCrowd = Math.max(...crowdCounts)
      analytics.currentCrowd = data[0]?.person_count || 0

      // Calculate capacity utilization
      const totalCapacity = data.reduce((sum, d) => sum + (d.locations?.capacity || 0), 0)
      if (totalCapacity > 0) {
        analytics.capacityUtilization = Math.round((analytics.currentCrowd / totalCapacity) * 100)
      }

      // Hourly breakdown
      const hourlyMap = new Map<string, number[]>()
      data.forEach((d) => {
        const hour = new Date(d.timestamp).getHours().toString().padStart(2, "0") + ":00"
        if (!hourlyMap.has(hour)) {
          hourlyMap.set(hour, [])
        }
        hourlyMap.get(hour)!.push(d.person_count)
      })

      analytics.hourlyData = Array.from(hourlyMap.entries())
        .map(([hour, counts]) => ({
          hour,
          avgCrowd: Math.round(counts.reduce((a, b) => a + b, 0) / counts.length),
          peakCrowd: Math.max(...counts),
        }))
        .sort((a, b) => a.hour.localeCompare(b.hour))

      // Location breakdown
      const locationMap = new Map<string, { counts: number[]; capacity: number }>()
      data.forEach((d) => {
        const locationName = d.locations?.name || "Unknown"
        if (!locationMap.has(locationName)) {
          locationMap.set(locationName, { counts: [], capacity: d.locations?.capacity || 0 })
        }
        locationMap.get(locationName)!.counts.push(d.person_count)
      })

      analytics.locationBreakdown = Object.fromEntries(
        Array.from(locationMap.entries()).map(([name, data]) => [
          name,
          {
            avgCrowd: Math.round(data.counts.reduce((a, b) => a + b, 0) / data.counts.length),
            peakCrowd: Math.max(...data.counts),
            capacity: data.capacity,
          },
        ]),
      )
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
