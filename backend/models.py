from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Enum as SQLEnum
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class PlaceStatus(str, Enum):
    """Status of a place submission."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Place(Base):
    """Model for storing place submissions."""
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)

    # Basic info (from submission)
    name = Column(String(255), nullable=False, index=True)
    location = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=False, default="United States of America")
    notes = Column(Text, nullable=True)
    type2 = Column(String(50), nullable=True)  # Category: coffee, food, books, etc.

    # Google Places enriched data
    address = Column(String(500), nullable=True)
    rating = Column(Float, nullable=True)
    user_ratings_total = Column(Integer, nullable=True)
    google_maps_link = Column(String(500), nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    opening_hours = Column(Text, nullable=True)
    type = Column(String(100), nullable=True)  # Google place type
    google_place_id = Column(String(255), nullable=True, unique=True)

    # Admin fields
    status = Column(SQLEnum(PlaceStatus), default=PlaceStatus.PENDING, index=True)
    creators_rec = Column(String(10), nullable=True)  # "Yes" or null

    # Metadata
    submitted_by = Column(String(255), nullable=True)  # Email or name
    submitted_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(String(255), nullable=True)

    def to_export_dict(self) -> dict:
        """Convert to dictionary format matching master_data.json structure."""
        return {
            "name": self.name,
            "location": self.location,
            "city": self.city,
            "state": self.state,
            "country": self.country,
            "notes": self.notes,
            "address": self.address,
            "rating": self.rating,
            "user_ratings_total": self.user_ratings_total,
            "google_maps_link": self.google_maps_link,
            "lat": self.lat,
            "lng": self.lng,
            "opening_hours": self.opening_hours,
            "type": self.type,
            "google_place_id": self.google_place_id,
            "type2": self.type2,
            "creators_rec": self.creators_rec,
        }
