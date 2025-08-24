import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const hours = Number.parseInt(searchParams.get("hours") || "1")

    const startTime = new Date()
    startTime.setHours(startTime.getHours() - hours)

    // Get recent crowd data with location coordinates
    const { data, error } = await supabase
      .from("crowd_data")
      .select(`
        person_count,
        timestamp,
        locations(latitude, longitude, name, capacity)
      `)
      .gte("timestamp", startTime.toISOString())
      .not("locations", "is", null)

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to fetch heat map data" }, { status: 500 })
    }

    // Process data for heat map
    const heatMapPoints = []
    const locationMap = new Map()

    if (data) {
      // Group by location and calculate average intensity
      data.forEach((item) => {
        const location = item.locations
        if (!location) return

        const key = `${location.latitude},${location.longitude}`
        if (!locationMap.has(key)) {
          locationMap.set(key, {
            latitude: location.latitude,
            longitude: location.longitude,
            name: location.name,
            capacity: location.capacity,
            crowdCounts: [],
          })
        }
        locationMap.get(key).crowdCounts.push(item.person_count)
      })

      // Calculate intensity for each location
      locationMap.forEach((locationData, key) => {
        const avgCrowd =
          locationData.crowdCounts.reduce((a: number, b: number) => a + b, 0) / locationData.crowdCounts.length
        const maxCrowd = Math.max(...locationData.crowdCounts)

        // Calculate intensity (0-100) based on capacity or relative to max crowd
        let intensity = 0
        if (locationData.capacity > 0) {
          intensity = Math.min((avgCrowd / locationData.capacity) * 100, 100)
        } else {
          // Use relative intensity if no capacity data
          intensity = Math.min((avgCrowd / 100) * 100, 100)
        }

        heatMapPoints.push({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          intensity: Math.round(intensity),
          name: locationData.name,
          avgCrowd: Math.round(avgCrowd),
          maxCrowd,
          capacity: locationData.capacity,
        })
      })
    }

    return NextResponse.json({
      heatMapPoints,
      timestamp: new Date().toISOString(),
      dataPoints: data?.length || 0,
    })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { location_id, latitude, longitude, intensity, source } = body

    // Validate required fields
    if (!latitude || !longitude || intensity === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("heat_map_data")
      .insert({
        location_id,
        latitude,
        longitude,
        intensity,
        source: source || "manual",
      })
      .select()

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to store heat map data" }, { status: 500 })
    }

    return NextResponse.json({ data: data[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
