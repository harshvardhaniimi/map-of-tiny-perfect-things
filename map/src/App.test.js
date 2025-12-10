import { render, screen, within } from '@testing-library/react';
import App from './App';

// Mock Mapbox GL as it requires WebGL which is not available in test environment
jest.mock('react-map-gl', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="mock-map">{children}</div>,
  Marker: ({ children }) => <div data-testid="mock-marker">{children}</div>,
}));

// Mock the geocoder control
jest.mock('./geocoder', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-geocoder" />,
}));

// Mock the data to reduce test complexity
jest.mock('./master_data.json', () => [
  {
    name: 'Test Coffee Shop',
    lat: 37.8803,
    lng: -122.2699,
    type2: 'coffee',
    notes: 'A test coffee shop',
    google_place_id: 'test-place-1',
    rating: 4.5,
    user_ratings_total: 100,
    google_maps_link: 'https://maps.google.com/test'
  },
  {
    name: 'Test Restaurant',
    lat: 37.8900,
    lng: -122.2800,
    type2: 'food',
    notes: 'A test restaurant',
    google_place_id: 'test-place-2',
    rating: 4.2,
    user_ratings_total: 200,
    google_maps_link: 'https://maps.google.com/test2'
  }
]);

describe('App Component', () => {
  test('renders the app title in the info card', () => {
    render(<App />);
    // Find the title specifically in the card title element
    const titleElement = document.querySelector('.info-card-title');
    expect(titleElement).toBeInTheDocument();
    expect(titleElement.textContent).toContain('The Map of Tiny Perfect Things');
  });

  test('renders all filter buttons', () => {
    render(<App />);
    // Find the filter container first, then look for buttons within it
    const filterContainer = document.querySelector('.filter-container');
    expect(filterContainer).toBeInTheDocument();

    const withinFilter = within(filterContainer);
    expect(withinFilter.getByText('All')).toBeInTheDocument();
    expect(withinFilter.getByText('Coffee')).toBeInTheDocument();
    expect(withinFilter.getByText('Food')).toBeInTheDocument();
    expect(withinFilter.getByText('Other')).toBeInTheDocument();
  });

  test('renders info card action links', () => {
    render(<App />);
    const aboutLink = screen.getByRole('link', { name: /about/i });
    const addPlaceLink = screen.getByRole('link', { name: /add a place/i });
    const askQuestionLink = screen.getByRole('link', { name: /ask a question/i });

    expect(aboutLink).toBeInTheDocument();
    expect(addPlaceLink).toBeInTheDocument();
    expect(askQuestionLink).toBeInTheDocument();
  });

  test('renders the map container', () => {
    render(<App />);
    const mapContainer = screen.getByTestId('mock-map');
    expect(mapContainer).toBeInTheDocument();
  });

  test('renders map markers for locations', () => {
    render(<App />);
    const markers = screen.getAllByTestId('mock-marker');
    expect(markers.length).toBeGreaterThan(0);
  });
});
