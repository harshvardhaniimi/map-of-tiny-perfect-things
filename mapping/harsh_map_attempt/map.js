import data from './master_data.json';

// Function to read your Mapbox API key from the text file
const getMapboxApiKey = () => {
  return fs.readFileSync('mapbox_key.txt', 'utf8').trim();
};

const MAPBOX_TOKEN = getMapboxApiKey(); // Make sure to trim it to remove newline characters
