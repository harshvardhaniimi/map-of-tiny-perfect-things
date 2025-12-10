import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import data from './master_data.json';
import 'leaflet/dist/leaflet.css';
import './App.css';
import { MDBCard, MDBCardBody, MDBCardTitle, MDBCardText } from 'mdb-react-ui-kit';
import 'mdb-react-ui-kit/dist/css/mdb.min.css';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';

// Custom hook for detecting mobile viewport
const useIsMobile = (breakpoint = 576) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= breakpoint);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};

// Create custom emoji icons for markers
const createEmojiIcon = (emoji) => {
  return L.divIcon({
    html: `<span class="emoji-marker">${emoji}</span>`,
    className: 'emoji-marker-container',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// Search Control Component using Nominatim (free OpenStreetMap geocoding)
const SearchControl = () => {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        {
          headers: {
            'User-Agent': 'PerfectPlacesMap/1.0'
          }
        }
      );
      const data = await response.json();
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    }
    setIsSearching(false);
  };

  const handleResultClick = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    map.flyTo([lat, lon], 14);
    setShowResults(false);
    setQuery(result.display_name.split(',')[0]);
  };

  return (
    <div className="search-control" ref={searchRef}>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-btn" disabled={isSearching}>
          {isSearching ? '...' : '🔍'}
        </button>
      </form>
      {showResults && results.length > 0 && (
        <ul className="search-results">
          {results.map((result, idx) => (
            <li key={idx} onClick={() => handleResultClick(result)}>
              {result.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Map click handler component
const MapClickHandler = ({ onMapClick, markerClickedRef }) => {
  useMapEvents({
    click: () => {
      // Ignore map clicks that originated from marker clicks
      if (markerClickedRef.current) {
        markerClickedRef.current = false;
        return;
      }
      onMapClick();
    },
  });
  return null;
};

function App() {
  const [center] = useState([37.8803, -122.2699]);
  const [zoom] = useState(10);
  const [PopupOpen, setPopupOpen] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  const [infoCardCollapsed, setInfoCardCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const markerClickedRef = useRef(false);

  const filteredData = selectedType === 'all'
    ? data
    : data.filter(location => location.type2 === selectedType);

  const handleMarkerClick = useCallback((location) => {
    markerClickedRef.current = true;
    setPopupOpen(location);
  }, []);

  const handleClosePopup = useCallback(() => {
    setPopupOpen(null);
  }, []);

  const handleMapClick = useCallback(() => {
    setPopupOpen(null);
  }, []);

  const toggleInfoCard = useCallback(() => {
    setInfoCardCollapsed(prev => !prev);
  }, []);

  // Auto-collapse info card on mobile
  useEffect(() => {
    if (isMobile) {
      setInfoCardCollapsed(true);
    } else {
      setInfoCardCollapsed(false);
    }
  }, [isMobile]);

  const AboutComponent = () => {
    window.location.href = 'about.html';
    return null;
  };

  const getMarkerEmoji = (location) => {
    if (location.creators_rec === 'Yes') return '⭐️';
    if (location.type2 === 'coffee') return '☕️';
    if (location.type2 === 'food') return '🍱';
    if (location.type2 === 'others') return '🏝';
    return '📍';
  };

  return (
    <Router>
      <div className="map-container">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          {/* OpenStreetMap Tiles - Free, no API key needed */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Map click handler */}
          <MapClickHandler onMapClick={handleMapClick} markerClickedRef={markerClickedRef} />

          {/* Search Control */}
          <SearchControl />

          {/* Map Markers */}
          {filteredData.map((location, index) => (
            <Marker
              key={`${location.google_place_id || location.name}-${location.lat}-${location.lng}-${index}`}
              position={[Number(location.lat), Number(location.lng)]}
              icon={createEmojiIcon(getMarkerEmoji(location))}
              eventHandlers={{
                click: () => handleMarkerClick(location),
              }}
            />
          ))}
        </MapContainer>

        {/* Info Card - Outside MapContainer for proper z-index */}
        <div className={`info-card ${infoCardCollapsed ? 'collapsed' : ''}`}>
          <MDBCard>
            <MDBCardBody>
              {isMobile && (
                <button
                  className="info-card-toggle"
                  onClick={toggleInfoCard}
                  aria-label={infoCardCollapsed ? 'Expand info' : 'Collapse info'}
                >
                  {infoCardCollapsed ? '▼' : '▲'}
                </button>
              )}
              <MDBCardTitle className="info-card-title">
                🗺 The Map of Tiny Perfect Things
              </MDBCardTitle>
              <MDBCardText className="info-card-text">
                Your stomach rumbles. Do you go to the Italian restaurant that you know and love,
                or the new Thai place that just opened up? Is there a map that answers your questions
                about restaurants, cafes, parks and everything in between? Until now, the answer was no.
                But starting today, Dea and Harsh present to the world the first iteration of
                'The Map of Tiny Perfect Things'.
              </MDBCardText>
              <div className="info-card-buttons">
                <a href="about.html" className="info-card-btn">
                  About
                </a>
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSf3zX9ItXAS6JM4cO9JdrQFSpNtew-AETsG88M7jPOhexa-Dg/viewform"
                  className="info-card-btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Add a Place
                </a>
                <a
                  href="https://perfectplaces.streamlit.app/"
                  className="info-card-btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ask a Question
                </a>
              </div>
            </MDBCardBody>
          </MDBCard>
        </div>

        {/* Location Popup Card */}
        {PopupOpen && (
          <div className="popup-container">
            <MDBCard className="popup-card">
              <MDBCardBody style={{ position: 'relative' }}>
                <button
                  className="popup-close-btn"
                  onClick={handleClosePopup}
                  aria-label="Close popup"
                >
                  ×
                </button>
                <MDBCardTitle className="popup-card-title">
                  {PopupOpen.name}
                </MDBCardTitle>
                <MDBCardText className="popup-card-text">
                  {PopupOpen.creators_rec === 'Yes' && (
                    <span className="creators-rec-badge">⭐ Creator's Pick</span>
                  )}
                  <p><strong>Notes:</strong> {PopupOpen.notes}</p>
                  {PopupOpen.address && (
                    <p><strong>Address:</strong> {PopupOpen.address}</p>
                  )}
                  {PopupOpen.opening_hours && (
                    <p><strong>Hours:</strong> {PopupOpen.opening_hours}</p>
                  )}
                  <div className="popup-card-footer">
                    <a
                      href={PopupOpen.google_maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on Google Maps
                    </a>
                    {PopupOpen.rating && (
                      <span style={{ marginLeft: '12px' }}>
                        ⭐ {PopupOpen.rating} ({PopupOpen.user_ratings_total} reviews)
                      </span>
                    )}
                  </div>
                </MDBCardText>
              </MDBCardBody>
            </MDBCard>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="filter-container">
          <div className="filter-buttons">
            <button
              className={`filter-btn filter-btn-all ${selectedType === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedType('all')}
              aria-pressed={selectedType === 'all'}
            >
              <span className="filter-btn-icon">🧺</span>
              <span className="filter-btn-text">All</span>
            </button>
            <button
              className={`filter-btn filter-btn-coffee ${selectedType === 'coffee' ? 'active' : ''}`}
              onClick={() => setSelectedType('coffee')}
              aria-pressed={selectedType === 'coffee'}
            >
              <span className="filter-btn-icon">☕️</span>
              <span className="filter-btn-text">Coffee</span>
            </button>
            <button
              className={`filter-btn filter-btn-food ${selectedType === 'food' ? 'active' : ''}`}
              onClick={() => setSelectedType('food')}
              aria-pressed={selectedType === 'food'}
            >
              <span className="filter-btn-icon">🍱</span>
              <span className="filter-btn-text">Food</span>
            </button>
            <button
              className={`filter-btn filter-btn-others ${selectedType === 'others' ? 'active' : ''}`}
              onClick={() => setSelectedType('others')}
              aria-pressed={selectedType === 'others'}
            >
              <span className="filter-btn-icon">🏝</span>
              <span className="filter-btn-text">Other</span>
            </button>
          </div>
        </div>

        <Routes>
          <Route path="/about" element={<AboutComponent />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
