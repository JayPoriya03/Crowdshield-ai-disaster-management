"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertTriangle, Users, Camera } from "lucide-react"

interface HeatMapData {
  location_id: string
  location_name: string
  crowd_count: number
  density_level: "low" | "medium" | "high" | "critical"
  last_updated: string
  camera_count: number
  x_position: number
  y_position: number
}

interface HeatMapProps {
  autoRefresh?: boolean
  refreshInterval?: number
}

export function HeatMap({ autoRefresh = true, refreshInterval = 5000 }: HeatMapProps) {
  const [heatMapData, setHeatMapData] = useState<HeatMapData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchHeatMapData = async () => {
    try {
      const response = await fetch("/api/heat-map")
      if (response.ok) {
        const data = await response.json()
        setHeatMapData(data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error("Failed to fetch heat map data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHeatMapData()

    if (autoRefresh) {
      const interval = setInterval(fetchHeatMapData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

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

  const getDensityTextColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-700"
      case "medium":
        return "text-yellow-700"
      case "high":
        return "text-orange-700"
      case "critical":
        return "text-red-700"
      default:
        return "text-gray-700"
    }
  }

  const getTotalCrowdCount = () => {
    return heatMapData.reduce((total, location) => total + location.crowd_count, 0)
  }

  const getCriticalLocations = () => {
    return heatMapData.filter((location) => location.density_level === "critical")
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Real-time Heat Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Heat Map Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Real-time Heat Map - Nashik Kumbh 2027
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Badge>
            <Button variant="outline" size="sm" onClick={fetchHeatMapData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{getTotalCrowdCount().toLocaleString()}</div>
              <div className="text-sm text-blue-600">Total Crowd Count</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-700">{heatMapData.length}</div>
              <div className="text-sm text-orange-600">Active Locations</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-700">{getCriticalLocations().length}</div>
              <div className="text-sm text-red-600">Critical Areas</div>
            </div>
          </div>

          {/* Heat Map Grid */}
          <div className="relative bg-gray-100 rounded-lg p-6 min-h-96">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg opacity-50"></div>
            <div className="relative">
              <h3 className="text-lg font-semibold mb-4 text-center">Ram Kund Area - Live Crowd Density</h3>

              {/* Heat Map Visualization */}
              <div className="grid grid-cols-4 gap-4 max-w-4xl mx-auto">
                {heatMapData.map((location) => (
                  <div
                    key={location.location_id}
                    className={`relative p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${getDensityColor(location.density_level)} bg-opacity-20 border-opacity-50`}
                    style={{
                      borderColor:
                        location.density_level === "critical"
                          ? "#ef4444"
                          : location.density_level === "high"
                            ? "#f97316"
                            : location.density_level === "medium"
                              ? "#eab308"
                              : "#22c55e",
                    }}
                  >
                    {location.density_level === "critical" && (
                      <AlertTriangle className="absolute top-2 right-2 h-4 w-4 text-red-600" />
                    )}

                    <div className="text-center">
                      <div className="font-semibold text-sm mb-1">{location.location_name}</div>
                      <div className="text-2xl font-bold mb-1">{location.crowd_count}</div>
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-600 mb-2">
                        <Camera className="h-3 w-3" />
                        {location.camera_count} cameras
                      </div>
                      <Badge variant="outline" className={`text-xs ${getDensityTextColor(location.density_level)}`}>
                        {location.density_level.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-6 flex justify-center">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm font-semibold mb-2">Density Levels</div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-xs">Low (0-50)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span className="text-xs">Medium (51-100)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-500 rounded"></div>
                      <span className="text-xs">High (101-200)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-xs">Critical (200+)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {getCriticalLocations().length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Critical Density Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getCriticalLocations().map((location) => (
                <div key={location.location_id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <div className="font-semibold">{location.location_name}</div>
                    <div className="text-sm text-gray-600">
                      {location.crowd_count} people detected • {location.camera_count} cameras active
                    </div>
                  </div>
                  <Badge variant="destructive">CRITICAL</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
