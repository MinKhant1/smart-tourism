import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listMyTrips } from '../services/trips.service';

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
          {trips.map((trip) => (
            <div key={trip._id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate(`/trips/${trip._id}/itineraries`)}>
              <h2 className="text-xl font-bold text-gray-800 mb-1">{trip.name || trip.city}</h2>
              <p className="text-gray-600 mb-1">{trip.city}</p>
              <p className="text-gray-600">{trip.startDate} to {trip.endDate}</p>
            </div>
          ))}
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