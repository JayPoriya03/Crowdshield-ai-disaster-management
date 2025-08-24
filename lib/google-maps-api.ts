interface LocationBias {
  circle: {
    center: { latitude: number; longitude: number }
    radius: number
  }
}

interface PlaceSearchRequest {
  input: string
  locationBias: LocationBias
  includedPrimaryTypes: string[]
  includedRegionCodes: string[]
  languageCode: string
  regionCode: string
  origin: { latitude: number; longitude: number }
  inputOffset: number
  includeQueryPredictions: boolean
  sessionToken: string
}

interface PlaceResult {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: { lat: number; lng: number }
  }
  types: string[]
  rating?: number
}

export class GoogleMapsService {
  private static readonly RAM_KUND_CENTER = { latitude: 19.9975, longitude: 73.7873 }
  private static readonly SEARCH_RADIUS = 2000 // 2km around Ram Kund

  static async searchRamKundArea(query = "Ram Kund Nashik"): Promise<PlaceResult[]> {
    try {
      const payload: PlaceSearchRequest = {
        input: query,
        locationBias: {
          circle: {
            center: this.RAM_KUND_CENTER,
            radius: this.SEARCH_RADIUS,
          },
        },
        includedPrimaryTypes: [], // empty to get all places
        includedRegionCodes: ["IN"],
        languageCode: "en",
        regionCode: "IN",
        origin: this.RAM_KUND_CENTER,
        inputOffset: 0,
        includeQueryPredictions: true,
        sessionToken: "",
      }

      const response = await fetch("/api/google-maps/places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.predictions || []
    } catch (error) {
      console.error("Error searching Ram Kund area:", error)
      return []
    }
  }

  static async getNearbyPlaces(types: string[] = []): Promise<PlaceResult[]> {
    const queries = [
      "temples near Ram Kund Nashik",
      "ghats near Ram Kund Nashik",
      "parking near Ram Kund Nashik",
      "police station near Ram Kund Nashik",
    ]

    const allResults: PlaceResult[] = []

    for (const query of queries) {
      const results = await this.searchRamKundArea(query)
      allResults.push(...results)
    }

    return allResults
  }

  static getRamKundCenter() {
    return this.RAM_KUND_CENTER
  }

  static getSearchRadius() {
    return this.SEARCH_RADIUS
  }
}
