import os
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

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
@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """Health check endpoint for Render & Docker orchestration."""
    return HealthResponse(
        status="ok",
        timestamp=datetime.now(timezone.utc).isoformat(),
        service="investdeskpro-api",
        version="1.0.0",
    )


# ---------------------------------------------------------------------------
# Static Frontend Serving for Unified Single-Service Deployment
# ---------------------------------------------------------------------------
possible_out_dirs = [
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "out"),
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "out"),
    os.path.join("/app", "frontend", "out"),
    os.path.join("/app", "out"),
]

frontend_out = next(
    (d for d in possible_out_dirs if os.path.exists(d) and os.path.exists(os.path.join(d, "index.html"))),
    None,
)

if frontend_out:
    next_dir = os.path.join(frontend_out, "_next")
    if os.path.exists(next_dir):
        app.mount("/_next", StaticFiles(directory=next_dir), name="next-static")

    @app.get("/{full_path:path}")
    async def serve_frontend_spa(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("openapi.json"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})

        file_path = os.path.join(frontend_out, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)

        index_file = os.path.join(frontend_out, "index.html")
        return FileResponse(
            index_file,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        )
else:
    @app.get("/", tags=["Root"])
    def root_info():
        """Service landing info when frontend build is not mounted."""
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

