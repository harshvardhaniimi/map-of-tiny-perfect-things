describe('Google Analytics', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');
    document.head.querySelectorAll('[data-google-analytics]').forEach((element) => element.remove());
    delete window.dataLayer;
    delete window.gtag;
    window.history.replaceState({}, '', '/about?source=test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('loads gtag once and configures the measurement ID', async () => {
    const { initAnalytics } = await import('./analytics');

    expect(initAnalytics()).toBe(true);
    expect(initAnalytics()).toBe(true);
    expect(document.head.querySelectorAll('[data-google-analytics="G-TEST123"]')).toHaveLength(1);
    expect(window.dataLayer).toHaveLength(2);
    expect(window.dataLayer[1][0]).toBe('config');
    expect(window.dataLayer[1][1]).toBe('G-TEST123');
  });
});
