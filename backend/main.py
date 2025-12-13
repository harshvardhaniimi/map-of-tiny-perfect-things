import json
from datetime import datetime
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from database import init_db, get_db
from models import Place, PlaceStatus
from schemas import (
    PlaceSubmission,
    PlaceResponse,
    PlaceReview,
    PlaceUpdate,
    ExportResponse,
    StatsResponse,
    PLACE_CATEGORIES,
)
from google_places import get_places_client

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    await init_db()
    yield
    # Cleanup
    client = get_places_client()
    await client.close()


app = FastAPI(
    title="Map of Tiny Perfect Things API",
    description="Backend API for managing place submissions",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["*"],  # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_admin(authorization: str = Header(None)) -> bool:
    """Verify admin token from Authorization header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    # Expect "Bearer <token>" format
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    if parts[1] != settings.admin_token:
        raise HTTPException(status_code=403, detail="Invalid admin token")

    return True


# ============ Public Endpoints ============


@app.get("/")
async def root():
    """API root endpoint."""
    return {
        "name": "Map of Tiny Perfect Things API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/categories")
async def get_categories():
    """Get list of valid place categories."""
    return {"categories": PLACE_CATEGORIES}


@app.post("/places/submit", response_model=PlaceResponse)
async def submit_place(
    submission: PlaceSubmission,
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a new place for review.

    The place will be enriched with Google Places data if an API key is configured.
    Submitted places are pending until approved by an admin.
    """
    # Validate category
    if submission.type2 not in PLACE_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Must be one of: {', '.join(PLACE_CATEGORIES)}",
        )

    # Check for duplicate (same name + city)
    existing = await db.execute(
        select(Place).where(
            Place.name == submission.name,
            Place.city == submission.city,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="A place with this name already exists in this city",
        )

    # Create place record
    place = Place(
        name=submission.name,
        location=submission.location,
        city=submission.city,
        state=submission.state,
        country=submission.country,
        notes=submission.notes,
        type2=submission.type2,
        submitted_by=submission.submitted_by,
        status=PlaceStatus.PENDING,
    )

    # Enrich with Google Places data
    client = get_places_client()
    place_data = await client.search_place(
        name=submission.name,
        location=submission.location,
        city=submission.city,
        state=submission.state,
        country=submission.country,
    )

    if place_data:
        place.address = place_data.get("address")
        place.rating = place_data.get("rating")
        place.user_ratings_total = place_data.get("user_ratings_total")
        place.google_maps_link = place_data.get("google_maps_link")
        place.lat = place_data.get("lat")
        place.lng = place_data.get("lng")
        place.opening_hours = place_data.get("opening_hours")
        place.type = place_data.get("type")
        place.google_place_id = place_data.get("google_place_id")

    db.add(place)
    await db.commit()
    await db.refresh(place)

    return place


@app.get("/places/approved", response_model=list[PlaceResponse])
async def get_approved_places(
    city: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    creators_rec_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    """Get all approved places, optionally filtered."""
    query = select(Place).where(Place.status == PlaceStatus.APPROVED)

    if city:
        query = query.where(Place.city == city)
    if category:
        query = query.where(Place.type2 == category)
    if creators_rec_only:
        query = query.where(Place.creators_rec == "Yes")

    result = await db.execute(query)
    return result.scalars().all()


# ============ Admin Endpoints ============


@app.get("/admin/places", response_model=list[PlaceResponse])
async def admin_list_places(
    status: Optional[PlaceStatus] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin),
):
    """List all places, optionally filtered by status. Admin only."""
    query = select(Place).order_by(Place.submitted_at.desc())

    if status:
        query = query.where(Place.status == status)

    result = await db.execute(query)
    return result.scalars().all()


@app.get("/admin/places/{place_id}", response_model=PlaceResponse)
async def admin_get_place(
    place_id: int,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin),
):
    """Get a specific place by ID. Admin only."""
    result = await db.execute(select(Place).where(Place.id == place_id))
    place = result.scalar_one_or_none()

    if not place:
        raise HTTPException(status_code=404, detail="Place not found")

    return place


@app.post("/admin/places/{place_id}/review", response_model=PlaceResponse)
async def admin_review_place(
    place_id: int,
    review: PlaceReview,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin),
):
    """
    Review a place submission (approve/reject).

    Can also set creators_rec to mark as a Creator's Recommendation.
    """
    result = await db.execute(select(Place).where(Place.id == place_id))
    place = result.scalar_one_or_none()

    if not place:
        raise HTTPException(status_code=404, detail="Place not found")

    place.status = review.status
    place.reviewed_at = datetime.utcnow()
    place.reviewed_by = review.reviewed_by

    if review.creators_rec:
        place.creators_rec = "Yes"
    else:
        place.creators_rec = None

    await db.commit()
    await db.refresh(place)

    return place


@app.patch("/admin/places/{place_id}", response_model=PlaceResponse)
async def admin_update_place(
    place_id: int,
    update: PlaceUpdate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin),
):
    """Update a place's information. Admin only."""
    result = await db.execute(select(Place).where(Place.id == place_id))
    place = result.scalar_one_or_none()

    if not place:
        raise HTTPException(status_code=404, detail="Place not found")

    # Update fields if provided
    if update.name is not None:
        place.name = update.name
    if update.location is not None:
        place.location = update.location
    if update.city is not None:
        place.city = update.city
    if update.state is not None:
        place.state = update.state
    if update.country is not None:
        place.country = update.country
    if update.notes is not None:
        place.notes = update.notes
    if update.type2 is not None:
        place.type2 = update.type2
    if update.creators_rec is not None:
        place.creators_rec = "Yes" if update.creators_rec else None

    await db.commit()
    await db.refresh(place)

    return place


@app.delete("/admin/places/{place_id}")
async def admin_delete_place(
    place_id: int,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin),
):
    """Delete a place. Admin only."""
    result = await db.execute(select(Place).where(Place.id == place_id))
    place = result.scalar_one_or_none()

    if not place:
        raise HTTPException(status_code=404, detail="Place not found")

    await db.delete(place)
    await db.commit()

    return {"message": "Place deleted successfully"}


@app.post("/admin/places/{place_id}/enrich", response_model=PlaceResponse)
async def admin_enrich_place(
    place_id: int,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin),
):
    """Re-fetch Google Places data for a place. Admin only."""
    result = await db.execute(select(Place).where(Place.id == place_id))
    place = result.scalar_one_or_none()

    if not place:
        raise HTTPException(status_code=404, detail="Place not found")

    client = get_places_client()
    place_data = await client.search_place(
        name=place.name,
        location=place.location,
        city=place.city,
        state=place.state,
        country=place.country,
    )

    if place_data:
        place.address = place_data.get("address")
        place.rating = place_data.get("rating")
        place.user_ratings_total = place_data.get("user_ratings_total")
        place.google_maps_link = place_data.get("google_maps_link")
        place.lat = place_data.get("lat")
        place.lng = place_data.get("lng")
        place.opening_hours = place_data.get("opening_hours")
        place.type = place_data.get("type")
        place.google_place_id = place_data.get("google_place_id")

        await db.commit()
        await db.refresh(place)
    else:
        raise HTTPException(
            status_code=404,
            detail="Could not find place in Google Places API",
        )

    return place


# ============ Export Endpoints ============


@app.get("/admin/export", response_model=ExportResponse)
async def admin_export_places(
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin),
):
    """
    Export all approved places in master_data.json format.

    Admin only.
    """
    result = await db.execute(
        select(Place)
        .where(Place.status == PlaceStatus.APPROVED)
        .order_by(Place.city, Place.name)
    )
    places = result.scalars().all()

    export_data = [place.to_export_dict() for place in places]

    return {"count": len(export_data), "places": export_data}


@app.post("/admin/export/file")
async def admin_export_to_file(
    output_path: str = Query(default="../master_data/master_data.json"),
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin),
):
    """
    Export approved places directly to master_data.json file.

    Admin only.
    """
    result = await db.execute(
        select(Place)
        .where(Place.status == PlaceStatus.APPROVED)
        .order_by(Place.city, Place.name)
    )
    places = result.scalars().all()

    export_data = [place.to_export_dict() for place in places]

    # Write to file
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, "w") as f:
        json.dump(export_data, f, indent=2)

    return {
        "message": f"Exported {len(export_data)} places to {output_path}",
        "count": len(export_data),
    }


@app.get("/admin/stats", response_model=StatsResponse)
async def admin_stats(
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin),
):
    """Get statistics about places. Admin only."""
    # Total count
    total_result = await db.execute(select(func.count(Place.id)))
    total = total_result.scalar()

    # Count by status
    pending_result = await db.execute(
        select(func.count(Place.id)).where(Place.status == PlaceStatus.PENDING)
    )
    pending = pending_result.scalar()

    approved_result = await db.execute(
        select(func.count(Place.id)).where(Place.status == PlaceStatus.APPROVED)
    )
    approved = approved_result.scalar()

    rejected_result = await db.execute(
        select(func.count(Place.id)).where(Place.status == PlaceStatus.REJECTED)
    )
    rejected = rejected_result.scalar()

    # Creator's rec count
    creators_rec_result = await db.execute(
        select(func.count(Place.id)).where(Place.creators_rec == "Yes")
    )
    creators_rec_count = creators_rec_result.scalar()

    return {
        "total": total,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "creators_rec_count": creators_rec_count,
    }


# ============ Import Endpoint ============


@app.post("/admin/import")
async def admin_import_from_json(
    file_path: str = Query(default="../master_data/master_data.json"),
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin),
):
    """
    Import places from existing master_data.json file.

    This will import all places as approved. Duplicates (by google_place_id) are skipped.
    """
    import_file = Path(file_path)

    if not import_file.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

    with open(import_file) as f:
        data = json.load(f)

    imported = 0
    skipped = 0

    for item in data:
        # Skip if already exists (by google_place_id or name+city)
        google_place_id = item.get("google_place_id")

        if google_place_id:
            existing = await db.execute(
                select(Place).where(Place.google_place_id == google_place_id)
            )
            if existing.scalar_one_or_none():
                skipped += 1
                continue

        # Check by name + city
        existing = await db.execute(
            select(Place).where(
                Place.name == item.get("name"),
                Place.city == item.get("city"),
            )
        )
        if existing.scalar_one_or_none():
            skipped += 1
            continue

        # Create place
        place = Place(
            name=item.get("name"),
            location=item.get("location"),
            city=item.get("city"),
            state=item.get("state"),
            country=item.get("country"),
            notes=item.get("notes"),
            address=item.get("address"),
            rating=item.get("rating"),
            user_ratings_total=item.get("user_ratings_total"),
            google_maps_link=item.get("google_maps_link"),
            lat=item.get("lat"),
            lng=item.get("lng"),
            opening_hours=item.get("opening_hours"),
            type=item.get("type"),
            google_place_id=google_place_id,
            type2=item.get("type2"),
            creators_rec=item.get("creators_rec"),
            status=PlaceStatus.APPROVED,  # Import as approved
            submitted_by="import",
        )

        db.add(place)
        imported += 1

    await db.commit()

    return {
        "message": f"Imported {imported} places, skipped {skipped} duplicates",
        "imported": imported,
        "skipped": skipped,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
