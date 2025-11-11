import React, { useState } from 'react';
import { planTripFromText } from '../services/itineraryText.service';
import { planTripFromTextForTrip } from '../services/trips.service';
import { sendTripChat, getTripChatHistory } from '../services/chat.service';
import { setActivityCompleted, updateActivityDetails } from '../services/itineraries.service';

const Chatbot = ({ onGenerateItinerary, tripId, itineraryId }) => {
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

  const parseCompleteCommand = (text) => {
    const t = String(text || '').trim().toLowerCase();
    // mark/check day X activity Y done
    const doneMatch = t.match(/^(mark|check)\s+day\s+(\d+)\s+activity\s+(\d+)\s+(done|complete|completed|checked)$/);
    const undoMatch = t.match(/^(unmark|uncheck)\s+day\s+(\d+)\s+activity\s+(\d+)$/);
    if (doneMatch) {
      return { dayIndex: Number(doneMatch[2]) - 1, activityIndex: Number(doneMatch[3]) - 1, completed: true };
    }
    if (undoMatch) {
      return { dayIndex: Number(undoMatch[2]) - 1, activityIndex: Number(undoMatch[3]) - 1, completed: false };
    }
    return null;
  };

  const parseReplaceTitleCommand = (text) => {
    const t = String(text || '');
    const m = t.match(/^(replace|update|edit)\s+day\s+(\d+)\s+activity\s+(\d+)\s+(?:with\s+)?(.+)$/i);
    if (!m) return null;
    return { dayIndex: Number(m[2]) - 1, activityIndex: Number(m[3]) - 1, title: m[4].trim() };
  };

  const parseSetFieldCommands = (text) => {
    const t = String(text || '');
    const time = t.match(/^set\s+day\s+(\d+)\s+activity\s+(\d+)\s+time\s+(\d{2}:\d{2})$/i);
    if (time) return { dayIndex: Number(time[1]) - 1, activityIndex: Number(time[2]) - 1, time: time[3] };
    const type = t.match(/^set\s+day\s+(\d+)\s+activity\s+(\d+)\s+type\s+(sightseeing|food|transport|shopping|nightlife|other)$/i);
    if (type) return { dayIndex: Number(type[1]) - 1, activityIndex: Number(type[2]) - 1, type: type[3].toLowerCase() };
    return null;
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

    // Intercept itinerary modification commands (complete/uncomplete, replace title, set time/type)
    const completionCmd = parseCompleteCommand(userMessage.text);
    const replaceTitleCmd = parseReplaceTitleCommand(userMessage.text);
    const setFieldCmd = parseSetFieldCommands(userMessage.text);

    if (itineraryId && (completionCmd || replaceTitleCmd || setFieldCmd)) {
      try {
        setIsTyping(true);
        if (completionCmd) {
          const ok = await setActivityCompleted(itineraryId, completionCmd.dayIndex, completionCmd.activityIndex, completionCmd.completed);
          const status = completionCmd.completed ? 'marked as done' : 'unchecked';
          setMessages(prev => [...prev, { type: 'bot', text: ok ? `Okay — activity ${completionCmd.activityIndex + 1} on day ${completionCmd.dayIndex + 1} ${status}.` : 'Hmm, I could not update that activity.' }]);
        } else if (replaceTitleCmd) {
          const ok = await updateActivityDetails(itineraryId, replaceTitleCmd.dayIndex, replaceTitleCmd.activityIndex, { title: replaceTitleCmd.title });
          setMessages(prev => [...prev, { type: 'bot', text: ok ? `Updated activity ${replaceTitleCmd.activityIndex + 1} on day ${replaceTitleCmd.dayIndex + 1} to “${replaceTitleCmd.title}”.` : 'I couldn’t update the activity title.' }]);
        } else if (setFieldCmd) {
          const ok = await updateActivityDetails(itineraryId, setFieldCmd.dayIndex, setFieldCmd.activityIndex, setFieldCmd);
          const key = setFieldCmd.time ? 'time' : 'type';
          const val = setFieldCmd[key];
          setMessages(prev => [...prev, { type: 'bot', text: ok ? `Set ${key} for activity ${setFieldCmd.activityIndex + 1} on day ${setFieldCmd.dayIndex + 1} to ${val}.` : `I couldn’t set ${key} for that activity.` }]);
        }
        setIsTyping(false);
        return;
      } catch (err) {
        console.error('Chatbot activity update failed', err);
        setMessages(prev => [...prev, { type: 'bot', text: 'Sorry, I had trouble updating that activity.' }]);
        setIsTyping(false);
        return;
      }
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