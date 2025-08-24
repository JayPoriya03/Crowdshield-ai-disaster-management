import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    // Note: In production, you would use your actual RapidAPI key
    // For now, we'll return mock data based on the Ram Kund area
    const mockPlaces = [
      {
        place_id: "ram_kund_main",
        name: "Ram Kund",
        formatted_address: "Ram Kund, Nashik, Maharashtra 422003, India",
        geometry: { location: { lat: 19.9975, lng: 73.7873 } },
        types: ["hindu_temple", "place_of_worship", "establishment"],
        rating: 4.5,
      },
      {
        place_id: "panchavati_ghat",
        name: "Panchavati Ghat",
        formatted_address: "Panchavati, Nashik, Maharashtra, India",
        geometry: { location: { lat: 19.9985, lng: 73.7883 } },
        types: ["tourist_attraction", "establishment"],
        rating: 4.3,
      },
      {
        place_id: "sita_gumpha",
        name: "Sita Gumpha",
        formatted_address: "Panchavati, Nashik, Maharashtra, India",
        geometry: { location: { lat: 19.9965, lng: 73.7863 } },
        types: ["tourist_attraction", "establishment"],
        rating: 4.2,
      },
      {
        place_id: "nashik_police_station",
        name: "Nashik Police Station",
        formatted_address: "Police Station, Nashik, Maharashtra, India",
        geometry: { location: { lat: 19.9955, lng: 73.7893 } },
        types: ["police", "establishment"],
        rating: 3.8,
      },
      {
        place_id: "parking_area_1",
        name: "Ram Kund Parking Area",
        formatted_address: "Parking Area, Ram Kund, Nashik, Maharashtra, India",
        geometry: { location: { lat: 19.9945, lng: 73.7853 } },
        types: ["parking", "establishment"],
      },
    ]

    return NextResponse.json({
      predictions: mockPlaces,
      status: "OK",
    })
  } catch (error) {
    console.error("Google Maps API error:", error)
    return NextResponse.json({ error: "Failed to fetch places data" }, { status: 500 })
  }
}
