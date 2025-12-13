import httpx
from urllib.parse import quote_plus
from typing import Optional
from config import get_settings

settings = get_settings()

PLACES_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
PLACES_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"


class GooglePlacesClient:
    """Client for Google Places API."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.google_places_api_key
        self.client = httpx.AsyncClient(timeout=30.0)

    async def search_place(
        self,
        name: str,
        location: Optional[str],
        city: str,
        state: Optional[str],
        country: str,
    ) -> Optional[dict]:
        """
        Search for a place using the Google Places API.

        Returns enriched place data or None if not found.
        """
        if not self.api_key:
            return None

        # Construct search query
        query_parts = [name]
        if location:
            query_parts.append(location)
        query_parts.append(city)
        if state:
            query_parts.append(state)
        query_parts.append(country)
        query = " ".join(query_parts)

        try:
            # Search for the place
            response = await self.client.get(
                PLACES_SEARCH_URL,
                params={
                    "query": query,
                    "key": self.api_key,
                },
            )
            response.raise_for_status()
            data = response.json()

            if not data.get("results"):
                return None

            result = data["results"][0]
            place_id = result.get("place_id")

            # Get detailed info
            details = await self._get_place_details(place_id) if place_id else {}

            # Extract coordinates
            geometry = result.get("geometry", {})
            location_data = geometry.get("location", {})

            # Build Google Maps link
            address = result.get("formatted_address", "")
            maps_link = (
                f"https://www.google.com/maps/search/?api=1"
                f"&query={quote_plus(address)}"
                f"&query_place_id={place_id}"
            )

            # Format opening hours
            opening_hours = None
            if details.get("current_opening_hours", {}).get("weekday_text"):
                opening_hours = "\n ".join(
                    details["current_opening_hours"]["weekday_text"]
                )

            return {
                "address": address,
                "rating": result.get("rating"),
                "user_ratings_total": result.get("user_ratings_total"),
                "google_maps_link": maps_link,
                "lat": location_data.get("lat"),
                "lng": location_data.get("lng"),
                "opening_hours": opening_hours,
                "type": result.get("types", [None])[0],
                "google_place_id": place_id,
            }

        except httpx.HTTPError as e:
            print(f"Error searching for place: {e}")
            return None

    async def _get_place_details(self, place_id: str) -> dict:
        """Get detailed information about a place."""
        try:
            response = await self.client.get(
                PLACES_DETAILS_URL,
                params={
                    "place_id": place_id,
                    "fields": "current_opening_hours,website,formatted_phone_number",
                    "key": self.api_key,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data.get("result", {})
        except httpx.HTTPError:
            return {}

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Singleton instance
_client: Optional[GooglePlacesClient] = None


def get_places_client() -> GooglePlacesClient:
    """Get or create the Google Places client."""
    global _client
    if _client is None:
        _client = GooglePlacesClient()
    return _client
