const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();

export const initAnalytics = () => {
  if (!measurementId || typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  if (!document.querySelector(`[data-google-analytics="${measurementId}"]`)) {
    window.gtag('js', new Date());
    window.gtag('config', measurementId);

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.dataset.googleAnalytics = measurementId;
    document.head.appendChild(script);
  }

  return true;
};
