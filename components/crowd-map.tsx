"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Camera, AlertTriangle, RefreshCw } from "lucide-react"
import { GoogleMapsService } from "@/lib/google-maps-api"

interface CameraLocation {
  id: string
  name: string
  lat: number
  lng: number
  crowd_count: number
  status: "active" | "inactive"
  density_level: "low" | "medium" | "high" | "critical"
}

interface PlaceMarker {
  place_id: string
  name: string
  lat: number
  lng: number
  type: string
  rating?: number
}

export function CrowdMap() {
  const [cameraLocations, setCameraLocations] = useState<CameraLocation[]>([])
  const [places, setPlaces] = useState<PlaceMarker[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCamera, setSelectedCamera] = useState<CameraLocation | null>(null)

  useEffect(() => {
    loadMapData()
  }, [])

  const loadMapData = async () => {
    setLoading(true)
    try {
      // Load camera locations (mock data for now)
      const mockCameras: CameraLocation[] = [
        {
          id: "cam_001",
          name: "Ram Kund Main Entrance",
          lat: 19.9975,
          lng: 73.7873,
          crowd_count: 245,
          status: "active",
          density_level: "high",
        },
        {
          id: "cam_002",
          name: "Panchavati Ghat",
          lat: 19.9985,
          lng: 73.7883,
          crowd_count: 89,
          status: "active",
          density_level: "medium",
        },
        {
          id: "cam_003",
          name: "Sita Gumpha Area",
          lat: 19.9965,
          lng: 73.7863,
          crowd_count: 156,
          status: "active",
          density_level: "medium",
        },
        {
          id: "cam_004",
          name: "Parking Area 1",
          lat: 19.9945,
          lng: 73.7853,
          crowd_count: 67,
          status: "active",
          density_level: "low",
        },
        {
          id: "cam_005",
          name: "Police Station View",
          lat: 19.9955,
          lng: 73.7893,
          crowd_count: 23,
          status: "active",
          density_level: "low",
        },
      ]

      setCameraLocations(mockCameras)

      // Load nearby places using Google Maps API
      const nearbyPlaces = await GoogleMapsService.getNearbyPlaces()
      const placeMarkers: PlaceMarker[] = nearbyPlaces.map((place) => ({
        place_id: place.place_id,
        name: place.name,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        type: place.types[0] || "establishment",
        rating: place.rating,
      }))

      setPlaces(placeMarkers)
    } catch (error) {
      console.error("Error loading map data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDensityColor = (level: string) => {
    switch (level) {
      case "low":
        return "bg-green-500"
      case "medium":
        return "bg-yellow-500"
      case "high":
        return "bg-orange-500"
      case "critical":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPlaceIcon = (type: string) => {
    switch (type) {
      case "hindu_temple":
      case "place_of_worship":
        return "🕉️"
      case "police":
        return "👮"
      case "parking":
        return "🅿️"
      case "tourist_attraction":
        return "🏛️"
      default:
        return "📍"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Crowd Map - Ram Kund Area
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Crowd Map - Ram Kund Area
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadMapData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {/* Map Container */}
          <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-6 min-h-96 border-2 border-blue-200">
            {/* Map Title */}
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Nashik Kumbh 2027 - Ram Kund Monitoring</h3>
              <p className="text-sm text-gray-600">Real-time camera locations and crowd density</p>
            </div>

            {/* Camera Markers */}
            <div className="relative w-full h-80">
              {cameraLocations.map((camera, index) => (
                <div
                  key={camera.id}
                  className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110`}
                  style={{
                    left: `${20 + index * 15}%`,
                    top: `${30 + index * 10}%`,
                  }}
                  onClick={() => setSelectedCamera(camera)}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${getDensityColor(camera.density_level)} shadow-lg`}
                  >
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-md text-xs whitespace-nowrap">
                    {camera.name}
                    <div className="font-semibold">{camera.crowd_count} people</div>
                  </div>
                  {camera.density_level === "critical" && (
                    <AlertTriangle className="absolute -top-2 -right-2 h-4 w-4 text-red-600 animate-pulse" />
                  )}
                </div>
              ))}

              {/* Place Markers */}
              {places.slice(0, 5).map((place, index) => (
                <div
                  key={place.place_id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${60 + index * 8}%`,
                    top: `${20 + index * 12}%`,
                  }}
                >
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs shadow-md">
                    {getPlaceIcon(place.type)}
                  </div>
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-blue-100 px-2 py-1 rounded text-xs whitespace-nowrap">
                    {place.name}
                  </div>
                </div>
              ))}

              {/* Ram Kund Center Marker */}
              <div className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: "50%", top: "50%" }}>
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div className="absolute top-14 left-1/2 transform -translate-x-1/2 bg-red-100 px-3 py-2 rounded-lg text-sm font-semibold">
                  Ram Kund Main
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex justify-center">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-sm font-semibold mb-2">Legend</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-xs">Low Density (0-50)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs">Medium Density (51-100)</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                      <span className="text-xs">High Density (101-200)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span className="text-xs">Critical (200+)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Camera Details Panel */}
      {selectedCamera && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Camera Details: {selectedCamera.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{selectedCamera.crowd_count}</div>
                <div className="text-sm text-blue-600">Current Crowd Count</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${selectedCamera.status === "active" ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <div className="text-lg font-semibold capitalize">{selectedCamera.status}</div>
                </div>
                <div className="text-sm text-gray-600">Camera Status</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <Badge
                  variant="outline"
                  className={`${selectedCamera.density_level === "critical" ? "border-red-500 text-red-700" : ""}`}
                >
                  {selectedCamera.density_level.toUpperCase()}
                </Badge>
                <div className="text-sm text-gray-600 mt-1">Density Level</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => setSelectedCamera(null)}>
                Close Details
              </Button>
              <Button size="sm" variant="outline">
                View Camera Feed
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nearby Places */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Nearby Important Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {places.slice(0, 6).map((place) => (
              <div key={place.place_id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mr-3">{getPlaceIcon(place.type)}</div>
                <div>
                  <div className="font-medium">{place.name}</div>
                  <div className="text-sm text-gray-600 capitalize">{place.type.replace("_", " ")}</div>
                  {place.rating && <div className="text-xs text-yellow-600">★ {place.rating}</div>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
