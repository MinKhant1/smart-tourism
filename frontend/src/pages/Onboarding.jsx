import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/auth.service';

const interestOptions = [
  'Adventure', 'Culture', 'Food', 'History', 'Nature', 'Shopping',
  'Nightlife', 'Photography', 'Relaxation', 'Sports', 'Art', 'Music'
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const toggleInterest = (interest) => {
    setSelected(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };

  const handleSkip = () => {
    navigate('/trips');
  };

  const handleSave = async () => {
    try {
      await AuthService.updatePreferences({ interests: selected });
    } catch (err) {
      console.error('Failed to save preferences', err);
    }
    navigate('/trips');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Tell Us Your Interests</h1>
            <p className="text-gray-600">Choose a few interests to personalize your trips. You can skip this for now.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {interestOptions.map((interest) => (
              <label key={interest} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(interest)}
                  onChange={() => toggleInterest(interest)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{interest}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-between">
            <button onClick={handleSkip} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">Skip</button>
            <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Save & Continue</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;