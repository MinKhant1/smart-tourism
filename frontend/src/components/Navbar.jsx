import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/auth.service';

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const current = AuthService.getCurrentUser();
    setUser(current);
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="bg-white/90 backdrop-blur-sm border-b border-slate-200">
      <div className="container mx-auto flex justify-between items-center py-4">
        <Link to="/" className="text-slate-900 text-2xl font-bold">
          Smart Tourism
        </Link>
        <ul className="flex items-center space-x-6 list-none">
          <li>
            <Link to="/" className="text-slate-700 hover:text-slate-900">Home</Link>
          </li>
          {user ? (
            <>
              <li>
                <Link to="/trips" className="text-slate-700 hover:text-slate-900">Trips</Link>
              </li>
              <li>
                <Link to="/trip-selection" className="text-slate-700 hover:text-slate-900">Create Trip</Link>
              </li>
              <li>
                <Link to="/profile" className="text-slate-700 hover:text-slate-900">Profile</Link>
              </li>
              <li>
                <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Logout</button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className="text-slate-700 hover:text-slate-900">Login</Link>
              </li>
              <li>
                <Link to="/signup" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Signup</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;