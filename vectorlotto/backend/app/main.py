import os
import sys
from typing import List, Dict
from datetime import datetime
import random

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

# Add engine to path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENGINE_DIR = os.path.join(BASE_DIR, "engine")
sys.path.append(ENGINE_DIR)

from app.schemas import (
    Ticket, PredictionResponse, DistributionResponse, 
    DistributionValue, SimulationRequest, SimulationResult
)
from engine.utils import load_history, calculate_frequency, calculate_overdue
from engine.mab_engine import (
    load_mab_state, kelly_budget, allocate_tickets, 
    ensemble_wb_probs, ensemble_mb_probs, STRATEGIES, TICKET_COST
)
from engine.predictor import draw_ensemble_ticket, build_hot_weights, build_cold_weights, build_hybrid_weights, build_uniform_weights
from engine.evaluator import PAYOUTS, evaluate_ticket

app = FastAPI(title="VectorLotto API", version="1.0.0")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Dependency ────────────────────────────────────────────────────────────────

def get_engine_data():
    try:
        df = load_history()
        mab_state = load_mab_state()
        return df, mab_state
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load engine data: {str(e)}")

# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "Welcome to VectorLotto API. Statistical Lottery Simulation Engine."}

@app.get("/v1/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/v1/predict", response_model=PredictionResponse)
async def predict_tickets(num_tickets: int = None):
    df, mab_state = get_engine_data()
    
    # Kelly Budget if not specified
    if num_tickets is None:
        budget, thetas, kelly_fracs = kelly_budget(mab_state)
    else:
        budget = num_tickets
        _, thetas, kelly_fracs = kelly_budget(mab_state) # still need thetas for allocation

    allocation = allocate_tickets(budget, thetas)
    
    # Weights for ensemble
    wb_counts, mb_counts = calculate_frequency(df)
    wb_last_seen, mb_last_seen = calculate_overdue(df)
    
    all_wb_weights = {
        "A-hot": build_hot_weights(wb_counts, mb_counts)[0],
        "B-cold": build_cold_weights(wb_last_seen, mb_last_seen)[0],
        "D-hybrid": build_hybrid_weights(wb_counts, mb_counts, wb_last_seen, mb_last_seen)[0],
        "C-random": build_uniform_weights()[0],
    }
    all_mb_weights = {
        "A-hot": build_hot_weights(wb_counts, mb_counts)[1],
        "B-cold": build_cold_weights(wb_last_seen, mb_last_seen)[1],
        "D-hybrid": build_hybrid_weights(wb_counts, mb_counts, wb_last_seen, mb_last_seen)[1],
        "C-random": build_uniform_weights()[1],
    }
    
    wb_ensemble = ensemble_wb_probs(mab_state, all_wb_weights)
    mb_ensemble = ensemble_mb_probs(mab_state, all_mb_weights)
    
    predictions = []
    for strategy, n in allocation.items():
        for _ in range(n):
            t = draw_ensemble_ticket(wb_ensemble, mb_ensemble)
            predictions.append(Ticket(wb=t["wb"], mb=t["mb"], strategy=strategy))
            
    # Metadata snapshot
    ensemble_snapshot = {
        s: {
            "theta": round(thetas[s], 6),
            "kelly_f": round(kelly_fracs[s], 6),
            "ema_roi": round(mab_state["strategies"][s]["ema_roi"], 6),
            "allocation": allocation[s],
        }
        for s in STRATEGIES
    }
    
    # Next draw date logic (Tue/Fri)
    from engine.predictor import get_next_draw_date
    next_date = get_next_draw_date(df["DrawDate"].iloc[0])
    
    return PredictionResponse(
        run_id="run_" + str(random.getrandbits(32)),
        target_draw_date=next_date,
        predictions=predictions,
        budget=budget,
        bankroll_at_pred=mab_state["virtual_bankroll"],
        ensemble_weights=ensemble_snapshot
    )

@app.get("/v1/distributions", response_model=DistributionResponse)
async def get_distributions():
    df, mab_state = get_engine_data()
    
    wb_counts, mb_counts = calculate_frequency(df)
    wb_last_seen, mb_last_seen = calculate_overdue(df)
    
    all_wb_weights = {
        "A-hot": build_hot_weights(wb_counts, mb_counts)[0],
        "B-cold": build_cold_weights(wb_last_seen, mb_last_seen)[0],
        "D-hybrid": build_hybrid_weights(wb_counts, mb_counts, wb_last_seen, mb_last_seen)[0],
        "C-random": build_uniform_weights()[0],
    }
    all_mb_weights = {
        "A-hot": build_hot_weights(wb_counts, mb_counts)[1],
        "B-cold": build_cold_weights(wb_last_seen, mb_last_seen)[1],
        "D-hybrid": build_hybrid_weights(wb_counts, mb_counts, wb_last_seen, mb_last_seen)[1],
        "C-random": build_uniform_weights()[1],
    }
    
    wb_ensemble = ensemble_wb_probs(mab_state, all_wb_weights)
    mb_ensemble = ensemble_mb_probs(mab_state, all_mb_weights)
    
    return DistributionResponse(
        wb_distribution=[DistributionValue(number=n, probability=p) for n, p in sorted(wb_ensemble.items())],
        mb_distribution=[DistributionValue(number=n, probability=p) for n, p in sorted(mb_ensemble.items())],
        last_updated=datetime.now()
    )

@app.post("/v1/simulate", response_model=SimulationResult)
async def simulate_draws(request: SimulationRequest):
    """Run virtual draws to simulate performance."""
    df, mab_state = get_engine_data()
    
    wb_counts, mb_counts = calculate_frequency(df)
    wb_last_seen, mb_last_seen = calculate_overdue(df)
    
    # We use the current ensemble probabilities to generate the "fair" mock draws
    # Alternatively, we could sample from historical data. Let's do both or just ensemble.
    all_wb_weights = {
        "A-hot": build_hot_weights(wb_counts, mb_counts)[0],
        "B-cold": build_cold_weights(wb_last_seen, mb_last_seen)[0],
        "D-hybrid": build_hybrid_weights(wb_counts, mb_counts, wb_last_seen, mb_last_seen)[0],
        "C-random": build_uniform_weights()[0],
    }
    all_mb_weights = {
        "A-hot": build_hot_weights(wb_counts, mb_counts)[1],
        "B-cold": build_cold_weights(wb_last_seen, mb_last_seen)[1],
        "D-hybrid": build_hybrid_weights(wb_counts, mb_counts, wb_last_seen, mb_last_seen)[1],
        "C-random": build_uniform_weights()[1],
    }
    wb_ensemble = ensemble_wb_probs(mab_state, all_wb_weights)
    mb_ensemble = ensemble_mb_probs(mab_state, all_mb_weights)
    
    total_won = 0
    win_count = 0
    total_spent = len(request.tickets) * request.draw_count * TICKET_COST
    
    for _ in range(request.draw_count):
        # Generate mock draw
        draw = draw_ensemble_ticket(wb_ensemble, mb_ensemble)
        actual_wbs = set(draw["wb"])
        actual_mb = draw["mb"]
        
        for t in request.tickets:
            _, _, prize = evaluate_ticket(t.wb, t.mb, actual_wbs, actual_mb)
            if prize > 0:
                total_won += prize
                win_count += 1
                
    net_profit = total_won - total_spent
    roi = (net_profit / total_spent) if total_spent > 0 else 0
    
    return SimulationResult(
        total_spent=total_spent,
        total_won=total_won,
        net_profit=net_profit,
        roi=roi,
        win_count=win_count,
        draw_count=request.draw_count
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
