"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { yoloService, type DetectionResult } from "@/lib/yolo-detection"
import { createClient } from "@/lib/supabase/client"

interface CameraFeedProps {
  cameraId: string
  cameraName: string
  streamUrl?: string
  cameraType: "droidcam" | "frontend" | "fixed"
  locationId?: string
  onDetection?: (result: DetectionResult) => void
}

export function CameraFeed({ cameraId, cameraName, streamUrl, cameraType, locationId, onDetection }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [detectionResult, setDetectionResult] = useState<DetectionResult>({
    personCount: 0,
    confidence: 0,
    boundingBoxes: [],
  })
  const [isDetecting, setIsDetecting] = useState(false)
  const detectionIntervalRef = useRef<NodeJS.Timeout>()
  const supabase = createClient()

  const startCamera = async () => {
    if (!videoRef.current) return

    try {
      let stream: MediaStream

      if (cameraType === "frontend") {
        // Use device camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: "environment", // Use back camera if available
          },
        })
      } else if (cameraType === "droidcam" && streamUrl) {
        // For DroidCam, we'll use the stream URL
        videoRef.current.src = streamUrl
        videoRef.current.play()
        setIsStreaming(true)
        return
      } else {
        // Fixed camera with stream URL
        if (streamUrl) {
          videoRef.current.src = streamUrl
          videoRef.current.play()
          setIsStreaming(true)
          return
        } else {
          throw new Error("No stream URL provided for fixed camera")
        }
      }

      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setIsStreaming(true)
    } catch (error) {
      console.error("[v0] Failed to start camera:", error)
      alert("Failed to access camera. Please check permissions.")
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    if (videoRef.current?.src) {
      videoRef.current.src = ""
    }
    setIsStreaming(false)
    stopDetection()
  }

  const startDetection = async () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsDetecting(true)
    await yoloService.loadModel()

    // Set canvas size to match video
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    detectionIntervalRef.current = setInterval(async () => {
      if (video.readyState === 4) {
        // HAVE_ENOUGH_DATA
        const result = await yoloService.detectPersons(video)
        setDetectionResult(result)
        yoloService.drawDetections(canvas, result)

        // Store crowd data in database
        if (result.personCount > 0) {
          await storeCrowdData(result)
        }

        onDetection?.(result)
      }
    }, 2000) // Detect every 2 seconds
  }

  const stopDetection = () => {
    setIsDetecting(false)
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }

  const storeCrowdData = async (result: DetectionResult) => {
    try {
      const { error } = await supabase.from("crowd_data").insert({
        camera_id: cameraId,
        location_id: locationId,
        person_count: result.personCount,
        confidence_score: result.confidence,
        metadata: {
          bounding_boxes: result.boundingBoxes,
          detection_timestamp: new Date().toISOString(),
        },
      })

      if (error) {
        console.error("[v0] Failed to store crowd data:", error)
      }
    } catch (error) {
      console.error("[v0] Error storing crowd data:", error)
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{cameraName}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={isStreaming ? "default" : "secondary"}>{isStreaming ? "Live" : "Offline"}</Badge>
            <Badge variant="outline" className="capitalize">
              {cameraType}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video ref={videoRef} className="w-full h-64 object-cover" muted playsInline />
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
          {!isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
              <div className="text-center text-white">
                <svg
                  className="w-12 h-12 mx-auto mb-2 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm opacity-75">Camera Offline</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {!isStreaming ? (
              <Button onClick={startCamera} size="sm">
                Start Camera
              </Button>
            ) : (
              <Button onClick={stopCamera} variant="outline" size="sm">
                Stop Camera
              </Button>
            )}

            {isStreaming &&
              (!isDetecting ? (
                <Button onClick={startDetection} size="sm" className="bg-green-600 hover:bg-green-700">
                  Start Detection
                </Button>
              ) : (
                <Button onClick={stopDetection} variant="outline" size="sm">
                  Stop Detection
                </Button>
              ))}
          </div>

          {isDetecting && (
            <div className="text-right">
              <p className="text-sm font-medium">
                Persons: <span className="text-blue-600">{detectionResult.personCount}</span>
              </p>
              <p className="text-xs text-gray-500">Confidence: {Math.round(detectionResult.confidence * 100)}%</p>
            </div>
          )}
        </div>

        {cameraType === "droidcam" && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-700">
              <strong>DroidCam Setup:</strong> Install DroidCam on your phone and enter the IP address in camera
              settings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
