import React from 'react';
import { useOutletContext } from 'react-router-dom';

const TripOverview = () => {
  const { trip } = useOutletContext();

  if (!trip) return null;

  const prefs = trip.preferences || {};
  const interests = Array.isArray(prefs.interests) ? prefs.interests : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Trip Details</h2>
        <div className="space-y-2 text-slate-700">
          <div><span className="font-semibold">Destination:</span> {trip.city}</div>
          <div><span className="font-semibold">Dates:</span> {trip.startDate} to {trip.endDate}</div>
          {typeof prefs.budget === 'number' && (
            <div><span className="font-semibold">Budget:</span> {prefs.budget} {trip.currency || prefs.budgetCurrency || 'USD'}</div>
          )}
          {interests.length > 0 && (
            <div>
              <span className="font-semibold">Interests:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {interests.map((it, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">{it}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripOverview;