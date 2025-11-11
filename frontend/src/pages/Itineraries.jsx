import React, { useState, useEffect } from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { getTripItineraries } from '../services/trips.service';
import Chatbot from '../components/Chatbot';

const Itineraries = () => {
  const location = useLocation();
  const { tripId } = useParams();
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    const backendItinerary = location.state?.backendItinerary;
    const legacyTripData = location.state?.tripData;

    (async () => {
      try {
        if (tripId) {
          const items = await getTripItineraries(tripId);
          const mapped = items.map(mapBackendItinerary);
          setItineraries(mapped);
          setLoading(false);
          return;
        }
        if (backendItinerary) {
          const mapped = mapBackendItinerary(backendItinerary);
          setItineraries([mapped]);
          localStorage.setItem('itineraries', JSON.stringify([mapped]));
          setLoading(false);
        } else if (legacyTripData) {
          await generateItinerary(legacyTripData);
        } else {
          const savedItineraries = JSON.parse(localStorage.getItem('itineraries') || '[]');
          setItineraries(savedItineraries);
          setLoading(false);
        }
      } catch (e) {
        console.error('Failed to load itineraries', e);
        setLoading(false);
      }
    })();
  }, [location, tripId]);

  const generateItinerary = async (tripData) => {
    try {
      // Mock itinerary data - in a real app, this would be an API call
      const mockItinerary = {
        id: Date.now(),
        city: tripData.city,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        budget: tripData.budget,
        interests: tripData.interests,
        activities: [
          {
            day: 1,
            title: "Explore the City Center",
            description: "Visit the main square and historic landmarks",
            time: "09:00 - 12:00",
            cost: 50
          },
          {
            day: 1,
            title: "Local Cuisine Experience",
            description: "Try authentic local dishes at recommended restaurants",
            time: "12:30 - 14:00",
            cost: 80
          },
          {
            day: 1,
            title: "Museum Visit",
            description: "Explore the city's most famous museum",
            time: "15:00 - 17:00",
            cost: 30
          }
        ],
        createdAt: new Date().toISOString()
      };

      setItineraries([mockItinerary]);
      localStorage.setItem('itineraries', JSON.stringify([mockItinerary]));
    } catch (error) {
      console.error('Error generating itinerary:', error);
    } finally {
      setLoading(false);
    }
  };

  const mapBackendItinerary = (itinerary) => {
    const activities = (itinerary?.days || []).flatMap((day) =>
      (day.activities || []).map((a) => ({
        day: day.date,
        title: a.title,
        description: a.notes || '',
        time: a.time,
        cost: a.cost_estimate || 0,
      }))
    );

    return {
      id: itinerary._id || Date.now(),
      city: itinerary.city || 'Trip',
      startDate: itinerary.startDate || '',
      endDate: itinerary.endDate || '',
      budget: itinerary.totals?.estimated_total_cost || 0,
      interests: itinerary.interests || [],
      activities,
      createdAt: itinerary.createdAt || new Date().toISOString(),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your perfect itinerary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Your Itineraries</h1>
          {tripId ? (
            <button
              onClick={() => setShowChatbot((v) => !v)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-300 font-semibold"
            >
              {showChatbot ? 'Close Chatbot' : 'New Itinerary with AI'}
            </button>
          ) : (
            <Link
              to="/trip-selection"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold"
            >
              Create Trip
            </Link>
          )}
        </div>
        
        {showChatbot && tripId && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Plan a new itinerary for this trip</h2>
              <Chatbot
                tripId={tripId}
                onGenerateItinerary={async () => {
                  // Refresh list after saving
                  const items = await getTripItineraries(tripId);
                  const mapped = items.map(mapBackendItinerary);
                  setItineraries(mapped);
                  setShowChatbot(false);
                }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {itineraries.map((itinerary) => (
            <div key={itinerary.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition duration-300">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-800 mb-2">{itinerary.city}</h2>
                <p className="text-gray-600 mb-2">
                  {itinerary.startDate} to {itinerary.endDate}
                </p>
                <p className="text-gray-600 mb-2">Budget: ${itinerary.budget}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {itinerary.interests.map((interest, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">Activities:</h3>
                <div className="space-y-2">
                  {itinerary.activities.slice(0, 2).map((activity, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-3">
                      <p className="font-medium text-gray-800">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.time}</p>
                    </div>
                  ))}
                  {itinerary.activities.length > 2 && (
                    <p className="text-sm text-blue-600">+{itinerary.activities.length - 2} more activities</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Created: {new Date(itinerary.createdAt).toLocaleDateString()}
                </span>
                <Link to={tripId ? `/trips/${tripId}/itinerary/${itinerary.id}` : `/itineraries/${itinerary.id}`} className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        {itineraries.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-600 mb-4">No itineraries yet. Create your first one!</p>
            <Link
              to="/trip-selection"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Plan Your Trip
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Itineraries;