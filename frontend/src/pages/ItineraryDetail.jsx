import React from 'react';
import { useParams } from 'react-router-dom';
import { getItinerary, setActivityCompleted } from '../services/itineraries.service';

const ItineraryDetail = () => {
  const { itineraryId } = useParams();
  const [itinerary, setItinerary] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      try {
        const data = await getItinerary(itineraryId);
        setItinerary(data);
      } catch (e) {
        setError('Failed to load itinerary');
      } finally {
        setLoading(false);
      }
    })();
  }, [itineraryId]);

  const toggleActivity = async (dayIdx, actIdx) => {
    try {
      const current = itinerary.days?.[dayIdx]?.activities?.[actIdx]?.completed === true;
      // Optimistic UI update
      const next = !current;
      setItinerary((prev) => {
        const copy = JSON.parse(JSON.stringify(prev));
        if (copy?.days?.[dayIdx]?.activities?.[actIdx]) {
          copy.days[dayIdx].activities[actIdx].completed = next;
        }
        return copy;
      });
      const ok = await setActivityCompleted(itinerary._id, dayIdx, actIdx, next);
      if (!ok) throw new Error('Save failed');
    } catch (e) {
      console.warn('Failed to update activity', e);
    }
  };

  if (loading) return (<div className="min-h-screen flex items-center justify-center"><div className="text-slate-600">Loading itinerary…</div></div>);
  if (error) return (<div className="min-h-screen flex items-center justify-center"><div className="text-red-600">{error}</div></div>);
  if (!itinerary) return null;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">{itinerary.city}</h1>
            <p className="text-gray-600">{itinerary.startDate} to {itinerary.endDate}</p>
          </div>

          <div className="space-y-8">
            {itinerary.days?.map((day, dayIdx) => (
              <div key={dayIdx} className="border-t pt-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">
                  <span className="inline-block mr-2 px-2 py-1 rounded bg-slate-100 text-slate-700 text-sm">Day {dayIdx + 1}</span>
                  {day.date} — {day.summary}
                </h2>
                <ul className="space-y-3">
                  {day.activities?.map((act, actIdx) => (
                    <li key={actIdx} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={!!act.completed}
                        onChange={() => toggleActivity(dayIdx, actIdx)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">
                          <span className="inline-flex items-center justify-center mr-2 w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold">
                            {actIdx + 1}
                          </span>
                          {act.title}
                        </div>
                        <div className="text-sm text-slate-600">{act.time} · {act.type}</div>
                        {act.notes && <div className="text-sm text-slate-500">{act.notes}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryDetail;