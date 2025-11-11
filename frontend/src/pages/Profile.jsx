import React, { useState, useEffect } from 'react';
import AuthService from '../services/auth.service';

const Profile = () => {
  const [currentUser, setCurrentUser] = useState(undefined);

  useEffect(() => {
    const user = AuthService.getCurrentUser();

    if (user) {
      setCurrentUser(user);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">User Profile</h1>
          {currentUser ? (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Name</label>
                <p className="text-gray-900">{currentUser.name}</p>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Email</label>
                <p className="text-gray-900">{currentUser.email}</p>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">User ID</label>
                <p className="text-gray-900">{currentUser.id}</p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">Please log in to view your profile.</p>
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
  );
};

export default Profile;