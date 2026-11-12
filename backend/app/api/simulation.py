from fastapi import APIRouter
from backend.app.schemas import SimulationParams, SimulationResult
from backend.app.services.simulation_service import simulation_service

router = APIRouter(prefix="/simulation", tags=["Operations Simulation"])

@router.post("/run", response_model=SimulationResult)
def execute_screening_simulation(params: SimulationParams):
    """
    Executes the SIH 2026 Problem Statement 26038 operational screening simulation.
    Models:
    - Rural Primary Health Centre patient influx
    - Wireless uplink transmission delays across 2G/3G/4G bandwidths
    - Edge & Server AI pipeline duration
    - Specialist ophthalmologist tele-review queue and service times
    - Daily backlog and bottleneck diagnostics
    """
    return simulation_service.run_simulation(params)

@router.get("/defaults", response_model=SimulationParams)
def get_simulation_defaults():
    """Returns baseline parameters for a rural Indian district screening network"""
    return SimulationParams()
