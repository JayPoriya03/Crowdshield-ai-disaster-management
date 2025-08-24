"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Alert {
  id: string
  title: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  status: "active" | "resolved" | "investigating"
  created_at: string
  resolved_at?: string
  locations?: { name: string }
  cameras?: { name: string }
  crowd_count?: number
}

interface Location {
  id: string
  name: string
}

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingAlert, setIsCreatingAlert] = useState(false)
  const [newAlert, setNewAlert] = useState({
    title: "",
    description: "",
    severity: "medium" as const,
    location_id: "",
  })

  useEffect(() => {
    fetchAlerts()
    fetchLocations()
    const interval = setInterval(fetchAlerts, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/alerts?limit=20")
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.data || [])
      }
    } catch (error) {
      console.error("[v0] Failed to fetch alerts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/locations")
      if (response.ok) {
        const data = await response.json()
        setLocations(data.data || [])
      }
    } catch (error) {
      console.error("[v0] Failed to fetch locations:", error)
    }
  }

  const createAlert = async () => {
    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAlert),
      })

      if (response.ok) {
        setNewAlert({ title: "", description: "", severity: "medium", location_id: "" })
        setIsCreatingAlert(false)
        fetchAlerts()
      }
    } catch (error) {
      console.error("[v0] Failed to create alert:", error)
    }
  }

  const updateAlertStatus = async (alertId: string, status: Alert["status"]) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        fetchAlerts()
      }
    } catch (error) {
      console.error("[v0] Failed to update alert:", error)
    }
  }

  const getSeverityColor = (severity: Alert["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: Alert["status"]) => {
    switch (status) {
      case "active":
        return "bg-red-100 text-red-800"
      case "investigating":
        return "bg-yellow-100 text-yellow-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Active Alerts</CardTitle>
          <Dialog open={isCreatingAlert} onOpenChange={setIsCreatingAlert}>
            <DialogTrigger asChild>
              <Button size="sm">Create Alert</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Alert</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="alert-title">Title</Label>
                  <Input
                    id="alert-title"
                    placeholder="Alert title"
                    value={newAlert.title}
                    onChange={(e) => setNewAlert((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alert-description">Description</Label>
                  <Textarea
                    id="alert-description"
                    placeholder="Detailed description of the alert"
                    value={newAlert.description}
                    onChange={(e) => setNewAlert((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="alert-severity">Severity</Label>
                    <Select
                      value={newAlert.severity}
                      onValueChange={(value: any) => setNewAlert((prev) => ({ ...prev, severity: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alert-location">Location</Label>
                    <Select
                      value={newAlert.location_id}
                      onValueChange={(value) => setNewAlert((prev) => ({ ...prev, location_id: value }))}
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
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreatingAlert(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createAlert} disabled={!newAlert.title || !newAlert.description}>
                    Create Alert
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-600">No active alerts</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {alerts.map((alert) => (
              <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getSeverityColor(alert.severity)} variant="outline">
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(alert.status)}>{alert.status.toUpperCase()}</Badge>
                      {alert.locations && <Badge variant="outline">{alert.locations.name}</Badge>}
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{alert.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                    <div className="flex items-center text-xs text-gray-500 space-x-4">
                      <span>Created: {new Date(alert.created_at).toLocaleString()}</span>
                      {alert.crowd_count && <span>Crowd: {alert.crowd_count} people</span>}
                    </div>
                  </div>
                </div>

                {alert.status === "active" && (
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => updateAlertStatus(alert.id, "investigating")}>
                      Investigate
                    </Button>
                    <Button size="sm" onClick={() => updateAlertStatus(alert.id, "resolved")}>
                      Resolve
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
