// frontend/src/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://xeno-crm-1-0z9a.onrender.com', // Your FastAPI CRM port
});

export interface CampaignStrategy {
  min_order_value: number;
  target_category: string;
  recommended_channel: string;
  message_template: string;
}

export const generateCampaign = async (prompt: string) => {
  const response = await api.post('/api/campaign/generate', { prompt });
  return response.data;
};

export const launchCampaign = async (
  prompt: string,
  strategy: CampaignStrategy,
  customerIds: number[]
) => {
  const response = await api.post(`/api/campaign/launch?prompt=${encodeURIComponent(prompt)}&channel=${strategy.recommended_channel}&message_template=${encodeURIComponent(strategy.message_template)}`, customerIds);
  return response.data;
};

// We will need this endpoint in your FastAPI backend to fetch stats!
export const fetchStats = async () => {
  const response = await api.get('/api/stats');
  return response.data;
};