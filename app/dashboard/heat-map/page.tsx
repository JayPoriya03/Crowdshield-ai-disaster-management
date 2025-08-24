import { HeatMap } from "@/components/heat-map"

export default function HeatMapPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Real-time Heat Map</h1>
        <p className="text-gray-600 mt-2">Live crowd density monitoring across Nashik Kumbh 2027 locations</p>
      </div>

      <HeatMap autoRefresh={true} refreshInterval={5000} />
    </div>
  )
}
