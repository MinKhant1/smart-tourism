import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listMyTrips } from '../services/trips.service';
import { cityImageEndpointUrl } from '../services/images.service';

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const items = await listMyTrips();
        setTrips(items);
      } catch (e) {
        console.error('Failed to load trips', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Your Trips</h1>
          <Link to="/trip-selection" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Create Trip</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => {
            const title = trip.name || trip.city || 'Trip';
            const city = trip.city || title;
            const imgUrl = cityImageEndpointUrl(city, 900, 600);
            return (
              <div
                key={trip._id}
                className="relative rounded-xl overflow-hidden cursor-pointer group shadow hover:shadow-xl transition"
                onClick={() => navigate(`/trips/${trip._id}/itineraries`)}
              >
                {/* Image layer with graceful fallback */}
                <img
                  src={imgUrl}
                  alt={city}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Maintain aspect by spacer */}
                <div className="h-40 sm:h-48 md:h-56" />
                {/* Gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none" />
                {/* Content */}
                <div className="absolute inset-0 p-5 flex flex-col justify-end">
                  <h2 className="text-white text-xl font-semibold drop-shadow-sm">
                    {title}
                  </h2>
                  <p className="text-white/90 text-sm drop-shadow-sm">{city}</p>
                  <div className="mt-2 inline-flex items-center gap-2">
                    <span className="text-white/90 text-xs bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm">
                      {trip.startDate} to {trip.endDate}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {trips.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-600 mb-4">No trips yet. Create your first one!</p>
            <Link to="/trip-selection" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">Create Trip</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Trips;