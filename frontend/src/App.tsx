// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Send, Sparkles, Activity } from 'lucide-react';
import { generateCampaign, launchCampaign, fetchStats, type CampaignStrategy } from './api';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategy, setStrategy] = useState<CampaignStrategy | null>(null);
  const [audienceSize, setAudienceSize] = useState<number>(0);
  const [customerIds, setCustomerIds] = useState<number[]>([]);
  const [stats, setStats] = useState([]);

  // Poll for stats every 3 seconds to watch the callback loop in action
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await fetchStats();
        // Assume backend returns: [{ name: 'Pending', count: 10 }, { name: 'Delivered', count: 40 }, ...]
        setStats(data);
      } catch (error) {
        console.error("Stats fetching failed");
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const data = await generateCampaign(prompt);
      setStrategy(data.strategy);
      setAudienceSize(data.audience_size);
      setCustomerIds(data.matched_customer_ids);
    } catch (error) {
      alert("Error generating campaign.");
    }
    setIsGenerating(false);
  };

  const handleLaunch = async () => {
    if (!strategy) return;
    try {
      await launchCampaign(prompt, strategy, customerIds);
      alert("Campaign dispatched to the queue!");
      setStrategy(null); // Reset after sending
    } catch (error) {
      alert("Failed to launch campaign.");
    }
  };

  return (
    // 1. Added a beautiful, subtle gradient background to the whole app
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 font-sans text-gray-800 selection:bg-indigo-100">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header - Upgraded with gradient text */}
        <header className="flex items-center space-x-3 pb-6 border-b border-gray-200/60">
          <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl shadow-inner">
            <Sparkles className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Xeno Spark
            </h1>
            <p className="text-sm font-medium text-gray-500 tracking-wide uppercase mt-1">AI Campaign Copilot</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN: AI Command Center */}
          {/* Added a subtle shadow and backdrop blur for a glass effect */}
          <section className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-xl shadow-indigo-100/50 border border-white/50">
            <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
              <Send className="w-5 h-5 mr-2 text-indigo-500" />
              Campaign Intent
            </h2>
            
            <textarea
              className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none transition-all"
              rows={4}
              placeholder="e.g., 'Target shoppers who bought coffee in the last 30 days and send them a WhatsApp promo code.'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              // Upgraded button with gradient, shadow, and hover scale
              className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3.5 rounded-2xl hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-200 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
            >
              {isGenerating ? "Analyzing Database..." : "Generate Strategy"}
            </button>

            {/* AI Strategy Preview Card */}
            {strategy && (
              <div className="mt-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100/50 animate-in fade-in slide-in-from-bottom-4 shadow-inner">
                <h3 className="font-extrabold text-indigo-900 mb-3 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                  AI Proposal Ready
                </h3>
                <ul className="space-y-2 text-sm text-indigo-800/80 mb-5 font-medium">
                  <li className="flex justify-between"><span>Target Category:</span> <span className="font-bold text-indigo-900">{strategy.target_category}</span></li>
                  <li className="flex justify-between"><span>Min Spend:</span> <span className="font-bold text-indigo-900">${strategy.min_order_value}</span></li>
                  <li className="flex justify-between"><span>Audience Size:</span> <span className="font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-full">{audienceSize} shoppers</span></li>
                  <li className="flex justify-between"><span>Optimal Channel:</span> <span className="font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-full">{strategy.recommended_channel}</span></li>
                </ul>
                <div className="p-4 bg-white rounded-xl text-sm text-gray-700 italic border border-indigo-100 shadow-sm">
                  "{strategy.message_template}"
                </div>
                <button
                  onClick={handleLaunch}
                  className="mt-5 w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black hover:shadow-xl hover:shadow-gray-300 transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  🚀 Launch to {audienceSize} Shoppers
                </button>
              </div>
            )}
          </section>

          {/* RIGHT COLUMN: Real-Time Dashboard */}
          <section className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-xl shadow-indigo-100/50 border border-white/50 flex flex-col">
            <h2 className="text-xl font-bold mb-2 flex items-center text-gray-800">
              <Activity className="w-5 h-5 mr-2 text-purple-500" />
              Live Loop Execution
            </h2>
            <p className="text-sm text-gray-500 font-medium mb-6">
              Real-time callback monitoring from the channel delivery service.
            </p>
            
            <div className="flex-grow min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats}>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f3f4f6'}} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  {/* Made the bars use a nice purple color with rounded tops */}
                  <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

        </div>
      </div>
    </div>
  );