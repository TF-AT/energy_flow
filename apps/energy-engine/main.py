"""
EnergyFlow Energy Engine - Main FastAPI Application
A Python microservice for deep-tech energy simulation and optimization.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import simulation, optimization, health

load_dotenv()

app = FastAPI(
    title="EnergyFlow Energy Engine",
    description="Deep-tech energy simulation & optimization microservice",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router, tags=["Health"])
app.include_router(simulation.router, prefix="/simulate", tags=["Simulation"])
app.include_router(optimization.router, prefix="/optimize", tags=["Optimization"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
