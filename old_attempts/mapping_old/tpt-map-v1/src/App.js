import React, { useState } from 'react';
import MapGL, { Marker, Popup } from 'react-map-gl';
import data from './master_data.json';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiaGFyc2gxNyIsImEiOiJjbGt1b2lrZW4wNTBmM2twaXJreHhjOTIxIn0.A_Cl-PJeK5lr6rDg8bY7lw'; // Replace with your Mapbox token

function App() {
  const [viewport, setViewport] = useState({
    latitude: 37.8803,
    longitude: -122.2699,
    zoom: 10,
  });

  const [selectedLocation, setSelectedLocation] = useState(null);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <MapGL
        {...viewport}
        width="100%"
        height="100%"
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxApiAccessToken={MAPBOX_TOKEN}
        onViewportChange={(viewport) => setViewport(viewport)}
      >
        {data.map((location, index) => (
          <Marker key={index} latitude={location.lat} longitude={location.lng}>
            <div
              onClick={(e) => {
                e.preventDefault();
                setSelectedLocation(location);
              }}
            >
              <span>{location.name}</span>
            </div>
          </Marker>
        ))}

        {selectedLocation ? (
          <Popup
            latitude={selectedLocation.lat}
            longitude={selectedLocation.lng}
            onClose={() => setSelectedLocation(null)}
          >
            <div>
              <h3>Name: {selectedLocation.name}</h3>
              <p>Type: {selectedLocation.type}</p>
              <p>City, State: {selectedLocation.city}, {selectedLocation.state}</p>
              {selectedLocation.creators_rec && <p>Creator's Rec: Yes</p>}
              <p>Notes: {selectedLocation.notes}</p>
              <p>
                G-Maps Rating: {selectedLocation.rating} (
                {selectedLocation.user_ratings_total} ratings)
              </p>
              <p>
                Google Maps:{' '}
                <a href={selectedLocation.google_maps_link}>Link</a>
              </p>
            </div>
          </Popup>
        ) : null}
      </MapGL>
    </div>
  );
}

export default App;
