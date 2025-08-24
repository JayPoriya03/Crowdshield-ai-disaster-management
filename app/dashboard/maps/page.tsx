import { CrowdMap } from "@/components/crowd-map"

export default function MapsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Live Crowd Map</h1>
        <p className="text-gray-600 mt-2">Real-time camera locations and crowd monitoring across Ram Kund area</p>
      </div>

      <CrowdMap />
    </div>
  )
}
