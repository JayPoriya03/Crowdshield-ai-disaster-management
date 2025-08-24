// YOLO Detection Service for crowd counting
export interface DetectionResult {
  personCount: number
  confidence: number
  boundingBoxes: Array<{
    x: number
    y: number
    width: number
    height: number
    confidence: number
  }>
}

export class YOLODetectionService {
  private model: any = null
  private isLoading = false

  async loadModel() {
    if (this.model || this.isLoading) return

    this.isLoading = true
    try {
      // Using TensorFlow.js with COCO-SSD model for person detection
      const tf = await import("@tensorflow/tfjs")
      const cocoSsd = await import("@tensorflow-models/coco-ssd")

      await tf.ready()
      this.model = await cocoSsd.load()
      console.log("[v0] YOLO model loaded successfully")
    } catch (error) {
      console.error("[v0] Failed to load YOLO model:", error)
    } finally {
      this.isLoading = false
    }
  }

  async detectPersons(videoElement: HTMLVideoElement): Promise<DetectionResult> {
    if (!this.model) {
      await this.loadModel()
    }

    if (!this.model) {
      return { personCount: 0, confidence: 0, boundingBoxes: [] }
    }

    try {
      const predictions = await this.model.detect(videoElement)

      // Filter for person detections only
      const personDetections = predictions.filter(
        (prediction: any) => prediction.class === "person" && prediction.score > 0.5,
      )

      const boundingBoxes = personDetections.map((detection: any) => ({
        x: detection.bbox[0],
        y: detection.bbox[1],
        width: detection.bbox[2],
        height: detection.bbox[3],
        confidence: detection.score,
      }))

      const averageConfidence =
        personDetections.length > 0
          ? personDetections.reduce((sum: number, det: any) => sum + det.score, 0) / personDetections.length
          : 0

      return {
        personCount: personDetections.length,
        confidence: Math.round(averageConfidence * 100) / 100,
        boundingBoxes,
      }
    } catch (error) {
      console.error("[v0] Detection error:", error)
      return { personCount: 0, confidence: 0, boundingBoxes: [] }
    }
  }

  drawDetections(canvas: HTMLCanvasElement, detections: DetectionResult) {
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = "#00ff00"
    ctx.lineWidth = 2
    ctx.font = "16px Arial"
    ctx.fillStyle = "#00ff00"

    detections.boundingBoxes.forEach((box, index) => {
      ctx.strokeRect(box.x, box.y, box.width, box.height)
      ctx.fillText(`Person ${index + 1} (${Math.round(box.confidence * 100)}%)`, box.x, box.y - 5)
    })

    // Draw count summary
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(10, 10, 200, 60)
    ctx.fillStyle = "#000000"
    ctx.font = "18px Arial"
    ctx.fillText(`Persons Detected: ${detections.personCount}`, 20, 35)
    ctx.fillText(`Avg Confidence: ${Math.round(detections.confidence * 100)}%`, 20, 55)
  }
}

export const yoloService = new YOLODetectionService()
