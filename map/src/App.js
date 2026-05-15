import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import data from './master_data.json';
import 'leaflet/dist/leaflet.css';
import './App.css';

const DEFAULT_CENTER = [20, 0];
const DEFAULT_ZOOM = 2;
const PLACE_FORM_NAME = 'place-submissions';
const FEATURE_FORM_NAME = 'feature-requests';
const NETLIFY_FORM_ENDPOINT = '/netlify-forms.html';

const SUBMISSION_DEFAULTS = {
  contributorName: '',
  contributorEmail: '',
  placeName: '',
  location: '',
  city: '',
  state: '',
  country: '',
  category: 'other',
  googleMapsLink: '',
  notes: '',
  creatorAccessCode: '',
  creatorRec: false,
  botField: '',
};

const FEATURE_DEFAULTS = {
  requesterName: '',
  requesterEmail: '',
  summary: '',
  problem: '',
  proposal: '',
  component: 'map web app',
  botField: '',
};

const QUERY_STOPWORDS = new Set([
  'a',
  'an',
  'any',
  'are',
  'around',
  'at',
  'best',
  'can',
  'do',
  'for',
  'get',
  'give',
  'good',
  'hey',
  'i',
  'in',
  'is',
  'looking',
  'me',
  'near',
  'need',
  'of',
  'on',
  'place',
  'places',
  'please',
  'recommend',
  'recommendation',
  'recommendations',
  'show',
  'suggest',
  'suggestion',
  'suggestions',
  'the',
  'to',
  'want',
  'what',
  'where',
  'which',
  'with',
  'you',
]);

const CATEGORY_ALIASES = {
  cafe: 'coffee',
  cafes: 'coffee',
  espresso: 'coffee',
  restaurant: 'food',
  restaurants: 'food',
  eat: 'food',
};

const CREATOR_QUERY_TOKENS = new Set(['creator', 'creators', 'harsh', 'dea']);
const LOCATION_TOKEN_ALIASES = {
  bangalore: ['bengaluru', 'blr'],
  bengaluru: ['bangalore', 'blr'],
  blr: ['bangalore', 'bengaluru'],
};

const encodeFormData = (payload) => new URLSearchParams(payload).toString();

const submitNetlifyForm = async (formName, payload) => {
  const response = await fetch(NETLIFY_FORM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: encodeFormData({
      'form-name': formName,
      ...payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`Form submit failed: ${response.status}`);
  }
};

const normalizeSearchText = (value) =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value) => normalizeSearchText(value).split(' ').filter((token) => token.length > 1);

const normalizeQueryToken = (token) => CATEGORY_ALIASES[token] || token;

const tokenizeForQuery = (value) =>
  tokenize(value)
    .map((token) => normalizeQueryToken(token))
    .filter((token) => token && !QUERY_STOPWORDS.has(token));

const toTokenSet = (value) => new Set(tokenize(value));

const expandLocationTokens = (tokens) => {
  const expanded = new Set(tokens);

  tokens.forEach((token) => {
    const aliases = LOCATION_TOKEN_ALIASES[token] || [];
    aliases.forEach((alias) => expanded.add(alias));
  });

  return Array.from(expanded);
};

const buildTypeTokenSet = (placeType) => {
  const tokens = toTokenSet(placeType);

  if (tokens.has('coffee')) {
    tokens.add('cafe');
    tokens.add('cafes');
    tokens.add('espresso');
  }
  if (tokens.has('food')) {
    tokens.add('restaurant');
    tokens.add('restaurants');
    tokens.add('eat');
    tokens.add('bakery');
  }
  if (tokens.has('drinks')) {
    tokens.add('bar');
    tokens.add('bars');
    tokens.add('pub');
    tokens.add('cocktail');
  }
  if (tokens.has('culture')) {
    tokens.add('museum');
    tokens.add('library');
    tokens.add('bookstore');
    tokens.add('gallery');
    tokens.add('church');
  }
  if (tokens.has('outdoors')) {
    tokens.add('park');
    tokens.add('nature');
    tokens.add('garden');
    tokens.add('trail');
    tokens.add('hike');
  }
  if (tokens.has('shopping')) {
    tokens.add('shop');
    tokens.add('store');
    tokens.add('mall');
    tokens.add('market');
  }
  if (tokens.has('attraction')) {
    tokens.add('landmark');
    tokens.add('monument');
    tokens.add('sightseeing');
    tokens.add('tourist');
  }

  return tokens;
};

const extractRequestedLocation = (question) => {
  const match = question.match(/\b(?:in|near|around|at)\s+([a-z][a-z\s.'-]{1,40})\b/i);
  if (!match) {
    return '';
  }

  const cleaned = match[1]
    .replace(/\?+$/g, '')
    .replace(/\b(?:please|thanks|thank|with|for)\b.*$/i, '')
    .trim();

  if (!cleaned) {
    return '';
  }

  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

const findRelevantPlaces = (query, limit = 6) => {
  const queryTokens = tokenizeForQuery(query);
  const requestedLocation = extractRequestedLocation(query);
  const requestedLocationTokensBase = tokenize(requestedLocation).map(normalizeQueryToken);
  const requestedLocationTokens = expandLocationTokens(requestedLocationTokensBase);
  const requiredLocationMatches = requestedLocationTokensBase.length <= 1 ? 1 : 2;

  const scored = data
    .map((place) => {
      const cityTokens = toTokenSet(place.city);
      const stateTokens = toTokenSet(place.state);
      const countryTokens = toTokenSet(place.country);
      const typeTokens = buildTypeTokenSet(place.type2);
      const nameTokens = toTokenSet(place.name);
      const supportTokens = toTokenSet([place.location, place.notes, place.address].join(' '));
      const geoTokens = toTokenSet([place.city, place.state, place.country, place.location, place.address].join(' '));

      const locationMatchCount = requestedLocationTokens.reduce(
        (count, token) => (geoTokens.has(token) ? count + 1 : count),
        0,
      );

      if (requestedLocationTokensBase.length > 0 && locationMatchCount < requiredLocationMatches) {
        return null;
      }

      let score = 0;
      let matchedTokens = 0;

      queryTokens.forEach((token) => {
        if (CREATOR_QUERY_TOKENS.has(token)) {
          if (place.creators_rec === 'Yes') {
            score += 6;
            matchedTokens += 1;
          }
          return;
        }

        if (cityTokens.has(token)) {
          score += 6;
          matchedTokens += 1;
          return;
        }

        if (stateTokens.has(token) || countryTokens.has(token)) {
          score += 5;
          matchedTokens += 1;
          return;
        }

        if (typeTokens.has(token)) {
          score += 4;
          matchedTokens += 1;
          return;
        }

        if (nameTokens.has(token)) {
          score += 3;
          matchedTokens += 1;
          return;
        }

        if (supportTokens.has(token)) {
          score += 2;
          matchedTokens += 1;
        }
      });

      if (queryTokens.length === 0) {
        score = place.creators_rec === 'Yes' ? 2 : 1;
      } else if (matchedTokens === 0) {
        return null;
      }

      if (place.creators_rec === 'Yes') {
        score += 0.4;
      }

      return {
        place,
        score,
      };
    })
    .filter((item) => item && item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.place);

  return scored;
};

const buildFallbackChatAnswer = (question, places) => {
  const requestedLocation = extractRequestedLocation(question);

  if (!places.length) {
    if (requestedLocation) {
      return `I do not have any submissions for ${requestedLocation} yet. You can add one through the Add a Place form and I will include it once it is reviewed.`;
    }

    return (
      "I couldn't find a close match in the dataset yet. " +
      'Try adding a city name, place type (coffee/food/other), or asking for creator picks.'
    );
  }

  const bullets = places
    .slice(0, 5)
    .map((place, index) => {
      const cityPart = place.city ? ` (${place.city})` : '';
      const note = place.notes ? place.notes : 'No notes yet.';
      return `${index + 1}. ${place.name || 'Unnamed place'}${cityPart} - ${note}`;
    })
    .join('\n');

  return [
    `Best matches for "${question}":`,
    '',
    bullets,
    '',
    'Want better results? Add a city and preferred vibe (for example: quiet cafe, creator rec, late-night food).',
  ].join('\n');
};

const fetchModelChatAnswer = async (question, places) => {
  const context = places.map((place) => ({
    name: place.name || '',
    city: place.city || '',
    state: place.state || '',
    country: place.country || '',
    type2: place.type2 || '',
    creators_rec: place.creators_rec || '',
    notes: place.notes || '',
    address: place.address || '',
    google_maps_link: place.google_maps_link || '',
    rating: place.rating || '',
  }));

  const response = await fetch('/.netlify/functions/ask-ava', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      context,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat function failed with ${response.status}`);
  }

  const payload = await response.json();

  if (!payload.answer) {
    throw new Error('No answer in function response');
  }

  return payload.answer;
};

const viewFromPath = (pathname) => {
  if (pathname === '/submit' || pathname === '/add') {
    return 'submit';
  }

  if (pathname === '/feature') {
    return 'feature';
  }

  if (pathname === '/chat') {
    return 'chat';
  }

  if (pathname === '/about') {
    return 'about';
  }

  return 'map';
};

const useIsMobile = (breakpoint = 820) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};

const createEmojiMarkerIcon = (emoji, creatorRec = false) =>
  L.divIcon({
    html: `<span class="emoji-marker${creatorRec ? ' emoji-marker-creator' : ''}">${emoji}</span>`,
    className: 'emoji-marker-wrapper',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const SearchControl = () => {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();

    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=5`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        },
      );
      const payload = await response.json();
      setResults(payload);
      setShowResults(payload.length > 0);
    } catch (error) {
      setResults([]);
      setShowResults(false);
      console.error('Search failed:', error);
    }

    setIsSearching(false);
  };

  const handleSelect = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    map.flyTo([lat, lon], 13, { duration: 1.2 });
    setQuery(result.display_name.split(',')[0]);
    setShowResults(false);
  };

  return (
    <div className="search-control" ref={wrapperRef}>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          className="search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a city or place"
          aria-label="Search places"
        />
        <button type="submit" className="search-btn" disabled={isSearching}>
          {isSearching ? '...' : 'GO'}
        </button>
      </form>

      {showResults && (
        <ul className="search-results">
          {results.map((result) => (
            <li key={`${result.place_id}-${result.lat}-${result.lon}`}>
              <button type="button" onClick={() => handleSelect(result)}>
                {result.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const MapClickHandler = ({ onMapClick, markerClickedRef }) => {
  useMapEvents({
    click: () => {
      if (markerClickedRef.current) {
        markerClickedRef.current = false;
        return;
      }

      onMapClick();
    },
  });

  return null;
};

const MapResizeFix = () => {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 120);

    const invalidate = () => map.invalidateSize();
    window.addEventListener('resize', invalidate);
    window.addEventListener('orientationchange', invalidate);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', invalidate);
      window.removeEventListener('orientationchange', invalidate);
    };
  }, [map]);

  return null;
};

const generateChallenge = () => {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return { question: `What is ${a} + ${b}?`, answer: a + b };
};

const SubmitPage = ({ onNavigate }) => {
  const [formData, setFormData] = useState(SUBMISSION_DEFAULTS);
  const [status, setStatus] = useState('idle');
  const [challenge, setChallenge] = useState(generateChallenge);
  const [challengeInput, setChallengeInput] = useState('');
  const hasCreatorCode = formData.creatorAccessCode.trim().length > 0;

  const handleFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    const fieldName = name === 'bot-field' ? 'botField' : name;
    setStatus('idle');
    setFormData((prev) => ({
      ...prev,
      [fieldName]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.botField.trim()) {
      return;
    }

    if (parseInt(challengeInput, 10) !== challenge.answer) {
      setStatus('bad-captcha');
      setChallenge(generateChallenge());
      setChallengeInput('');
      return;
    }

    setStatus('submitting');

    try {
      await submitNetlifyForm(PLACE_FORM_NAME, {
        contributor_name: formData.contributorName.trim(),
        contributor_email: formData.contributorEmail.trim(),
        place_name: formData.placeName.trim(),
        location: formData.location.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        category: formData.category,
        google_maps_link: formData.googleMapsLink.trim(),
        notes: formData.notes.trim(),
        creator_access_code: formData.creatorAccessCode.trim(),
        creators_rec_requested: hasCreatorCode && formData.creatorRec ? 'Yes' : 'No',
        'bot-field': formData.botField,
      });
      setStatus('success');
      setFormData(SUBMISSION_DEFAULTS);
      setChallenge(generateChallenge());
      setChallengeInput('');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <main className="content-page">
      <header className="page-header">
        <button type="button" className="pixel-link" onClick={() => onNavigate('map')}>
          <span aria-hidden="true">&lt;</span> Back to Map
        </button>
        <h1>Add a Place</h1>
        <p>
          This form submits directly to Netlify Forms with no account required. Every entry is
          reviewed before being merged into the map.
        </p>
      </header>

      <form
        className="pixel-form"
        onSubmit={handleSubmit}
        name={PLACE_FORM_NAME}
        method="POST"
        action={NETLIFY_FORM_ENDPOINT}
        data-netlify="true"
        netlify-honeypot="bot-field"
      >
        <input type="hidden" name="form-name" value={PLACE_FORM_NAME} />
        <label className="hidden-field" aria-hidden="true">
          Don&apos;t fill this out if you&apos;re human
          <input name="bot-field" value={formData.botField} onChange={handleFieldChange} tabIndex="-1" />
        </label>

        <label>
          Contributor Name
          <input
            name="contributorName"
            value={formData.contributorName}
            onChange={handleFieldChange}
            required
            placeholder="Your name"
            spellCheck="true"
          />
        </label>

        <label>
          Contributor Email (optional)
          <input
            name="contributorEmail"
            type="email"
            value={formData.contributorEmail}
            onChange={handleFieldChange}
            placeholder="name@example.com"
          />
        </label>

        <label>
          Place Name
          <input
            name="placeName"
            value={formData.placeName}
            onChange={handleFieldChange}
            required
            placeholder="e.g. Hidden Cafe"
            spellCheck="true"
          />
        </label>

        <label>
          Location / Neighborhood
          <input
            name="location"
            value={formData.location}
            onChange={handleFieldChange}
            required
            placeholder="e.g. Downtown Berkeley"
            spellCheck="true"
          />
        </label>

        <div className="form-grid">
          <label>
            City
            <input name="city" value={formData.city} onChange={handleFieldChange} required spellCheck="true" />
          </label>
          <label>
            State / Region
            <input name="state" value={formData.state} onChange={handleFieldChange} required spellCheck="true" />
          </label>
          <label>
            Country
            <input name="country" value={formData.country} onChange={handleFieldChange} required spellCheck="true" />
          </label>
        </div>

        <label>
          Category
          <select name="category" value={formData.category} onChange={handleFieldChange}>
            <option value="coffee">Coffee</option>
            <option value="food">Food</option>
            <option value="drinks">Drinks</option>
            <option value="culture">Culture</option>
            <option value="outdoors">Outdoors</option>
            <option value="shopping">Shopping</option>
            <option value="attraction">Attraction</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label>
          Google Maps Link (optional)
          <input
            name="googleMapsLink"
            value={formData.googleMapsLink}
            onChange={handleFieldChange}
            placeholder="https://maps.google.com/..."
          />
        </label>

        <label>
          Why is this place special?
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleFieldChange}
            required
            rows={5}
            placeholder="Share what makes this a tiny perfect thing."
            spellCheck="true"
          />
        </label>

        <details className="maintainer-options">
          <summary>Maintainer options</summary>
          <label>
            Maintainer access code (optional)
            <input
              type="password"
              name="creatorAccessCode"
              value={formData.creatorAccessCode}
              onChange={handleFieldChange}
              autoComplete="off"
            />
          </label>
          <label className="creator-toggle">
            <input
              type="checkbox"
              name="creatorRec"
              checked={formData.creatorRec}
              onChange={handleFieldChange}
              disabled={!hasCreatorCode}
            />
            Mark as creator recommendation
          </label>
          <p className="maintainer-note">Creator overrides are validated server-side.</p>
        </details>

        <label>
          {challenge.question} <span className="required-hint">(anti-spam check)</span>
          <input
            name="captcha"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={challengeInput}
            onChange={(e) => { setChallengeInput(e.target.value); setStatus('idle'); }}
            required
            placeholder="Your answer"
            autoComplete="off"
          />
        </label>

        <button type="submit" className="pixel-button primary" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Submitting...' : 'Submit Place'}
        </button>

        {status === 'success' ? (
          <p className="submit-note">Thanks. Your place was submitted successfully.</p>
        ) : null}
        {status === 'error' ? (
          <p className="submit-note error">Submission failed. Please try again in a moment.</p>
        ) : null}
        {status === 'bad-captcha' ? (
          <p className="submit-note error">Incorrect answer. Please try the new question.</p>
        ) : null}
      </form>
    </main>
  );
};

const FeaturePage = ({ onNavigate }) => {
  const [formData, setFormData] = useState(FEATURE_DEFAULTS);
  const [status, setStatus] = useState('idle');

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    const fieldName = name === 'bot-field' ? 'botField' : name;
    setStatus('idle');
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.botField.trim()) {
      return;
    }

    setStatus('submitting');

    try {
      await submitNetlifyForm(FEATURE_FORM_NAME, {
        requester_name: formData.requesterName.trim(),
        requester_email: formData.requesterEmail.trim(),
        summary: formData.summary.trim(),
        problem: formData.problem.trim(),
        proposal: formData.proposal.trim(),
        component: formData.component,
        'bot-field': formData.botField,
      });
      setStatus('success');
      setFormData(FEATURE_DEFAULTS);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <main className="content-page">
      <header className="page-header">
        <button type="button" className="pixel-link" onClick={() => onNavigate('map')}>
          <span aria-hidden="true">&lt;</span> Back to Map
        </button>
        <h1>Feature Requests</h1>
        <p>
          Share improvements for the map, data workflow, or chatbot. No sign-in required.
        </p>
      </header>

      <form
        className="pixel-form"
        onSubmit={handleSubmit}
        name={FEATURE_FORM_NAME}
        method="POST"
        action={NETLIFY_FORM_ENDPOINT}
        data-netlify="true"
        netlify-honeypot="bot-field"
      >
        <input type="hidden" name="form-name" value={FEATURE_FORM_NAME} />
        <label className="hidden-field" aria-hidden="true">
          Don&apos;t fill this out if you&apos;re human
          <input name="bot-field" value={formData.botField} onChange={handleFieldChange} tabIndex="-1" />
        </label>

        <label>
          Your Name
          <input name="requesterName" value={formData.requesterName} onChange={handleFieldChange} required />
        </label>

        <label>
          Email (optional)
          <input
            name="requesterEmail"
            type="email"
            value={formData.requesterEmail}
            onChange={handleFieldChange}
          />
        </label>

        <label>
          Feature Summary
          <input name="summary" value={formData.summary} onChange={handleFieldChange} required />
        </label>

        <label>
          Problem Statement
          <textarea name="problem" value={formData.problem} onChange={handleFieldChange} required rows={4} />
        </label>

        <label>
          Proposed Solution
          <textarea
            name="proposal"
            value={formData.proposal}
            onChange={handleFieldChange}
            required
            rows={5}
          />
        </label>

        <label>
          Component
          <select name="component" value={formData.component} onChange={handleFieldChange}>
            <option value="map web app">Map Web App</option>
            <option value="submission flow">Submission Flow</option>
            <option value="chatbot">Chatbot</option>
            <option value="data pipeline">Data Pipeline</option>
            <option value="docs">Documentation</option>
          </select>
        </label>

        <button type="submit" className="pixel-button primary" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Submitting...' : 'Submit Feature Request'}
        </button>

        {status === 'success' ? (
          <p className="submit-note">Thanks. Your feature request was submitted successfully.</p>
        ) : null}
        {status === 'error' ? (
          <p className="submit-note error">Submission failed. Please try again in a moment.</p>
        ) : null}
      </form>
    </main>
  );
};

const ChatPage = ({ onNavigate }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Ask me for places by city, vibe, or category. I will answer from the map dataset with no login required.',
      sources: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const question = input.trim();
    if (!question || isLoading) {
      return;
    }

    const userMessage = { role: 'user', content: question, sources: [] };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const candidates = findRelevantPlaces(question, 6);

    let answer = buildFallbackChatAnswer(question, candidates);

    if (candidates.length > 0) {
      try {
        answer = await fetchModelChatAnswer(question, candidates);
      } catch (error) {
        console.info('Falling back to local retrieval response:', error);
      }
    }

    const sources = candidates
      .slice(0, 5)
      .map((place) => ({
        label: `${place.name}${place.city ? ` (${place.city})` : ''}`,
        href: place.google_maps_link || '',
      }));

    const assistantMessage = {
      role: 'assistant',
      content: answer,
      sources,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  return (
    <main className="content-page chat-page">
      <header className="page-header">
        <button type="button" className="pixel-link" onClick={() => onNavigate('map')}>
          <span aria-hidden="true">&lt;</span> Back to Map
        </button>
        <h1>Ask Ava</h1>
        <p>No login required. Ava answers using submitted map data and cites matching places.</p>
      </header>

      <section className="chat-shell" aria-live="polite">
        <div className="chat-log">
          {messages.map((message, index) => (
            <article key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>
              <p>{message.content}</p>
              {message.sources?.length ? (
                <div className="chat-sources">
                  <strong>Sources:</strong>
                  <ul>
                    {message.sources.map((source) => (
                      <li key={source.label}>
                        {source.href ? (
                          <a href={source.href} target="_blank" rel="noopener noreferrer">
                            {source.label}
                          </a>
                        ) : (
                          source.label
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          ))}

          {isLoading ? <article className="chat-bubble assistant">Thinking...</article> : null}
        </div>

        <form className="chat-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask for cafes, food, hidden gems, or creator picks..."
            aria-label="Ask Ava"
          />
          <button type="submit" className="pixel-button primary" disabled={isLoading}>
            Send
          </button>
        </form>
      </section>
    </main>
  );
};

const AboutPage = ({ onNavigate }) => (
  <main className="content-page">
    <header className="page-header">
      <button type="button" className="pixel-link" onClick={() => onNavigate('map')}>
        <span aria-hidden="true">&lt;</span> Back to Map
      </button>
      <h1>About the Project</h1>
      <p>
        The Map of Tiny Perfect Things is a community atlas of places worth revisiting, built and
        curated by Dea, Harsh, and contributors from everywhere.
      </p>
    </header>

    <section className="about-grid">
      <article>
        <h2>What&apos;s inside</h2>
        <p>
          The map app helps you browse and filter entries. Ava turns the same dataset into a
          searchable recommendations assistant.
        </p>
      </article>

      <article>
        <h2>How to contribute</h2>
        <p>
          Add places or feature requests through no-login forms. Every contribution is reviewed
          before it lands in the master dataset.
        </p>
      </article>

      <article>
        <h2>Creators</h2>
        <p>
          Harshvardhan builds the data and product systems behind the project.
        </p>
        <p>
          Website: <a href="https://blog.harsh17.in/" target="_blank" rel="noopener noreferrer">blog.harsh17.in</a>
        </p>
        <p>
          Dea Bardhoshi leads curation and community storytelling for the map.
        </p>
        <p>
          Website: <a href="https://deabardhoshi.com/" target="_blank" rel="noopener noreferrer">deabardhoshi.com</a>
        </p>
      </article>

      <article>
        <h2>Open Source</h2>
        <p>
          Source code is public, and submissions are collected in a moderation inbox on Netlify.
        </p>
      </article>
    </section>
  </main>
);

const MapView = ({ onNavigate }) => {
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [introPanelHeight, setIntroPanelHeight] = useState(0);
  const markerClickedRef = useRef(false);
  const introPanelRef = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setPanelCollapsed(isMobile);
  }, [isMobile]);

  useEffect(() => {
    const panelElement = introPanelRef.current;
    if (!panelElement) {
      return undefined;
    }

    const syncPanelHeight = () => {
      setIntroPanelHeight(Math.ceil(panelElement.getBoundingClientRect().height));
    };

    syncPanelHeight();

    window.addEventListener('resize', syncPanelHeight);

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        window.removeEventListener('resize', syncPanelHeight);
      };
    }

    const resizeObserver = new ResizeObserver(syncPanelHeight);
    resizeObserver.observe(panelElement);

    return () => {
      window.removeEventListener('resize', syncPanelHeight);
      resizeObserver.disconnect();
    };
  }, [panelCollapsed, isMobile]);

  const filteredData = useMemo(() => {
    if (selectedType === 'all') {
      return data;
    }

    return data.filter((entry) => entry.type2 === selectedType);
  }, [selectedType]);

  const getMarkerEmoji = (place) => {
    if (place.creators_rec === 'Yes') {
      return '⭐';
    }

    switch (place.type2) {
      case 'coffee': return '☕';
      case 'food': return '🍜';
      case 'drinks': return '🍷';
      case 'culture': return '🏛';
      case 'outdoors': return '🌳';
      case 'shopping': return '🛍';
      case 'attraction': return '📍';
      default: return '🗺';
    }
  };

  const handleMarkerClick = useCallback((place) => {
    markerClickedRef.current = true;
    setSelectedPlace(place);
  }, []);

  return (
    <div
      className="app-shell map-view"
      style={{ '--intro-panel-height': `${introPanelHeight}px` }}
    >
      <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="leaflet-root" zoomControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />

        <SearchControl />
        <MapClickHandler onMapClick={() => setSelectedPlace(null)} markerClickedRef={markerClickedRef} />
        <MapResizeFix />

        {filteredData.map((place, index) => {
          const lat = Number(place.lat);
          const lng = Number(place.lng);

          if (Number.isNaN(lat) || Number.isNaN(lng)) {
            return null;
          }

          return (
            <Marker
              key={`${place.google_place_id || place.name}-${lat}-${lng}-${index}`}
              position={[lat, lng]}
              icon={createEmojiMarkerIcon(getMarkerEmoji(place), place.creators_rec === 'Yes')}
              eventHandlers={{ click: () => handleMarkerClick(place) }}
            />
          );
        })}
      </MapContainer>

      <aside className={`intro-panel${panelCollapsed ? ' collapsed' : ''}`} ref={introPanelRef}>
        <div className="panel-title-row">
          <h1>The Map of Tiny Perfect Things</h1>
          {isMobile ? (
            <button
              type="button"
              className="panel-toggle"
              onClick={() => setPanelCollapsed((prev) => !prev)}
              aria-label={panelCollapsed ? 'Expand project panel' : 'Collapse project panel'}
            >
              {panelCollapsed ? '+' : '-'}
            </button>
          ) : null}
        </div>

        {!panelCollapsed ? (
          <>
            <p>
              A living, crowd-powered atlas of coffee spots, food gems, and offbeat discoveries that
              feel like tiny perfect moments.
            </p>

            <div className="panel-actions">
              <button type="button" className="pixel-button" onClick={() => onNavigate('submit')}>
                Add a Place
              </button>
              <button type="button" className="pixel-button" onClick={() => onNavigate('feature')}>
                Feature Requests
              </button>
              <button type="button" className="pixel-button" onClick={() => onNavigate('chat')}>
                Ask Ava
              </button>
              <button type="button" className="pixel-button" onClick={() => onNavigate('about')}>
                About
              </button>
            </div>
          </>
        ) : null}
      </aside>

      {selectedPlace ? (
        <section className="place-card" role="dialog" aria-label={`Details for ${selectedPlace.name}`}>
          <button
            type="button"
            className="place-close"
            onClick={() => setSelectedPlace(null)}
            aria-label="Close place details"
          >
            x
          </button>
          <h3>{selectedPlace.name}</h3>
          {selectedPlace.creators_rec === 'Yes' ? (
            <p className="creator-badge">Creator&apos;s Rec</p>
          ) : null}
          <p>{selectedPlace.notes || 'No notes yet.'}</p>
          {selectedPlace.address ? <p><strong>Address:</strong> {selectedPlace.address}</p> : null}
          {selectedPlace.opening_hours ? (
            <p>
              <strong>Hours:</strong> {selectedPlace.opening_hours}
            </p>
          ) : null}
          <div className="place-footer">
            {selectedPlace.google_maps_link ? (
              <a href={selectedPlace.google_maps_link} target="_blank" rel="noopener noreferrer">
                Open in Google Maps
              </a>
            ) : null}
            {selectedPlace.rating ? (
              <span>
                {selectedPlace.rating} ({selectedPlace.user_ratings_total || 0} reviews)
              </span>
            ) : null}
          </div>
        </section>
      ) : null}

      <nav className="filter-bar" aria-label="Filter places">
        {[
          ['all', 'All'],
          ['coffee', '☕ Coffee'],
          ['food', '🍜 Food'],
          ['drinks', '🍷 Drinks'],
          ['culture', '🏛 Culture'],
          ['outdoors', '🌳 Outdoors'],
          ['shopping', '🛍 Shopping'],
          ['attraction', '📍 Attraction'],
          ['other', '🗺 Other'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`filter-button${selectedType === value ? ' active' : ''}`}
            onClick={() => setSelectedType(value)}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
};

function App() {
  const [view, setView] = useState(() => viewFromPath(window.location.pathname));

  const navigate = useCallback((nextView) => {
    const path = nextView === 'map' ? '/' : `/${nextView}`;

    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }

    setView(nextView);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setView(viewFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('map-mode', view === 'map');
    return () => document.body.classList.remove('map-mode');
  }, [view]);

  if (view === 'submit') {
    return <SubmitPage onNavigate={navigate} />;
  }

  if (view === 'feature') {
    return <FeaturePage onNavigate={navigate} />;
  }

  if (view === 'chat') {
    return <ChatPage onNavigate={navigate} />;
  }

  if (view === 'about') {
    return <AboutPage onNavigate={navigate} />;
  }

  return <MapView onNavigate={navigate} />;
}

export default App;
