"""InvestDeskPro FastAPI Application Entry Point."""

from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import funds, optimizer, stocks
from app.schemas import HealthResponse

app = FastAPI(
    title="InvestDeskPro API",
    description="Institutional-Grade Quantitative Investment Intelligence Engine for Indian Equities & AMFI Mutual Funds",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 Routers
app.include_router(stocks.router, prefix="/api/v1")
app.include_router(funds.router, prefix="/api/v1")
app.include_router(optimizer.router, prefix="/api/v1")


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """Health check endpoint for Render & Docker orchestration."""
    return HealthResponse(
        status="ok",
        timestamp=datetime.now(timezone.utc).isoformat(),
        service="investdeskpro-api",
        version="1.0.0",
    )


@app.get("/", tags=["Root"])
def root_info():
    """Service landing info."""
    return {
        "service": "InvestDeskPro API",
        "description": "Institutional Quantitative Engine for Indian Equities & Mutual Funds",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "stocks": "/api/v1/stocks/{ticker}",
            "funds": "/api/v1/funds/{scheme_code}",
            "funds_search": "/api/v1/funds/search?q={query}",
            "portfolio_optimize": "/api/v1/portfolio/optimize?tickers=...&max_weight=15",
        },
    }
