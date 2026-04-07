const API_BASE_URL = "http://localhost:8000/v1";

export interface Ticket {
  wb: number[];
  mb: number;
  strategy?: string;
}

export interface PredictionResponse {
  run_id: string;
  target_draw_date: string;
  predictions: Ticket[];
  budget: number;
  bankroll_at_pred: number;
  ensemble_weights: Record<string, any>;
}

export interface DistributionValue {
  number: number;
  probability: number;
}

export interface DistributionResponse {
  wb_distribution: DistributionValue[];
  mb_distribution: DistributionValue[];
  last_updated: string;
}

export interface SimulationRequest {
  tickets: Ticket[];
  draw_count: number;
}

export interface SimulationResult {
  total_spent: number;
  total_won: number;
  net_profit: number;
  roi: number;
  win_count: number;
  draw_count: number;
}

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE_URL}/health`);
    return res.json();
  },

  async predict(numTickets?: number): Promise<PredictionResponse> {
    const url = numTickets ? `${API_BASE_URL}/predict?num_tickets=${numTickets}` : `${API_BASE_URL}/predict`;
    const res = await fetch(url, { method: "POST" });
    if (!res.ok) throw new Error("Failed to fetch prediction");
    return res.json();
  },

  async getDistributions(): Promise<DistributionResponse> {
    const res = await fetch(`${API_BASE_URL}/distributions`);
    if (!res.ok) throw new Error("Failed to fetch distributions");
    return res.json();
  },

  async simulate(data: SimulationRequest): Promise<SimulationResult> {
    const res = await fetch(`${API_BASE_URL}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Simulation failed");
    return res.json();
  },
};
