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
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center space-x-3 pb-6 border-b border-gray-200">
          <Sparkles className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold tracking-tight">Xeno AI-Native CRM</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN: AI Command Center */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Send className="w-5 h-5 mr-2 text-gray-500" />
              Campaign Intent
            </h2>
            
            <textarea
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              rows={4}
              placeholder="e.g., 'Target shoppers who bought coffee in the last 30 days and send them a WhatsApp promo code.'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className="mt-4 w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {isGenerating ? "Analyzing Database..." : "Generate Strategy"}
            </button>

            {/* AI Strategy Preview Card */}
            {strategy && (
              <div className="mt-6 p-5 bg-indigo-50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="font-bold text-indigo-900 mb-2">AI Proposal</h3>
                <ul className="space-y-2 text-sm text-indigo-800 mb-4">
                  <li><strong>Target Category:</strong> {strategy.target_category}</li>
                  <li><strong>Min Spend:</strong> ${strategy.min_order_value}</li>
                  <li><strong>Audience Size:</strong> {audienceSize} shoppers found</li>
                  <li><strong>Channel:</strong> {strategy.recommended_channel}</li>
                </ul>
                <div className="p-3 bg-white rounded-lg text-sm text-gray-700 italic border border-indigo-100">
                  "{strategy.message_template}"
                </div>
                <button
                  onClick={handleLaunch}
                  className="mt-4 w-full bg-indigo-900 text-white font-bold py-3 rounded-lg hover:bg-indigo-950 transition shadow-md"
                >
                  🚀 Launch to {audienceSize} Shoppers
                </button>
              </div>
            )}
          </section>

          {/* RIGHT COLUMN: Real-Time Dashboard */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-gray-500" />
              Live Loop Execution
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Watch this chart update in real-time as your Celery worker dispatches jobs and the Channel Stub webhooks return statuses.
            </p>
            
            <div className="flex-grow min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: '#f3f4f6'}} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}