import React, { useState } from 'react';
import MapGL, { Marker, Popup } from 'react-map-gl';
import data from './master_data.json';
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  MDBCard,
  MDBCardBody,
  MDBCardTitle,
  MDBCardText,
  MDBBtn
} from 'mdb-react-ui-kit';
import 'mdb-react-ui-kit/dist/css/mdb.min.css'

const MAPBOX_TOKEN = 'pk.eyJ1IjoiaGFyc2gxNyIsImEiOiJjbGt1b2lrZW4wNTBmM2twaXJreHhjOTIxIn0.A_Cl-PJeK5lr6rDg8bY7lw'; // Replace with your Mapbox token

function App() {
  const [viewport, setViewport] = useState({
    latitude: 37.8803,
    longitude: -122.2699,
    zoom: 10,
  });

  const [PopupOpen, setPopupOpen] = useState(null);

  const [selectedCity, setSelectedCity] = useState(null);

  const [selectedType, setSelectedType] = useState('all')

  const filteredData = selectedType === 'all' ? data : data.filter(location => location.type === selectedType);


  return (
       
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>

      <MapGL
        {...viewport}
        width="100%"
        height="100%"
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
  
        onMove={evt => setViewport(evt.viewport)}
    >
      <div style={{ position: 'absolute', top: 10, left: 1200, zIndex: 1 }}>
        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
          <option value="all">All</option>
          <option value="restaurant">Restaurant</option>
          <option value="cafe">Cafe</option>

        </select>

        <input
          type="text"
          placeholder="Filter by City"
          value={selectedCity}/>
      </div>

      <div style={{ position: 'absolute', top: 10, left: 10, width: 480, zIndex: 1 }}>
      <MDBCard alignment='left'>
      <MDBCardBody>
        <MDBCardTitle> 🗺 The Map of Tiny Perfect Things </MDBCardTitle>
        <MDBCardText> 
            Your stomach rumbles. Do you go to the Italian restaurant that you know and love, or the new Thai place that just opened up? Is there a map that answers your questions about restaurants, cafes, parks and everything in between? Until now, the answer was no. But starting today, Dea and I present to the world the first iteration of "The Map of Tiny Perfect Things". 
</MDBCardText>
<MDBBtn className='me-1' href='#'>About</MDBBtn>
        <MDBBtn className='me-2' href='#'>Add a Place</MDBBtn>

        <MDBBtn className='me-3' href='#'>Ask a Question</MDBBtn>
      </MDBCardBody>
    
    </MDBCard>
  </div>

  
          

  {filteredData.map((location) => (
        
        <Marker key={location} 
                  latitude={Number(location.lat)} 
                  longitude={Number(location.lng)} 
                  onClick={(e) => {
                      e.originalEvent.stopPropagation();
                      setPopupOpen(location) }
                    
        }>  
      
          <button> 🏝 </button> {/* Change this part */}
        
      </Marker>
    
      
      ))
}

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