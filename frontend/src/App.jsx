import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import TripSelection from './pages/TripSelection';
import Itineraries from './pages/Itineraries';
import Trips from './pages/Trips';
import ItineraryDetail from './pages/ItineraryDetail';
import TripLayout from './pages/TripLayout';
import TripOverview from './pages/TripOverview';
import TripAiAssist from './pages/TripAiAssist';
import AuthService from './services/auth.service';
import Onboarding from './pages/Onboarding';

function App() {
  const Root = () => {
    const token = localStorage.getItem('token');
    return token ? <Navigate to="/trips" replace /> : <Home />;
  };
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/trip-selection" element={<TripSelection />} />
        {/* Nested trip routes: default Overview, plus Itinerary and AI Assist */}
        <Route path="/trips/:tripId" element={<TripLayout />}>
          <Route index element={<TripOverview />} />
          <Route path="itineraries" element={<Itineraries />} />
          <Route path="itinerary/:itineraryId" element={<ItineraryDetail />} />
          <Route path="assist" element={<TripAiAssist />} />
        </Route>
        {/* Legacy routes remain available */}
        <Route path="/itineraries" element={<Itineraries />} />
        <Route path="/itineraries/:itineraryId" element={<ItineraryDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
