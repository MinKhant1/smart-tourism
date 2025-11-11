import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Form from '../components/Form';
import Input from '../components/Input';
import Button from '../components/Button';
import AuthService from '../services/auth.service';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    AuthService.login(email, password).then(
      () => {
        navigate('/trip-selection');
      },
      (error) => {
        console.log(error);
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl ring-1 ring-slate-200">
        <div className="px-8 pt-8 pb-4">
          <h1 className="text-3xl font-bold text-center text-slate-800">Welcome back</h1>
          <p className="mt-2 text-center text-slate-600">Sign in to continue planning your trip</p>
        </div>

        <div className="px-8 pb-8">
          <Form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
              <Input
                type="email"
                id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <Input
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 transition shadow-sm"
            >
              Sign in
            </Button>
          </Form>

          <p className="text-center text-slate-600 mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-700">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;