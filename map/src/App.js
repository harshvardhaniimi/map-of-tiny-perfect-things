import React, { useState, useEffect, useCallback } from 'react';
import MapGL, { Marker } from 'react-map-gl';
import data from './master_data.json';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css';
import { MDBCard, MDBCardBody, MDBCardTitle, MDBCardText } from 'mdb-react-ui-kit';
import 'mdb-react-ui-kit/dist/css/mdb.min.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import GeocoderControl from './geocoder';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';

// Use Environment Variable for Mapbox Token
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

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

function App() {
  const [viewport, setViewport] = useState({
    latitude: 37.8803,
    longitude: -122.2699,
    zoom: 10,
  });

  const [PopupOpen, setPopupOpen] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  const [infoCardCollapsed, setInfoCardCollapsed] = useState(false);
  const isMobile = useIsMobile();

  const filteredData = selectedType === 'all'
    ? data
    : data.filter(location => location.type2 === selectedType);

  const handleMarkerClick = useCallback((e, location) => {
    e.originalEvent.stopPropagation();
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
        <MapGL
          {...viewport}
          width="100%"
          height="100%"
          mapStyle="mapbox://styles/mapbox/streets-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          onMove={evt => setViewport(evt.viewport)}
          onClick={handleMapClick}
        >
          <GeocoderControl mapboxAccessToken={MAPBOX_TOKEN} position="top-right" />

          {/* Info Card */}
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

          {/* Map Markers */}
          {filteredData.map((location, index) => (
            <Marker
              key={`${location.google_place_id || location.name}-${location.lat}-${location.lng}-${index}`}
              latitude={Number(location.lat)}
              longitude={Number(location.lng)}
              onClick={(e) => handleMarkerClick(e, location)}
            >
              <button
                className="map-marker"
                aria-label={`View ${location.name}`}
              >
                {getMarkerEmoji(location)}
              </button>
            </Marker>
          ))}

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
        </MapGL>

        <Routes>
          <Route path="/about" element={<AboutComponent />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
