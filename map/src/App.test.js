import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App';

jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="mock-map">{children}</div>,
  TileLayer: () => <div data-testid="mock-tile-layer" />,
  Marker: () => <div data-testid="mock-marker" />,
  useMap: () => ({
    flyTo: jest.fn(),
    invalidateSize: jest.fn(),
  }),
  useMapEvents: () => null,
}));

jest.mock('leaflet', () => ({
  divIcon: jest.fn(() => ({})),
}));

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
    google_maps_link: 'https://maps.google.com/test',
  },
  {
    name: 'Test Restaurant',
    lat: 37.89,
    lng: -122.28,
    type2: 'food',
    notes: 'A test restaurant',
    google_place_id: 'test-place-2',
    rating: 4.2,
    user_ratings_total: 200,
    google_maps_link: 'https://maps.google.com/test2',
  },
]);

describe('App', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  test('renders project title and core actions', () => {
    render(<App />);

    expect(screen.getByText(/The Map of Tiny Perfect Things/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add a Place/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Feature Requests/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ask Ava/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /About/i })).toBeInTheDocument();
  });

  test('renders map and marker list', () => {
    render(<App />);

    expect(screen.getByTestId('mock-map')).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-marker')).toHaveLength(2);
  });

  test('renders all filter buttons', () => {
    render(<App />);

    const filterBar = screen.getByRole('navigation', { name: /filter places/i });
    const scoped = within(filterBar);

    expect(scoped.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(scoped.getByRole('button', { name: 'Coffee' })).toBeInTheDocument();
    expect(scoped.getByRole('button', { name: 'Food' })).toBeInTheDocument();
    expect(scoped.getByRole('button', { name: 'Other' })).toBeInTheDocument();
  });

  test('navigates to submit form and shows maintainer override controls', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Add a Place/i }));

    expect(screen.getByRole('heading', { name: /Add a Place/i })).toBeInTheDocument();
    expect(screen.getByText(/Maintainer options/i)).toBeInTheDocument();

    const creatorToggle = screen.getByLabelText(/Mark as creator recommendation/i);
    expect(creatorToggle).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Maintainer access code \(optional\)/i), {
      target: { value: 'test-code' },
    });

    expect(screen.getByLabelText(/Mark as creator recommendation/i)).not.toBeDisabled();
  });

  test('does not reveal creator rules in public form copy', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Add a Place/i }));

    expect(
      screen.queryByText(/Creator override appears automatically when contributor name matches Harsh\/Dea./i),
    ).not.toBeInTheDocument();
  });

  test('opens no-login chat page from main map panel', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Ask Ava/i }));

    expect(screen.getByRole('heading', { name: /Ask Ava/i })).toBeInTheDocument();
    expect(
      screen.getByText(/No login required\. Ava answers using submitted map data and cites matching places\./i),
    ).toBeInTheDocument();
  });

  test('chat returns no-data message for unknown city even with category in query', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Ask Ava/i }));
    fireEvent.change(screen.getByLabelText(/Ask Ava/i), {
      target: { value: 'any cafes in Dubai?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send/i }));

    await waitFor(() => {
      expect(screen.getByText(/I do not have any submissions for Dubai yet\./i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Using retrieval-only fallback mode/i)).not.toBeInTheDocument();
  });

  test('about page includes creator profile links', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /About/i }));

    expect(screen.getByRole('heading', { name: /About the Project/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /blog\.harsh17\.in/i })).toHaveAttribute(
      'href',
      'https://blog.harsh17.in/',
    );
    expect(screen.getByRole('link', { name: /deabardhoshi\.com/i })).toHaveAttribute(
      'href',
      'https://deabardhoshi.com/',
    );
  });
});
