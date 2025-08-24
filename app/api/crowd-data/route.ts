import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const cameraId = searchParams.get("camera_id")
    const locationId = searchParams.get("location_id")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const hours = Number.parseInt(searchParams.get("hours") || "24")

    // Calculate time range
    const startTime = new Date()
    startTime.setHours(startTime.getHours() - hours)

    let query = supabase
      .from("crowd_data")
      .select(`
        *,
        cameras(name, camera_type),
        locations(name, area_type)
      `)
      .gte("timestamp", startTime.toISOString())
      .order("timestamp", { ascending: false })
      .limit(limit)

    if (cameraId) {
      query = query.eq("camera_id", cameraId)
    }

    if (locationId) {
      query = query.eq("location_id", locationId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to fetch crowd data" }, { status: 500 })
    }

    return NextResponse.json({ data, count: data?.length || 0 })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { camera_id, location_id, person_count, confidence_score, metadata } = body

    // Validate required fields
    if (!camera_id || person_count === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("crowd_data")
      .insert({
        camera_id,
        location_id,
        person_count,
        confidence_score: confidence_score || 0,
        metadata: metadata || {},
      })
      .select()

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to store crowd data" }, { status: 500 })
    }

    // Check if we need to trigger alerts based on crowd density
    await checkCrowdAlerts(supabase, camera_id, location_id, person_count)

    return NextResponse.json({ data: data[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function checkCrowdAlerts(supabase: any, cameraId: string, locationId: string, personCount: number) {
  try {
    // Get location capacity
    const { data: location } = await supabase.from("locations").select("capacity, name").eq("id", locationId).single()

    if (!location?.capacity) return

    const capacityPercentage = (personCount / location.capacity) * 100

    // Create alert if capacity exceeds thresholds
    let severity: "low" | "medium" | "high" | "critical" | null = null

    if (capacityPercentage >= 90) {
      severity = "critical"
    } else if (capacityPercentage >= 75) {
      severity = "high"
    } else if (capacityPercentage >= 60) {
      severity = "medium"
    }

    if (severity) {
      // Check if there's already an active alert for this location
      const { data: existingAlert } = await supabase
        .from("alerts")
        .select("id")
        .eq("location_id", locationId)
        .eq("status", "active")
        .eq("triggered_by", "crowd_density")
        .single()

      if (!existingAlert) {
        await supabase.from("alerts").insert({
          title: `High Crowd Density at ${location.name}`,
          description: `Crowd capacity at ${Math.round(capacityPercentage)}% (${personCount}/${location.capacity} people)`,
          severity,
          location_id: locationId,
          camera_id: cameraId,
          triggered_by: "crowd_density",
          crowd_count: personCount,
        })
      }
    }
  } catch (error) {
    console.error("[v0] Alert check error:", error)
  }
}
