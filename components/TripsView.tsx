import React, { useState } from 'react';
import { Plus, Settings, ArrowLeft, Calendar, MapPin, Camera } from 'lucide-react';

interface Trip {
  id: string;
  name: string;
  location: string;
  date: string;
  color: string;
}

const PASTEL_COLORS = [
  'bg-[#B4B0FF]', // Periwinkle
  'bg-[#FFC4DD]', // Pink
  'bg-[#FFD68A]', // Yellow/Orange
  'bg-[#C4D9FF]', // Light Blue
  'bg-[#C1E1C1]', // Pastel Green
];

// Mock initial data based on screenshot
const INITIAL_TRIPS: Trip[] = [
  {
    id: '1',
    name: 'Reykjavik, Iceland',
    location: 'Reykjavik, Iceland',
    date: '24 Jun 2025',
    color: 'bg-[#B4B0FF]'
  },
  {
    id: '2',
    name: 'Paris, France 2025',
    location: 'Paris, France',
    date: '2 Jul 2025',
    color: 'bg-[#FFC4DD]'
  },
  {
    id: '3',
    name: 'Sicily, Italy',
    location: 'Sicily, Italy',
    date: '26 May 2025',
    color: 'bg-[#FFD68A]'
  },
  {
    id: '4',
    name: 'Greece 2026',
    location: 'Athens, Greece',
    date: 'Plan your trip',
    color: 'bg-[#C4D9FF]'
  }
];

export const TripsView: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [newTripName, setNewTripName] = useState('');

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripName.trim()) return;

    const newTrip: Trip = {
      id: crypto.randomUUID(),
      name: newTripName,
      location: newTripName, // Using name as location for simplicity for now
      date: 'Just planned',
      color: PASTEL_COLORS[trips.length % PASTEL_COLORS.length]
    };

    setTrips([...trips, newTrip]);
    setNewTripName('');
    setIsAdding(false);
  };

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  // If a trip is selected, show the details view
  if (selectedTrip) {
    return (
      <div className="flex flex-col h-full animate-fade-in bg-white">
        <div className="p-6 pt-2 flex items-center gap-4">
          <button 
            onClick={() => setSelectedTripId(null)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold truncate">{selectedTrip.name}</h2>
        </div>
        
        <div className={`mx-6 mb-8 p-8 rounded-[2.5rem] ${selectedTrip.color} min-h-[200px] flex flex-col justify-between shadow-sm`}>
          <div className="flex gap-2 mb-4">
            <div className="w-10 h-10 bg-black/10 backdrop-blur-sm rounded-full flex items-center justify-center text-black/60">
              <Camera size={20} />
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-black/60 mb-1">{selectedTrip.date}</div>
            <h1 className="text-3xl font-black text-black/80 leading-tight">{selectedTrip.name}</h1>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-t-[3rem]">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <Settings className="text-gray-400 animate-spin-slow" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Under Development</h3>
          <p className="text-gray-500">
            Trip details and splitting features for "{selectedTrip.name}" are coming soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="px-6 pt-2 pb-4 flex items-center justify-between sticky top-0 bg-white z-20">
        <h1 className="text-3xl font-black tracking-tight text-black">Trip Way</h1>
        <div className="flex gap-3">
          <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
            <Settings size={20} strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors shadow-lg"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Trips Stack */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-4 no-scrollbar">
        {trips.map((trip, index) => (
          <div 
            key={trip.id}
            onClick={() => setSelectedTripId(trip.id)}
            className={`
              sticky top-0
              w-full 
              rounded-[2.5rem] 
              p-6 md:p-8 
              min-h-[220px] 
              cursor-pointer 
              transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1)
              hover:scale-[1.02] 
              active:scale-[0.98]
              shadow-md
              ${trip.color}
            `}
            style={{ 
              top: `${index * 100}px`, // Increased offset to show more of the card (name area)
              marginBottom: index === trips.length - 1 ? '120px' : '0' 
            }}
          >
            {/* Card Content */}
            <div className="flex flex-col h-full justify-between relative z-10">
               {/* Top Info (Name & Date) */}
               <div className="flex flex-col gap-1">
                 <p className="text-xs font-bold text-black/50 tracking-wide uppercase">{trip.date}</p>
                 <h2 className="text-2xl md:text-3xl font-black text-black/80 tracking-tight leading-tight line-clamp-2">{trip.name}</h2>
               </div>

               {/* Bottom Icons */}
               <div className="flex gap-2 mt-4">
                 <div className="w-10 h-10 bg-black/5 backdrop-blur-sm rounded-full flex items-center justify-center text-black/60">
                   <Camera size={18} />
                 </div>
                 <div className="w-10 h-10 bg-black/5 backdrop-blur-sm rounded-full flex items-center justify-center text-black/60">
                   <span className="text-lg">🚶</span>
                 </div>
                 <div className="w-10 h-10 bg-black/5 backdrop-blur-sm rounded-full flex items-center justify-center text-black/60">
                   <MapPin size={18} />
                 </div>
               </div>
            </div>
          </div>
        ))}
        
        {/* Empty state bottom spacer to allow scrolling past last item */}
        <div className="h-32" />
      </div>

      {/* Add Trip Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center animate-fade-in">
          <div className="bg-white w-full md:max-w-md md:rounded-[2.5rem] rounded-t-[2.5rem] p-8 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">New Trip</h2>
              <button 
                onClick={() => setIsAdding(false)}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="-rotate-90 md:rotate-0" />
              </button>
            </div>

            <form onSubmit={handleCreateTrip}>
              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Trip Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newTripName}
                  onChange={(e) => setNewTripName(e.target.value)}
                  placeholder="e.g. Euro Trip 2025"
                  className="w-full text-2xl font-bold border-b-2 border-gray-200 py-2 focus:outline-none focus:border-black transition-colors bg-transparent placeholder:text-gray-300"
                />
              </div>

              <button
                type="submit"
                disabled={!newTripName.trim()}
                className="w-full py-5 bg-black text-white rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
              >
                Save Trip
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
