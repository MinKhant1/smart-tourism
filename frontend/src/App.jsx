import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import TripSelection from './pages/TripSelection';
import Itineraries from './pages/Itineraries';
import Trips from './pages/Trips';
import ItineraryDetail from './pages/ItineraryDetail';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/trip-selection" element={<TripSelection />} />
        <Route path="/itineraries" element={<Itineraries />} />
        <Route path="/trips/:tripId/itineraries" element={<Itineraries />} />
        <Route path="/itineraries/:itineraryId" element={<ItineraryDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
