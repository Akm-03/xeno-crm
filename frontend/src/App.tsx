import  { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, Send, Activity, Zap, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts';

// Set up axios instance pointing to your Render CRM backend
const api = axios.create({
  baseURL: 'https://xeno-crm.onrender.com', // Replace with your actual Render CRM URL
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

  // Periodically fetch real-time stats from the backend
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
      alert("Error generating campaign strategy. Please check backend logs.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLaunch = async () => {
    if (!strategy) return;
    try {
      await api.post('/api/launch', {
        strategy,
        audience_size: audienceSize,
      });
      alert(`Campaign launched successfully to ${audienceSize} customers!`);
      setPrompt('');
      setStrategy(null);
    } catch (error) {
      console.error(error);
      alert("Error launching campaign execution loop.");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-100 via-white to-fuchsia-50 p-6 md:p-10 font-sans text-gray-800 selection:bg-fuchsia-200 selection:text-fuchsia-900">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Section - Upgraded with massive text and gradient */}
        <header className="flex flex-col items-center justify-center text-center space-y-4 pb-8 border-b border-gray-200/50">
          <div className="p-3 bg-gradient-to-br from-violet-100 to-fuchsia-100 rounded-2xl shadow-inner border border-white">
            <Zap className="w-10 h-10 text-violet-600 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 drop-shadow-sm">
              Xeno Spark
            </h1>
            <p className="text-sm md:text-base font-bold text-gray-500 tracking-[0.2em] uppercase mt-3">
              Intelligent Campaign Copilot
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Left Column: AI Command Center */}
          <section className="bg-white/70 backdrop-blur-md p-8 rounded-3xl shadow-xl shadow-violet-100/50 border border-white/60 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-200/50 hover:-translate-y-1 group">
            <h2 className="text-2xl font-extrabold mb-6 flex items-center text-gray-800 group-hover:text-violet-700 transition-colors">
              <Send className="w-6 h-6 mr-3 text-violet-500" />
              Campaign Intent
            </h2>
            
            <textarea
              className="w-full p-5 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-fuchsia-400/20 focus:border-fuchsia-400 outline-none resize-none transition-all duration-200 shadow-inner text-gray-700 text-lg"
              rows={4}
              placeholder="e.g., 'Target shoppers who bought coffee in the last 30 days and send them a WhatsApp promo code.'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className="mt-6 w-full flex items-center justify-center bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-fuchsia-200 hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-2xl hover:shadow-fuchsia-300 transform hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none text-lg"
            >
              {isGenerating ? (
                <span className="animate-pulse flex items-center">
                  <Activity className="w-5 h-5 mr-2 animate-spin" /> Analyzing Database...
                </span>
              ) : (
                <span className="flex items-center">
                  Generate Strategy <ArrowRight className="w-5 h-5 ml-2" />
                </span>
              )}
            </button>

            {/* AI Strategy Preview Card - Highlighting text */}
            {strategy && (
              <div className="mt-8 p-7 bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-2xl border-2 border-violet-200 animate-in fade-in slide-in-from-bottom-8 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-violet-400 to-fuchsia-400"></div>
                <h3 className="text-xl font-black text-violet-900 mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-fuchsia-500" />
                  AI Proposal Ready
                </h3>
                
                <ul className="space-y-3 text-base text-violet-800/90 mb-6 font-medium">
                  <li className="flex justify-between items-center border-b border-violet-100 pb-2">
                    <span>Target Category:</span> 
                    <span className="font-bold text-violet-900 bg-white px-3 py-1 rounded-lg shadow-sm border border-violet-100">{strategy.target_category}</span>
                  </li>
                  <li className="flex justify-between items-center border-b border-violet-100 pb-2">
                    <span>Minimum Spend:</span> 
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg shadow-sm border border-emerald-100">${strategy.min_order_value}</span>
                  </li>
                  <li className="flex justify-between items-center border-b border-violet-100 pb-2">
                    <span>Audience Size:</span> 
                    <span className="font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg shadow-sm border border-blue-100">{audienceSize} shoppers</span>
                  </li>
                  <li className="flex justify-between items-center pb-1">
                    <span>Optimal Channel:</span> 
                    <span className="font-bold text-fuchsia-700 bg-fuchsia-100 px-3 py-1 rounded-lg shadow-sm border border-fuchsia-200">{strategy.recommended_channel}</span>
                  </li>
                </ul>

                <div className="p-5 bg-white rounded-xl text-base text-gray-700 italic border border-violet-100 shadow-sm relative">
                  <span className="text-4xl text-violet-200 absolute top-2 left-2 select-none">"</span>
                  <span className="relative z-10">{strategy.message_template}</span>
                </div>

                <button
                  onClick={handleLaunch}
                  className="mt-6 w-full flex justify-center items-center bg-gray-900 text-white font-black text-lg py-4 rounded-xl hover:bg-black shadow-xl shadow-gray-400/50 transform hover:-translate-y-1 active:scale-95 transition-all duration-200"
                >
                  🚀 Launch to {audienceSize} Shoppers
                </button>
              </div>
            )}
          </section>

          {/* Right Column: Real-Time Dashboard */}
          <section className="bg-white/70 backdrop-blur-md p-8 rounded-3xl shadow-xl shadow-violet-100/50 border border-white/60 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-200/50 hover:-translate-y-1 flex flex-col group">
            <h2 className="text-2xl font-extrabold mb-2 flex items-center text-gray-800 group-hover:text-fuchsia-700 transition-colors">
              <Activity className="w-6 h-6 mr-3 text-fuchsia-500" />
              Live Loop Execution
            </h2>
            <p className="text-base text-gray-500 font-medium mb-8">
              Real-time callback monitoring from the channel delivery service.
            </p>
            
            <div className="flex-grow min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280" 
                    fontSize={13} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#4b5563', fontWeight: 600 }}
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={13} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }} 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                      fontWeight: 'bold',
                      color: '#4c1d95'
                    }}
                  />
                  {/* Upgraded bar styling */}
                  <Bar 
                    dataKey="count" 
                    fill="url(#colorUv)" 
                    radius={[8, 8, 0, 0]}
                    animationDuration={1500}
                  />
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#d946ef" stopOpacity={0.8}/>
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