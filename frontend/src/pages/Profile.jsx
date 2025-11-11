import React, { useState, useEffect } from 'react';
import AuthService from '../services/auth.service';

const interestOptions = [
  'Adventure', 'Culture', 'Food', 'History', 'Nature', 'Shopping',
  'Nightlife', 'Photography', 'Relaxation', 'Sports', 'Art', 'Music'
];

const Chip = ({ label }) => (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
    {label}
  </span>
);

const Profile = () => {
  const [currentUser, setCurrentUser] = useState(undefined);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      const interests = user?.preferences?.interests || [];
      setSelected(interests);
    }
  }, []);

  const toggleInterest = (interest) => {
    setSelected(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSavedMsg('');
      const user = await AuthService.updatePreferences({ interests: selected });
      if (user) {
        setCurrentUser(user);
        setSavedMsg('Interests saved successfully.');
      }
    } catch (err) {
      console.error('Failed to save interests', err);
      setSavedMsg('Failed to save interests. Please try again.');
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(''), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <div className="h-32 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg"></div>
          </div>

          <div className="mt-0 bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 overflow-hidden relative z-10">
            <div className="p-8">
              {currentUser ? (
                <>
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-md mr-4">
                      {(currentUser.name || currentUser.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900">{currentUser.name || 'Traveler'}</h1>
                      <p className="text-slate-600">{currentUser.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">User ID</p>
                      <p className="text-slate-900 break-all">{currentUser.id}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Home City</p>
                      <p className="text-slate-900">{currentUser?.preferences?.homeCity || '—'}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Currency</p>
                      <p className="text-slate-900">{currentUser?.preferences?.currency || '—'}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Language</p>
                      <p className="text-slate-900">{currentUser?.preferences?.language || '—'}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">Your Interests</h2>
                    {selected.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selected.map((i) => (
                          <Chip key={i} label={i} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-600">No interests selected yet.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 p-6 bg-slate-50">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Edit Interests</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      {interestOptions.map((interest) => (
                        <label key={interest} className="flex items-center space-x-2 p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selected.includes(interest)}
                            onChange={() => toggleInterest(interest)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700">{interest}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm ${savedMsg.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>{savedMsg}</p>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`px-5 py-2 rounded-lg font-semibold ${saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                      >
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-600 mb-4">Please log in to view your profile.</p>
                  <a
                    href="/login"
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
                  >
                    Login
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;