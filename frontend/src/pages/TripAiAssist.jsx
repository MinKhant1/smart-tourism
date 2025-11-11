import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import Chatbot from '../components/Chatbot';
import { getTripSingleItinerary } from '../services/trips.service';

const TripAiAssist = () => {
  const { trip } = useOutletContext();
  const navigate = useNavigate();
  const [itineraryId, setItineraryId] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      try {
        if (!trip?._id) return;
        const itinerary = await getTripSingleItinerary(trip._id);
        setItineraryId(itinerary?._id || null);
      } catch (err) {
        // Ignore if none; generation will create one
      }
    })();
  }, [trip?._id]);

  const handleGenerated = (itinerary) => {
    try {
      const id = itinerary?._id;
      if (id) {
        navigate(`/trips/${trip._id}/itinerary/${id}`);
      }
    } catch {}
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">AI Assist</h2>
      <p className="text-sm text-slate-600 mb-4">
        Chat with AI about this trip. You can also generate a new itinerary and jump straight to its details.
      </p>
      <Chatbot tripId={trip._id} itineraryId={itineraryId} onGenerateItinerary={handleGenerated} />
    </div>
  );
};

export default TripAiAssist;