# 🐍 EnergyFlow Energy Engine

A Python microservice for deep-tech energy simulation and optimization.
This is the scientific compute layer of the EnergyFlow OS platform.

## Architecture

```
Next.js Frontend
       │
  Node.js API (Express/TypeScript)
       │  ← HTTP calls to ↓
  Python Energy Engine (FastAPI)
       │
  NumPy / Pandas / SciPy / CVXPY
```

## Modules

| Module | Description |
|---|---|
| `models/energy_profile.py` | NumPy-vectorized load & solar generation curves |
| `models/battery_model.py` | Physics-based Li-ion battery charge/discharge simulation |
| `optimizers/p2p_optimizer.py` | CVXPY Linear Program for P2P energy trading |
| `routers/simulation.py` | `/simulate/tick` and `/simulate/daily-profile` routes |
| `routers/optimization.py` | `/optimize/p2p-trade` and `/optimize/battery-schedule` routes |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/simulate/tick` | Run a grid tick for all nodes |
| `POST` | `/simulate/daily-profile` | Generate 24h energy profile |
| `POST` | `/optimize/p2p-trade` | Solve P2P trading via LP (CVXPY) |
| `POST` | `/optimize/battery-schedule` | Simulate battery charge/discharge schedule |

## Setup

### Local Development (recommended)

```bash
cd apps/energy-engine

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env
copy .env.example .env

# Start the server
python main.py
# → http://localhost:8000
# → Docs at http://localhost:8000/docs
```

### Run Tests

```bash
cd apps/energy-engine
pytest tests/ -v
```

### Docker

```bash
# From the monorepo root
docker compose up energy-engine
```

## Interactive API Docs

When running locally, visit **http://localhost:8000/docs** for the auto-generated
Swagger UI — use it to demo the optimization engine to investors live.

## Why Python?

- **NumPy**: Vectorized load/solar calculations — orders of magnitude faster than loops
- **SciPy**: Industry-standard scientific computing
- **CVXPY**: Convex optimization framework used in academic energy research & industry
- **Pandas**: Time-series energy data analysis (future expansion)
