import React, { useState } from 'react';
import MapGL, { Marker, Popup } from 'react-map-gl';
import data from './master_data.json';
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = 'pk.eyJ1IjoiaGFyc2gxNyIsImEiOiJjbGt1b2lrZW4wNTBmM2twaXJreHhjOTIxIn0.A_Cl-PJeK5lr6rDg8bY7lw'; // Replace with your Mapbox token

function App() {
  const [viewport, setViewport] = useState({
    latitude: 37.8803,
    longitude: -122.2699,
    zoom: 10,
  });

  const [PopupOpen, setPopupOpen] = useState(null);

  const mapdata = data.map((location) => (
        
    <Marker key={location} 
              latitude={Number(location.lat)} 
              longitude={Number(location.lng)} 
              onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setPopupOpen(location) }
                
    }>  
      <button>{location.name}</button> {/* Change this part */}

  </Marker>

  
  ))


  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <MapGL
        {...viewport}
        width="100%"
        height="100%"
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
  
        onMove={evt => setViewport(evt.viewport)}
    >
      {mapdata}

        {PopupOpen && (
          <Popup key={PopupOpen}
            latitude={Number(PopupOpen.lat)}
            longitude={Number(PopupOpen.lng)}
            onClose={() => setPopupOpen(null)}
          >
            <div>
            <h3>Name: {PopupOpen.name}</h3>
              <p>Type: {PopupOpen.type}</p>
              <p>City, State: {PopupOpen.city}, {PopupOpen.state}</p>
              {PopupOpen.creators_rec && <p>Creator's Rec: Yes</p>}
              <p>Notes: {PopupOpen.notes}</p>
              <p>
                G-Maps Rating: {PopupOpen.rating} (
                {PopupOpen.user_ratings_total} ratings)
              </p>
              <p>
                Google Maps:{' '}
                <a href={PopupOpen.google_maps_link}>Link</a>
              </p>
            </div>
          </Popup> )}

      </MapGL>
    </div>
  );
}

export default App;