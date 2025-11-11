import React from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import { getTrip } from '../services/trips.service';
import { cityImageEndpointUrl } from '../services/images.service';
import Chatbot from '../components/Chatbot';

const TabLink = ({ to, active, children }) => (
  <Link
    to={to}
    className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
      active ? 'bg-blue-600 !text-white' : 'bg-white/70 text-slate-700 hover:bg-white'
    }`}
  >
    {children}
  </Link>
);

const TabButton = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
      active ? 'bg-blue-600 !text-white' : 'bg-white/70 text-slate-700 hover:bg-white'
    }`}
  >
    {children}
  </button>
);

const TripLayout = () => {
  const { tripId } = useParams();
  const [trip, setTrip] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [showChatbot, setShowChatbot] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const data = await getTrip(tripId);
        setTrip(data);
      } catch (e) {
        setError('Failed to load trip');
      } finally {
        setLoading(false);
      }
    })();
  }, [tripId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-slate-600">Loading trip…</div>
      </div>
    );
  }
  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-red-600">{error || 'Trip not found'}</div>
      </div>
    );
  }

  const imgUrl = cityImageEndpointUrl(trip.city || trip.name, 1200, 400);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="relative">
        <img src={imgUrl} alt={trip.city || 'Trip'} className="w-full h-40 sm:h-48 md:h-56 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-sm">{trip.name || trip.city}</h1>
          <p className="text-white/90 text-sm">{trip.city}</p>
          <p className="text-white/90 text-xs mt-1">{trip.startDate} to {trip.endDate}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6">
        <div className="flex gap-3 mb-6 items-center">
          <TabLink to={`/trips/${tripId}`} active={location.pathname === `/trips/${tripId}`}>Overview</TabLink>
          <TabLink to={`/trips/${tripId}/itineraries`} active={location.pathname.startsWith(`/trips/${tripId}/itineraries`)}>Itinerary</TabLink>

          {/* Tab-style button for AI Assist, placed next to tabs */}
          <TabButton active={showChatbot} onClick={() => setShowChatbot((v) => !v)}>
            AI Assist
          </TabButton>
        </div>

        {showChatbot && (
          <div className="mb-6">
            <Chatbot tripId={trip._id} />
          </div>
        )}

        <Outlet context={{ trip }} />
      </div>
    </div>
  );
};

export default TripLayout;