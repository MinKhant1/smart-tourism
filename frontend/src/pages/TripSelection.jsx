import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTrip } from '../services/trips.service';

const TripSelection = () => {
  const navigate = useNavigate();
  const [tripData, setTripData] = useState({
    city: '',
    startDate: '',
    endDate: '',
    budget: '',
    interests: []
  });

  // Removed chatbot; navigate directly to itineraries after creating a trip

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTripData(prev => ({ ...prev, [name]: value }));
  };

  const handleInterestChange = (interest) => {
    setTripData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const trip = await createTrip({
        name: tripData.city,
        city: tripData.city,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        preferences: { interests: tripData.interests, budget: tripData.budget }
      });
      navigate(`/trips/${trip._id}/itineraries`);
    } catch (err) {
      console.error('Failed to create trip', err);
    }
  };


  const interestOptions = [
    'Adventure', 'Culture', 'Food', 'History', 'Nature', 'Shopping',
    'Nightlife', 'Photography', 'Relaxation', 'Sports', 'Art', 'Music'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Plan Your Perfect Trip</h1>
            <p className="text-gray-600 text-lg">Tell us about your travel preferences and we'll create a personalized itinerary</p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Trip Selection Form */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Trip Details</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Destination City</label>
                  <input
                    type="text"
                    name="city"
                    value={tripData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={tripData.startDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={tripData.endDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget ($)</label>
                  <input
                    type="number"
                    name="budget"
                    value={tripData.budget}
                    onChange={handleInputChange}
                    placeholder="Enter your budget"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
                  <div className="grid grid-cols-2 gap-2">
                    {interestOptions.map((interest) => (
                      <label key={interest} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={tripData.interests.includes(interest)}
                          onChange={() => handleInterestChange(interest)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold"
                >
                  Generate Itinerary
                </button>
              </form>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripSelection;