import React, { useState } from 'react';
import { planTripFromText } from '../services/itineraryText.service';
import { planTripFromTextForTrip } from '../services/trips.service';
import { sendTripChat, getTripChatHistory } from '../services/chat.service';

const Chatbot = ({ onGenerateItinerary, tripId }) => {
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! I\'m your travel assistant. Let me help you create the perfect itinerary. What kind of activities are you most interested in?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Load persisted chat history for this trip (if any)
  React.useEffect(() => {
    (async () => {
      try {
        if (!tripId) return;
        const items = await getTripChatHistory(tripId);
        if (items.length > 0) {
          const mapped = items.map((m) => ({ type: m.role === 'assistant' ? 'bot' : 'user', text: m.content }));
          setMessages(mapped);
        }
      } catch (err) {
        console.warn('Failed to load chat history', err);
      }
    })();
  }, [tripId]);

  // Detect commands that should trigger itinerary generation
  const isGenerateCommand = (text) => {
    const t = String(text || '').trim().toLowerCase();
    return (
      t.includes('create itinerary') ||
      t.includes('create itineraries') ||
      t.startsWith('generate itinerary') ||
      t === 'generate itinerary'
    );
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { type: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    // Intercept generation keywords and trigger itinerary creation instead of regular chat
    if (isGenerateCommand(userMessage.text)) {
      setIsTyping(true);
      setMessages(prev => [...prev, { type: 'bot', text: 'Got it — generating your itinerary now…' }]);
      await handleGenerateItinerary();
      return;
    }

    setIsTyping(true);
    try {
      // Build chat history for backend (user/assistant roles)
      const history = messages.map(m => ({ role: m.type === 'bot' ? 'assistant' : 'user', content: m.text }));
      const { reply } = await sendTripChat(tripId, userMessage.text, history);
      setMessages(prev => [...prev, { type: 'bot', text: reply }]);
      setIsTyping(false);
    } catch (err) {
      console.error('Chatbot message failed', err);
      setMessages(prev => [...prev, { type: 'bot', text: 'Sorry, I had trouble answering that. Please try again.' }]);
      setIsTyping(false);
    }
  };

  const handleGenerateItinerary = async () => {
    try {
      setIsTyping(true);
      // Compose a simple query from last user message or default prompt
      const lastUser = [...messages]
        .reverse()
        .find(m => m.type === 'user' && !isGenerateCommand(m.text));
      const query = lastUser?.text || 'Plan a 3-day trip to Bangkok for 2 people';
      let itinerary;
      if (tripId) {
        itinerary = await planTripFromTextForTrip(tripId, query, {
          defaultCity: 'Bangkok',
          defaultCountry: 'Thailand',
          defaultPartySize: 2,
        });
      } else {
        itinerary = await planTripFromText(query, {
          defaultCity: 'Bangkok',
          defaultCountry: 'Thailand',
          defaultPartySize: 2,
          save: false,
        });
      }
      setIsTyping(false);
      if (typeof onGenerateItinerary === 'function') {
        onGenerateItinerary(itinerary);
      }
    } catch (err) {
      console.error('Chatbot generation failed, using fallback', err);
      setIsTyping(false);
      // Fallback: minimal mock
      const fallback = {
        city: 'Bangkok',
        startDate: '2025-01-01',
        endDate: '2025-01-03',
        days: [
          { date: '2025-01-01', activities: [{ time: '09:00', title: 'City Tour', type: 'sightseeing', cost_estimate: 50 }] },
        ],
        totals: { estimated_total_cost: 300 }
      };
      if (typeof onGenerateItinerary === 'function') {
        onGenerateItinerary(fallback);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Travel Assistant</h3>
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
      </div>
      
      <div className="h-64 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg">
        {messages.map((message, index) => (
          <div key={index} className={`mb-3 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-4 py-2 rounded-lg max-w-xs ${
              message.type === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}>
              {message.text}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="text-left mb-3">
            <div className="inline-block px-4 py-2 rounded-lg bg-gray-200 text-gray-600">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSendMessage}
          disabled={!input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition duration-300"
        >
          Send
        </button>
      </div>
      
      {typeof onGenerateItinerary === 'function' && (
        <button
          onClick={handleGenerateItinerary}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300"
        >
          Generate Itinerary
        </button>
      )}
    </div>
  );
};

export default Chatbot;