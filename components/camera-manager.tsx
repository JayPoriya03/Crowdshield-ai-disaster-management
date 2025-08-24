"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { CameraFeed } from "./camera-feed"

interface Camera {
  id: string
  name: string
  camera_type: "droidcam" | "frontend" | "fixed"
  status: "online" | "offline" | "maintenance"
  stream_url?: string
  location_id?: string
  latitude?: number
  longitude?: number
}

interface Location {
  id: string
  name: string
  latitude: number
  longitude: number
}

export function CameraManager() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [isAddingCamera, setIsAddingCamera] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)
  const [newCamera, setNewCamera] = useState({
    name: "",
    camera_type: "frontend" as const,
    stream_url: "",
    location_id: "",
    latitude: "",
    longitude: "",
  })
  const supabase = createClient()

  useEffect(() => {
    loadCameras()
    loadLocations()
  }, [])

  const initializeDatabase = async () => {
    setIsInitializing(true)
    setDbError(null)

    try {
      const response = await fetch("/api/init-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (result.success) {
        await loadCameras()
        await loadLocations()
        setDbError(null)
      } else {
        setDbError(result.error || "Failed to initialize database")
      }
    } catch (error) {
      console.error("[v0] Database initialization failed:", error)
      setDbError("Failed to initialize database")
    } finally {
      setIsInitializing(false)
    }
  }

  const loadCameras = async () => {
    try {
      const { data, error } = await supabase.from("cameras").select("*").order("created_at", { ascending: false })

      if (error) {
        if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
          setDbError("Database tables not found. Please initialize the database.")
          return
        }
        throw error
      }
      setCameras(data || [])
      setDbError(null)
    } catch (error) {
      console.error("[v0] Failed to load cameras:", error)
    }
  }

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase.from("locations").select("id, name, latitude, longitude").order("name")

      if (error) {
        if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
          return // Don't set error again, already handled in loadCameras
        }
        throw error
      }
      setLocations(data || [])
    } catch (error) {
      console.error("[v0] Failed to load locations:", error)
    }
  }

  const addCamera = async () => {
    try {
      const { error } = await supabase.from("cameras").insert({
        name: newCamera.name,
        camera_type: newCamera.camera_type,
        stream_url: newCamera.stream_url || null,
        location_id: newCamera.location_id || null,
        latitude: newCamera.latitude ? Number.parseFloat(newCamera.latitude) : null,
        longitude: newCamera.longitude ? Number.parseFloat(newCamera.longitude) : null,
        status: "offline",
      })

      if (error) throw error

      setNewCamera({
        name: "",
        camera_type: "frontend",
        stream_url: "",
        location_id: "",
        latitude: "",
        longitude: "",
      })
      setIsAddingCamera(false)
      loadCameras()
    } catch (error) {
      console.error("[v0] Failed to add camera:", error)
      alert("Failed to add camera. Please try again.")
    }
  }

  const updateCameraStatus = async (cameraId: string, status: Camera["status"]) => {
    try {
      const { error } = await supabase.from("cameras").update({ status }).eq("id", cameraId)

      if (error) throw error
      loadCameras()
    } catch (error) {
      console.error("[v0] Failed to update camera status:", error)
    }
  }

  const deleteCamera = async (cameraId: string) => {
    if (!confirm("Are you sure you want to delete this camera?")) return

    try {
      const { error } = await supabase.from("cameras").delete().eq("id", cameraId)

      if (error) throw error
      loadCameras()
    } catch (error) {
      console.error("[v0] Failed to delete camera:", error)
    }
  }

  if (dbError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Camera Management</h2>
        </div>

        <Alert>
          <AlertDescription>{dbError}</AlertDescription>
        </Alert>

        <Card>
          <CardContent className="text-center py-12">
            <svg className="mx-auto w-16 h-16 text-blue-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2.21 1.79 4 4 4h8c0 2.21 1.79 4 4 4h8a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Database Setup Required</h3>
            <p className="text-gray-600 mb-4">The database tables need to be created before you can manage cameras.</p>
            <Button onClick={initializeDatabase} disabled={isInitializing} className="bg-blue-600 hover:bg-blue-700">
              {isInitializing ? "Initializing..." : "Initialize Database"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Camera Management</h2>
        <Dialog open={isAddingCamera} onOpenChange={setIsAddingCamera}>
          <DialogTrigger asChild>
            <Button>Add Camera</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Camera</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="camera-name">Camera Name</Label>
                <Input
                  id="camera-name"
                  placeholder="e.g., Ram Kund Main View"
                  value={newCamera.name}
                  onChange={(e) => setNewCamera((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="camera-type">Camera Type</Label>
                <Select
                  value={newCamera.camera_type}
                  onValueChange={(value: any) => setNewCamera((prev) => ({ ...prev, camera_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frontend">Frontend Camera</SelectItem>
                    <SelectItem value="droidcam">DroidCam</SelectItem>
                    <SelectItem value="fixed">Fixed Camera</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(newCamera.camera_type === "droidcam" || newCamera.camera_type === "fixed") && (
                <div className="space-y-2">
                  <Label htmlFor="stream-url">Stream URL</Label>
                  <Input
                    id="stream-url"
                    placeholder="http://192.168.1.100:4747/video"
                    value={newCamera.stream_url}
                    onChange={(e) => setNewCamera((prev) => ({ ...prev, stream_url: e.target.value }))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select
                  value={newCamera.location_id}
                  onValueChange={(value) => setNewCamera((prev) => ({ ...prev, location_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    placeholder="19.9975"
                    value={newCamera.latitude}
                    onChange={(e) => setNewCamera((prev) => ({ ...prev, latitude: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    placeholder="73.7873"
                    value={newCamera.longitude}
                    onChange={(e) => setNewCamera((prev) => ({ ...prev, longitude: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddingCamera(false)}>
                  Cancel
                </Button>
                <Button onClick={addCamera} disabled={!newCamera.name}>
                  Add Camera
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cameras.map((camera) => (
          <div key={camera.id} className="space-y-4">
            <CameraFeed
              cameraId={camera.id}
              cameraName={camera.name}
              streamUrl={camera.stream_url}
              cameraType={camera.camera_type}
              locationId={camera.location_id}
              onDetection={(result) => {
                console.log(`[v0] Detection from ${camera.name}:`, result)
              }}
            />

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Camera Controls</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant={camera.status === "online" ? "default" : "secondary"} className="capitalize">
                        {camera.status}
                      </Badge>
                      {camera.latitude && camera.longitude && (
                        <Badge variant="outline">
                          {camera.latitude.toFixed(4)}, {camera.longitude.toFixed(4)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Select
                      value={camera.status}
                      onValueChange={(value: Camera["status"]) => updateCameraStatus(camera.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCamera(camera.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {cameras.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <svg className="mx-auto w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Cameras Added</h3>
            <p className="text-gray-600 mb-4">
              Add your first camera to start monitoring crowd density with AI detection.
            </p>
            <Button onClick={() => setIsAddingCamera(true)}>Add Your First Camera</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
