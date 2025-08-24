import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, stream_url, latitude, longitude } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (stream_url !== undefined) updateData.stream_url = stream_url
    if (latitude !== undefined) updateData.latitude = latitude
    if (longitude !== undefined) updateData.longitude = longitude

    const { data, error } = await supabase.from("cameras").update(updateData).eq("id", params.id).select()

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to update camera" }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Camera not found" }, { status: 404 })
    }

    return NextResponse.json({ data: data[0] })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase.from("cameras").delete().eq("id", params.id)

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to delete camera" }, { status: 500 })
    }

    return NextResponse.json({ message: "Camera deleted successfully" })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
