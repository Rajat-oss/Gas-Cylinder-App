import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Phone, Search, Target, TrendingUp, Truck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { searchLocation } from '../services/rapidMaps';
import socketService from '../services/socket';

// Fix for default marker icons in modern bundlers
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Driver Card Component
const DriverStatusCard = ({ driver, onFocus }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-blue-500/50 transition-all group relative overflow-hidden">
    {/* Progress Gradient Background */}
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br transition-opacity duration-500 opacity-0 group-hover:opacity-10 pointer-events-none ${
      driver.progress >= 80 ? 'from-emerald-500 to-transparent' : 'from-blue-500 to-transparent'
    }`} />
    
    <div className="flex justify-between items-start mb-6">
      <div className="flex gap-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center relative shadow-inner overflow-hidden border border-slate-700">
           <div className="absolute inset-0 bg-gradient-to-tr from-slate-800 to-slate-700" />
           <span className="relative text-2xl font-black text-white">{driver.name?.charAt(0)}</span>
           <div className={`absolute bottom-1 right-1 w-3 h-3 ${driver.isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'} border-2 border-slate-900 rounded-full`}></div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{driver.name}</h3>
            {driver.isOnline && (
              <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-1.5 py-0.5 rounded border border-emerald-500/20 animate-pulse">LIVE</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mt-1">
            <Truck size={12}/>
            <span>{driver.vehicleNumber || 'No Vehicle'}</span>
            <span className="mx-1">•</span>
            <Phone size={12}/>
            <span>{driver.phone}</span>
          </div>
        </div>
      </div>
      <button 
        onClick={() => driver.latitude && onFocus([driver.latitude, driver.longitude])}
        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-700 active:scale-90 disabled:opacity-30"
        title="Locate Driver"
        disabled={!driver.latitude}
      >
        <Navigation size={18} />
      </button>
    </div>

    <div className="space-y-4">
      {/* last seen info */}
      {!driver.isOnline && driver.lastSeen && (
         <div className="mb-2 text-[10px] font-bold text-slate-600 uppercase">
             Last Active: {new Date(driver.lastSeen).toLocaleString()}
         </div>
      )}
      <div className="flex justify-between items-end mb-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Shift Progress</span>
        <span className="text-sm font-black text-white">{driver.progress}%</span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${
            driver.progress >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-blue-600 to-blue-400'
          }`}
          style={{ width: `${driver.progress}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-800/50 text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Total</p>
          <p className="text-sm font-black text-white">{driver.totalOrders}</p>
        </div>
        <div className="bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10 text-center">
          <p className="text-[10px] font-bold text-emerald-500/60 uppercase mb-1">Done</p>
          <p className="text-sm font-black text-emerald-400">{driver.doneOrders}</p>
        </div>
        <div className="bg-amber-500/5 p-3 rounded-2xl border border-amber-500/10 text-center">
          <p className="text-[10px] font-bold text-amber-500/60 uppercase mb-1">Left</p>
          <p className="text-sm font-black text-amber-400">{driver.totalOrders - driver.doneOrders}</p>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={14} className="text-emerald-500" />
          <span className="text-xs font-bold text-slate-300">₹{driver.collection} Collected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin size={14} className={driver.latitude ? 'text-blue-500' : 'text-slate-600'} />
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            {driver.latitude ? `${driver.latitude.toFixed(4)}, ${driver.longitude.toFixed(4)}` : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  </div>
);

const LiveMonitoring = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    
    // Map Refs
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef({});

    // Initialize Map (Native Leaflet - No Context Errors)
    useEffect(() => {
        if (mapRef.current && !mapInstance.current) {
            try {
                // Leaflet map initialization
                const map = L.map(mapRef.current, {
                    center: [28.6139, 77.2090],
                    zoom: 13,
                    zoomControl: false,
                    layers: [
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        })
                    ]
                });

                L.control.zoom({ position: 'bottomright' }).addTo(map);
                mapInstance.current = map;
            } catch (err) {
                console.error("Map initialization error:", err);
            }
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // Fetch Drivers & Update Markers
    const fetchDrivers = async () => {
        try {
            const res = await api.get('/staff');
            const activeDrivers = res.data.filter(u => u.role === 'DRIVER');
            setDrivers(activeDrivers);

            // Update markers on map
            const onlineDriverIds = new Set();
            activeDrivers.forEach(driver => {
                if (driver.isOnline && driver.latitude && driver.longitude) {
                    onlineDriverIds.add(driver.id);
                    const coords = [driver.latitude, driver.longitude];
                    
                    if (markersRef.current[driver.id]) {
                        markersRef.current[driver.id].setLatLng(coords);
                    } else {
                        const marker = L.marker(coords, { icon: DefaultIcon })
                            .addTo(mapInstance.current)
                            .bindPopup(`
                                <div class="p-2">
                                    <h4 class="font-bold text-slate-900">${driver.name}</h4>
                                    <p class="text-xs text-slate-600">${driver.vehicleNumber || 'No Vehicle'}</p>
                                    <div class="mt-2 h-1 w-full bg-slate-200 rounded">
                                        <div class="h-full bg-blue-500 rounded" style="width: ${driver.progress}%"></div>
                                    </div>
                                    <p class="text-[10px] font-bold text-blue-600 mt-1">${driver.progress}% Progress</p>
                                </div>
                            `);
                        markersRef.current[driver.id] = marker;
                    }
                }
            });

            // Remove markers for drivers who are no longer online
            Object.keys(markersRef.current).forEach(id => {
                if (!onlineDriverIds.has(id)) {
                    markersRef.current[id].remove();
                    delete markersRef.current[id];
                }
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrivers();
        
        // Connect to Socket.io for real-time tracking
        const socket = socketService.connect();

        socket.on('driverLocationUpdate', (update) => {
            console.log('Real-time location update:', update);
            
            // Update drivers state (point-in-time)
            setDrivers(prev => prev.map(d => 
                d.id === update.id 
                    ? { ...d, latitude: update.latitude, longitude: update.longitude, isOnline: true } 
                    : d
            ));

            // Move marker if it exists, or create it if driver newly online
            if (update.latitude && update.longitude && mapInstance.current) {
                const coords = [update.latitude, update.longitude];
                if (markersRef.current[update.id]) {
                    markersRef.current[update.id].setLatLng(coords);
                } else {
                    // This case should be handled by the next full fetch or if we want extra reactive markers:
                    const marker = L.marker(coords, { icon: DefaultIcon })
                        .addTo(mapInstance.current)
                        .bindPopup(`<b>${update.name}</b><br>Just updated location`);
                    markersRef.current[update.id] = marker;
                }
            }
        });

        // Still keep a slow poll for overall status sync (progress, etc.)
        const interval = setInterval(fetchDrivers, 30000); 
        
        return () => {
            clearInterval(interval);
            socket.off('driverLocationUpdate');
        };
    }, []);

    const handleFocusDriver = (coords) => {
        if (mapInstance.current) {
            mapInstance.current.setView(coords, 16, { animate: true });
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const results = await searchLocation(searchQuery);
            if (results && results.length > 0) {
                // Focus on first result
                const firstResult = results[0];
                
                let lat, lng;
                
                // Try different potential response formats
                if (firstResult.latitude && firstResult.longitude) {
                    lat = parseFloat(firstResult.latitude);
                    lng = parseFloat(firstResult.longitude);
                } else if (firstResult.address) {
                    // Try to extract from address string if present like "lat,lng"
                    const coordsMatch = firstResult.address.match(/(-?\d+\.\d+),(-?\d+\.\d+)/);
                    if (coordsMatch) {
                        lat = parseFloat(coordsMatch[1]);
                        lng = parseFloat(coordsMatch[2]);
                    }
                }

                if (lat && lng) {
                    mapInstance.current.flyTo([lat, lng], 15, { duration: 2 });
                    
                    // Add temporary marker for search result
                    L.marker([lat, lng], {
                        icon: L.divIcon({
                            html: `<div class="w-4 h-4 bg-rose-500 border-2 border-white rounded-full animate-ping"></div>`,
                            className: '',
                            iconSize: [16, 16]
                        })
                    }).addTo(mapInstance.current).bindPopup(`<b>Search Result:</b><br>${firstResult.address || searchQuery}`).openPopup();
                }
            }
        } catch (err) {
            console.error('Search failed', err);
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24">
            {/* Header with Search */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                        Live Fleet Control
                    </h2>
                    <p className="text-slate-400 mt-1 italic tracking-wide">Real-time driver positioning & operational metrics</p>
                </div>

                <form onSubmit={handleSearch} className="relative group max-w-md w-full">
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search customer location or area..."
                        className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500/50 rounded-2xl py-4 pl-12 pr-24 text-white placeholder-slate-600 outline-none transition-all shadow-xl"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <button 
                        type="submit"
                        disabled={searching}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-bold px-4 text-sm disabled:opacity-50"
                    >
                        {searching ? '...' : 'Search'}
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {drivers.filter(d => d.isOnline).map(driver => (
                    <DriverStatusCard key={driver.id} driver={driver} onFocus={handleFocusDriver} />
                ))}
                {drivers.filter(d => d.isOnline).length === 0 && !loading && (
                    <div className="col-span-full py-24 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-[2.5rem] backdrop-blur-sm">
                        <Truck size={64} className="mx-auto text-slate-800 mb-6 animate-bounce" />
                        <h3 className="text-2xl font-black text-slate-700 uppercase tracking-widest">No Active Drivers</h3>
                        <p className="text-slate-600 mt-2 font-bold uppercase text-xs">Awaiting staff GPS connectivity...</p>
                    </div>
                )}
            </div>

            {/* Map Section */}
            <div className="relative">
                <div className="absolute top-6 left-6 z-10 hidden md:block">
                     <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-2xl flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                             <Target size={24} />
                         </div>
                         <div>
                             <p className="text-xs font-black text-slate-500 uppercase">Live Connectivity</p>
                             <p className="text-sm font-bold text-white">Google Maps API Active <span className="ml-2 inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span></p>
                         </div>
                     </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-4 h-[600px] shadow-2xl relative overflow-hidden group">
                    <div 
                        ref={mapRef} 
                        style={{ height: '100%', width: '100%', borderRadius: '2.5rem' }} 
                        className="z-0"
                    />
                    
                    {/* Glass Overlay on Hover */}
                    <div className="absolute inset-x-8 bottom-8 z-10 flex gap-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                         <div className="bg-slate-900/90 backdrop-blur-lg border border-slate-800 px-6 py-3 rounded-2xl text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                             <img src={iconUrl} alt="marker" className="w-3 h-5" /> 
                             Operational Units
                         </div>
                         <div className="bg-slate-900/90 backdrop-blur-lg border border-slate-800 px-6 py-3 rounded-2xl text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                             <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_emerald]" /> 
                             GPS Signal Stable
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveMonitoring;
