import React, { useState, useRef, useEffect} from 'react';
import MapGL, { Marker, Popup } from 'react-map-gl';
import data from './master_data.json';
import 'mapbox-gl/dist/mapbox-gl.css'
import { MDBCard, MDBCardBody, MDBCardTitle, MDBCardText, MDBBtn } from 'mdb-react-ui-kit';
import 'mdb-react-ui-kit/dist/css/mdb.min.css'

const MAPBOX_TOKEN = 'pk.eyJ1IjoiaGFyc2gxNyIsImEiOiJjbGt1b2lrZW4wNTBmM2twaXJreHhjOTIxIn0.A_Cl-PJeK5lr6rDg8bY7lw'; // Replace with your Mapbox token

function App() {
  const [viewport, setViewport] = useState({
    latitude: 37.8803,
    longitude: -122.2699,
    zoom: 10,
  });

  const [PopupOpen, setPopupOpen] = useState(null);
  const [selectedType, setSelectedType] = useState('all')
  const filteredData = selectedType === 'all' ? data : data.filter(location => location.type === selectedType);
  const [expanded, setExpanded] = useState(false);

  const handleExpandToggle = () => {
    setExpanded(!expanded);
  };

  const [expandedPopup, setExpandedPopup] = useState(null);
  const handlePopupClick = (location) => {
    if (expandedPopup === location) {
      setExpandedPopup(null);
    } else {
      setExpandedPopup(location);
    }
  };
  


  return (
       
    <div  style={{ width: '100vw', height: '100vh', position: 'relative' }}>

      <MapGL
        {...viewport}
    
        width="100%"
        height="100%"
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
  
        onMove={evt => setViewport(evt.viewport)}
    >
<div className="d-flex justify-content-end p-2 bd-highlight">
  <MDBCard alignment='right'>
    <MDBCardBody>
      <div className="md-form mt-0">
        <input className="form-control" type="text" placeholder="Find a new place" aria-label="Search" list="places" id="placeInput"/>
        <datalist id="places">
          <option value="San Francisco Bay Area" />
          <option value="Portland and Vancouver" />
          <option value="Knoxville" />
          <option value="New York City" />
          <option value="Bangalore" />
        </datalist>
      </div>
    </MDBCardBody>
  </MDBCard>
</div>
  
  <div className="d-flex justify-content-end p-2 bd-highlight">

    <div className="d-flex">
          <MDBBtn className="btn btn-light btn-square-md" onClick={(e) => setSelectedType('cafe')}><h4>☕️</h4></MDBBtn>
          <MDBBtn className="btn btn-light btn-square-md" onClick={(e) => setSelectedType('restaurant')}><h4>🍱</h4></MDBBtn>
          <MDBBtn className="btn btn-light btn-square-md" onClick={(e) => setSelectedType('food truck')}><h4>🌮</h4></MDBBtn>
        </div>
      
    
</div>

  



          <div style={{ 
            position: 'absolute',
             top: 10, left: 10, 
            width: "480px",
          zIndex: 1 }}>
          <MDBCard alignment='left'>
            <MDBCardBody>
              <MDBCardTitle> 🗺 The Map of Tiny Perfect Things </MDBCardTitle>
              <MDBCardText>
                {expanded
                  ? "Your journey begins as you explore the map's hidden gems and tiny perfect things."
                  : "Your stomach rumbles. Do you go to the Italian restaurant that you know and love, or the new Thai place that just opened up? Is there a map that answers your questions about restaurants, cafes, parks and everything in between? Until now, the answer was no. But starting today, Dea and I present to the world the first iteration of 'The Map of Tiny Perfect Things'."}
              </MDBCardText>
              <MDBBtn className='me-1' href='#' onClick={handleExpandToggle}>
                {expanded ? 'Collapse' : 'About'}
              </MDBBtn>
              <MDBBtn className='me-2' href='#'>
                Add a Place
              </MDBBtn>
              <MDBBtn className='me-3' href='#'>
                Ask a Question
              </MDBBtn>
            </MDBCardBody>
          </MDBCard>
        </div>
        

  
  );
  
          

  {filteredData.map((location) => (
        
        <Marker key={location.id} 
                  latitude={Number(location.lat)} 
                  longitude={Number(location.lng)} 
                  onClick={(e) => {
                      e.originalEvent.stopPropagation();
                      setPopupOpen(location) 
                      setExpanded(true)
                      handlePopupClick(location);}

                    
        }>  
      
          <button> 🏝 </button> {/* Change this part */}
        
      </Marker>
    
      
      ))
}

<div
        class='popup'
        style={{
          position: 'absolute',
          top: 200,
          left: 10,
          width: '480px',
          zIndex: 1,
        }}
      >
        {PopupOpen && (
          <MDBCard>
          <MDBCardBody>
            <MDBCardTitle>{PopupOpen.name}</MDBCardTitle>
            <MDBCardText><h3>Name: {PopupOpen.name}</h3>
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
            </MDBCardText>
          </MDBCardBody>
        </MDBCard> )}
        </div>

      </MapGL>
    </div>
  );
}

export default App;