import { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, Send, Activity, Zap, ArrowRight, Database } from 'lucide-react';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts';

// Set up axios instance pointing to your Render CRM backend
const api = axios.create({
  baseURL: 'https://xeno-crm-1-0z9a.onrender.com', // Replace with your actual Render CRM URL
});

interface CampaignStrategy {
  target_category: string;
  min_order_value: number;
  recommended_channel: string;
  message_template: string;
}

interface StatItem {
  name: string;
  count: number;
}

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategy, setStrategy] = useState<CampaignStrategy | null>(null);
  const [audienceSize, setAudienceSize] = useState(0);
  const [stats, setStats] = useState<StatItem[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/stats');
        const data = Object.entries(response.data).map(([key, value]) => ({
          name: key.toUpperCase(),
          count: value as number,
        }));
        setStats(data);
      } catch (error) {
        console.error("Error fetching execution stats:", error);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStrategy(null);
    try {
      const response = await api.post('/api/generate', { prompt });
      setStrategy(response.data.strategy);
      setAudienceSize(response.data.audience_size);
    } catch (error) {
      console.error(error);
      alert("Error generating campaign strategy. Check backend logs.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLaunch = async () => {
    if (!strategy) return;
    try {
      await api.post('/api/launch', { strategy, audience_size: audienceSize });
      alert(`Campaign launched successfully to ${audienceSize} customers!`);
      setPrompt('');
      setStrategy(null);
    } catch (error) {
      console.error(error);
      alert("Error launching campaign execution loop.");
    }
  };

  return (
    // completely new dark theme background
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-10 font-sans selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* MASSIVE NEW HEADER */}
        <header className="flex flex-col items-center justify-center text-center space-y-6 py-12">
          <div className="p-4 bg-slate-900 rounded-3xl border border-slate-800 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
            <Zap className="w-12 h-12 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 pb-2">
              XENO CORE
            </h1>
            <p className="text-lg md:text-xl font-medium text-slate-400 tracking-[0.3em] uppercase mt-4 flex items-center justify-center">
              <Database className="w-5 h-5 mr-3 text-blue-500" />
              Algorithmic Audience Routing
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Command Center */}
          <section className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
            
            <h2 className="text-3xl font-bold mb-6 flex items-center text-white">
              <Send className="w-8 h-8 mr-4 text-cyan-400" />
              Mission Intent
            </h2>
            
            <textarea
              className="w-full p-6 bg-slate-950 border border-slate-800 rounded-3xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none resize-none text-xl text-slate-300 placeholder-slate-600 transition-all"
              rows={4}
              placeholder="e.g., 'Target big spenders in Electronics over $200 and offer a 15% discount via Email.'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className="mt-6 w-full flex items-center justify-center bg-slate-800 text-white font-bold py-5 rounded-2xl hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 transition-all duration-300 text-xl group disabled:opacity-50"
            >
              {isGenerating ? (
                <span className="animate-pulse flex items-center text-cyan-400">
                  <Activity className="w-6 h-6 mr-3 animate-spin" /> Processing Matrix...
                </span>
              ) : (
                <span className="flex items-center group-hover:text-cyan-400 transition-colors">
                  Compile Strategy <ArrowRight className="w-6 h-6 ml-3 transform group-hover:translate-x-2 transition-transform" />
                </span>
              )}
            </button>

            {/* AI Strategy Preview */}
            {strategy && (
              <div className="mt-8 p-8 bg-slate-950 rounded-3xl border border-slate-800 relative">
                <h3 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center">
                  <Sparkles className="w-6 h-6 mr-3 text-purple-400" />
                  Parameters Locked
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                    <span className="block text-slate-500 text-sm font-bold mb-1 uppercase tracking-wider">Category</span>
                    <span className="text-xl font-bold text-white">{strategy.target_category}</span>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                    <span className="block text-slate-500 text-sm font-bold mb-1 uppercase tracking-wider">Min Spend</span>
                    <span className="text-xl font-bold text-emerald-400">${strategy.min_order_value}</span>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                    <span className="block text-slate-500 text-sm font-bold mb-1 uppercase tracking-wider">Audience</span>
                    <span className="text-xl font-bold text-blue-400">{audienceSize}</span>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                    <span className="block text-slate-500 text-sm font-bold mb-1 uppercase tracking-wider">Channel</span>
                    <span className="text-xl font-bold text-purple-400">{strategy.recommended_channel}</span>
                  </div>
                </div>

                <div className="p-6 bg-slate-900 rounded-2xl text-lg text-slate-300 font-mono border border-slate-800 border-l-4 border-l-cyan-500">
                  {strategy.message_template}
                </div>

                <button
                  onClick={handleLaunch}
                  className="mt-8 w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-xl py-5 rounded-2xl hover:from-cyan-500 hover:to-blue-500 shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all duration-300 transform hover:-translate-y-1"
                >
                  INITIALIZE DEPLOYMENT
                </button>
              </div>
            )}
          </section>

          {/* Right Column: Dashboard */}
          <section className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-purple-500 to-blue-600"></div>

            <h2 className="text-3xl font-bold mb-3 flex items-center text-white">
              <Activity className="w-8 h-8 mr-4 text-purple-400" />
              Live Telemetry
            </h2>
            <p className="text-lg text-slate-500 font-medium mb-8">
              Monitoring global channel webhooks.
            </p>
            
            <div className="flex-grow min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#475569" fontSize={14} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontWeight: 600 }} />
                  <YAxis stroke="#475569" fontSize={14} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{ fill: '#1e293b' }} 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '16px', color: '#fff' }}
                    itemStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" fill="url(#colorNeon)" radius={[8, 8, 0, 0]} animationDuration={1000} />
                  <defs>
                    <linearGradient id="colorNeon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}