import { StrictMode } from 'react';
import { render } from '@testing-library/react';
import OpenFreeMapBackground from './OpenFreeMapBackground';

const { map, layers, createLayer } = vi.hoisted(() => {
  const map = { removeLayer: vi.fn() };
  const layers = [];
  const createLayer = vi.fn(() => {
    const layer = { addTo: vi.fn().mockReturnThis() };
    layers.push(layer);
    return layer;
  });
  return { map, layers, createLayer };
});

vi.mock('react-leaflet', () => ({ useMap: () => map }));
vi.mock('@maplibre/maplibre-gl-leaflet', () => ({ maplibreGL: createLayer }));
vi.mock('maplibre-gl', () => ({ setWorkerUrl: vi.fn() }));

test('removes each vector layer on StrictMode cleanup and navigation away', () => {
  const { unmount } = render(<StrictMode><OpenFreeMapBackground /></StrictMode>);

  expect(layers).toHaveLength(2);
  expect(map.removeLayer).toHaveBeenCalledWith(layers[0]);
  expect(layers[1].addTo).toHaveBeenCalledWith(map);
  expect(createLayer).toHaveBeenCalledWith(expect.objectContaining({
    attributionControl: { customAttribution: expect.stringContaining('OpenStreetMap') },
  }));

  unmount();
  expect(map.removeLayer).toHaveBeenCalledWith(layers[1]);
  expect(map.removeLayer).toHaveBeenCalledTimes(2);
});
