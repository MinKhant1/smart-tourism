import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Welcome to Smart Tourism
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Discover amazing destinations and create your perfect itinerary with our AI-powered travel assistant.
          </p>
          <div className="space-x-4">
            <Link
              to="/signup"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition duration-300"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-medium border border-blue-600 hover:bg-blue-50 transition duration-300"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;