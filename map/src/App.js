import React, { useState, useEffect} from 'react';
import MapGL, { Marker } from 'react-map-gl';
import data from './master_data.json';
import 'mapbox-gl/dist/mapbox-gl.css'
import { MDBCard, MDBCardBody, MDBCardTitle, MDBCardText, MDBBtn } from 'mdb-react-ui-kit';
import 'mdb-react-ui-kit/dist/css/mdb.min.css'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import GeocoderControl from './geocoder';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';


// Use Environment Variable for Mapbox Token
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

function App() {
  const [viewport, setViewport] = useState({
    latitude: 37.8803,
    longitude: -122.2699,
    zoom: 10,
  });

  const [PopupOpen, setPopupOpen] = useState(null);
  const [selectedType, setSelectedType] = useState('all')
  const filteredData = selectedType === 'all' ? data : data.filter(location => location.type2 === selectedType);
  const [expanded, setExpanded] = useState(false);
  const [expandedPopup, setExpandedPopup] = useState(null);

  const handlePopupClick = (location) => {
    if (expandedPopup === location) {
      setExpandedPopup(null);
    } else {
      setExpandedPopup(location);
    }
  }

  const handleDocumentClick = (e) => {
    setPopupOpen(false)
  }
  useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);


  const AboutComponent = () => { 
    window.location.href = 'about.html'; 
    return null;
  };



  return (
    <Router>
    <div  style={{ width: '100vw', height: '100vh', position: 'relative' }}>

      <MapGL
        {...viewport}
    
        width="100%"
        height="100%"
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
  
        onMove={evt => setViewport(evt.viewport)}
    >

<GeocoderControl mapboxAccessToken={MAPBOX_TOKEN} position="top-right" />

<div className="d-flex fixed-bottom justify-content-center">
  <div className="d-flex flex-row">
    <div className="w-100">
      <MDBBtn className="btn btn-outline-dark" style={{ background: '#0FFF50', textTransform: 'none', fontFamily: 'HelveticaNeue-Bold' }} onClick={() => setSelectedType('all')}>
        <h4>🧺 All </h4>
      </MDBBtn>
      <MDBBtn className="btn btn-outline-dark" style={{ background: '#FF5F1F', textTransform: 'none', fontFamily: 'HelveticaNeue-Bold' }} onClick={() => setSelectedType('coffee')}>
        <h4>☕️ Coffee </h4>
      </MDBBtn>
      <MDBBtn className="btn btn-outline-dark" style={{ background: '#3498DB', textTransform: 'none', fontFamily: 'HelveticaNeue-Bold' }} onClick={() => setSelectedType('food')}>
        <h4>🍱 Food </h4>
      </MDBBtn>
      <MDBBtn className="btn btn-outline-dark" style={{ background: '#FF3131', textTransform: 'none', fontFamily: 'HelveticaNeue-Bold' }} onClick={() => setSelectedType('others')}>
        <h4>🌮 Other </h4>
      </MDBBtn>
    </div>
  </div>
</div>

          <div style={{ 
            position: 'absolute',
            top: 10, left: 10, 
            width: "480px",
          zIndex: 1 }}>
          <MDBCard alignment='left'>
            <MDBCardBody className='btn btn-outline-primary'>
              <MDBCardTitle style={{ textTransform: 'none' , fontFamily: 'HelveticaNeue-Bold'}}> 🗺 The Map of Tiny Perfect Things </MDBCardTitle>
              <MDBCardText style={{ textTransform: 'none' , fontFamily: 'HelveticaNeue'}}>
                {expanded
                  ? "Your journey begins as you explore the map's hidden gems and tiny perfect things."
                  : "Your stomach rumbles. Do you go to the Italian restaurant that you know and love, or the new Thai place that just opened up? Is there a map that answers your questions about restaurants, cafes, parks and everything in between? Until now, the answer was no. But starting today, Dea and Harsh present to the world the first iteration of 'The Map of Tiny Perfect Things'."}
              </MDBCardText>
              <div className=" d-flex flex-row justify-content-center">
              <a href="about.html" className='btn btn-outline-primary me-1' style={{fontFamily: 'HelveticaNeue-Bold', backgroundColor:'#3498DB', color: 'white'}}>
              About
              </a>

              <MDBBtn className='btn btn-outline-primary me-1' style = {{fontFamily: 'HelveticaNeue-Bold', backgroundColor:'#3498DB', color: 'white'}} href='https://docs.google.com/forms/d/e/1FAIpQLSf3zX9ItXAS6JM4cO9JdrQFSpNtew-AETsG88M7jPOhexa-Dg/viewform'>
                Add a Place
              </MDBBtn>
              <MDBBtn className='btn btn-outline-primary me-1' style = {{fontFamily: 'HelveticaNeue-Bold', backgroundColor:'#3498DB', color: 'white'}} href='https://perfectplaces.streamlit.app/'>
                Ask a Question
              </MDBBtn>
              </div>
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
                      handlePopupClick(location);}

                    
        }>  
      
      <button style={{ background: 'none', border: 'none', padding: 0, fontSize: '2em', fontFamily: 'HelveticaNeue-Light' }}>
        {location.creators_rec === 'Yes' ? '⭐️' : 
        location.type2 === 'coffee' ? '☕️' : 
        location.type2 === 'food' ? '🍱' : 
        location.type2 === 'others' ? '🌮' : '🏝'}
</button>
      </Marker>
      ))
}

<div className="d-flex justify-content-end p-2 bd-highlight" style={{ marginTop: '50px' }}>
        {PopupOpen && (
          <MDBCard style={{ width: '350px' }}>
          <MDBCardBody className = "btn-outline-primary">
            <MDBCardTitle style = {{fontFamily: 'HelveticaNeue'}} >{PopupOpen.name}</MDBCardTitle>
            <MDBCardText style = {{fontFamily: 'HelveticaNeue'}}>
  
              {PopupOpen.creators_rec && <p>Creator's Rec: Yes</p>}
              <p> <b>Notes: </b> {PopupOpen.notes}</p>
            
              
              <div class="card-footer text-muted"><p>
                Google Maps:{' '} <a href={PopupOpen.google_maps_link}>Link</a>   (Rating: {PopupOpen.rating}   {PopupOpen.user_ratings_total} ratings) </p>  </div>
            </MDBCardText>
          </MDBCardBody>
        </MDBCard> )}
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