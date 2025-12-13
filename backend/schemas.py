from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr
from models import PlaceStatus


# Category types for submissions
PLACE_CATEGORIES = [
    "coffee",
    "food",
    "books",
    "nature",
    "art",
    "music",
    "shopping",
    "nightlife",
    "wellness",
    "others",
]


class PlaceSubmission(BaseModel):
    """Schema for submitting a new place."""
    name: str = Field(..., min_length=1, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    city: str = Field(..., min_length=1, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: str = Field(default="United States of America", max_length=100)
    notes: Optional[str] = Field(None, max_length=1000)
    type2: str = Field(..., description="Category of the place")
    submitted_by: Optional[str] = Field(None, max_length=255)

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Blue Bottle Coffee",
                "location": "Ferry Building",
                "city": "San Francisco",
                "state": "California",
                "country": "United States of America",
                "notes": "Great pour-over coffee with views of the bay.",
                "type2": "coffee",
                "submitted_by": "user@example.com",
            }
        }


class PlaceResponse(BaseModel):
    """Schema for place response."""
    id: int
    name: str
    location: Optional[str]
    city: str
    state: Optional[str]
    country: str
    notes: Optional[str]
    type2: Optional[str]
    address: Optional[str]
    rating: Optional[float]
    user_ratings_total: Optional[int]
    google_maps_link: Optional[str]
    lat: Optional[float]
    lng: Optional[float]
    opening_hours: Optional[str]
    type: Optional[str]
    google_place_id: Optional[str]
    status: PlaceStatus
    creators_rec: Optional[str]
    submitted_by: Optional[str]
    submitted_at: datetime
    reviewed_at: Optional[datetime]
    reviewed_by: Optional[str]

    class Config:
        from_attributes = True


class PlaceReview(BaseModel):
    """Schema for admin review action."""
    status: PlaceStatus
    creators_rec: Optional[bool] = Field(
        default=False,
        description="Set to true to mark as Creator's Recommendation"
    )
    reviewed_by: Optional[str] = None


class PlaceUpdate(BaseModel):
    """Schema for updating a place."""
    name: Optional[str] = Field(None, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=1000)
    type2: Optional[str] = None
    creators_rec: Optional[bool] = None


class ExportResponse(BaseModel):
    """Response for data export."""
    count: int
    places: list[dict]


class StatsResponse(BaseModel):
    """Response for statistics."""
    total: int
    pending: int
    approved: int
    rejected: int
    creators_rec_count: int
