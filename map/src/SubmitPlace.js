import React, { useState } from 'react';
import { MDBCard, MDBCardBody, MDBCardTitle } from 'mdb-react-ui-kit';
import './SubmitPlace.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const CATEGORIES = [
  { value: 'coffee', label: 'Coffee', emoji: '☕️' },
  { value: 'food', label: 'Food', emoji: '🍱' },
  { value: 'books', label: 'Books', emoji: '📚' },
  { value: 'nature', label: 'Nature', emoji: '🌲' },
  { value: 'art', label: 'Art', emoji: '🎨' },
  { value: 'music', label: 'Music', emoji: '🎵' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍' },
  { value: 'nightlife', label: 'Nightlife', emoji: '🌙' },
  { value: 'wellness', label: 'Wellness', emoji: '🧘' },
  { value: 'others', label: 'Other', emoji: '🏝' },
];

const SubmitPlace = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    city: '',
    state: '',
    country: 'United States of America',
    notes: '',
    type2: '',
    submitted_by: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate required fields
    if (!formData.name || !formData.city || !formData.type2) {
      setError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/places/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to submit place');
      }

      setSuccess(true);
      setFormData({
        name: '',
        location: '',
        city: '',
        state: '',
        country: 'United States of America',
        notes: '',
        type2: '',
        submitted_by: '',
      });

      // Close modal after delay
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="submit-overlay" onClick={onClose}>
      <div className="submit-modal" onClick={e => e.stopPropagation()}>
        <MDBCard>
          <MDBCardBody>
            <button className="submit-close-btn" onClick={onClose}>×</button>
            <MDBCardTitle className="submit-title">
              Add a Place
            </MDBCardTitle>

            {success ? (
              <div className="submit-success">
                <span className="success-icon">✓</span>
                <p>Thank you! Your submission is pending review.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="submit-form">
                {error && <div className="submit-error">{error}</div>}

                <div className="form-group">
                  <label htmlFor="name">Place Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Blue Bottle Coffee"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="type2">Category *</label>
                  <div className="category-grid">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.value}
                        type="button"
                        className={`category-btn ${formData.type2 === cat.value ? 'selected' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, type2: cat.value }))}
                      >
                        <span className="category-emoji">{cat.emoji}</span>
                        <span className="category-label">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location / Neighborhood</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Ferry Building, Downtown"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g., San Francisco"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="state">State</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="e.g., California"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="country">Country</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Why is this place special? *</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Tell us what makes this place a tiny perfect thing..."
                    rows={3}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="submitted_by">Your Email (optional)</label>
                  <input
                    type="email"
                    id="submitted_by"
                    name="submitted_by"
                    value={formData.submitted_by}
                    onChange={handleChange}
                    placeholder="We'll notify you when approved"
                  />
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Place'}
                </button>
              </form>
            )}
          </MDBCardBody>
        </MDBCard>
      </div>
    </div>
  );
};

export default SubmitPlace;
