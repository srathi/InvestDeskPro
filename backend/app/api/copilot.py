"""
AlphaChanakya AI Copilot REST API Router for InvestDeskPro.
Provides conversational intelligence, tool execution, and dynamic suggestion chips.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from app.ai_engine.copilot_engine import AlphaChanakyaEngine
from app.schemas import (
    CopilotChatRequest,
    CopilotChatResponse,
    CopilotSuggestionsResponse,
    ToolExecutionRecord,
)

router = APIRouter(prefix="/copilot", tags=["AlphaChanakya Copilot"])
engine = AlphaChanakyaEngine()


@router.post("/chat", response_model=CopilotChatResponse)
async def chat_with_copilot(req: CopilotChatRequest):
    """
    Primary endpoint for AlphaChanakya AI multi-turn conversational interaction.
    Accepts user message, conversation history, and active page viewport telemetry.
    Dispatches tool calls if necessary and returns grounded analytical synthesis.
    """
    try:
        raw_history = [h.model_dump() for h in req.history]
        result = await engine.chat(
            user_message=req.message,
            history=raw_history,
            context=req.context or {}
        )

        tool_records = [
            ToolExecutionRecord(
                tool=tc.get("tool", ""),
                arguments=tc.get("arguments", {}),
                result=tc.get("result")
            )
            for tc in result.get("tool_calls_executed", [])
        ]

        return CopilotChatResponse(
            response=result.get("response", ""),
            tool_calls_executed=tool_records,
            suggestions=result.get("suggestions", [])
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AlphaChanakya engine error: {str(e)}"
        )


@router.get("/suggestions", response_model=CopilotSuggestionsResponse)
def get_copilot_suggestions(
    tab: Optional[str] = Query(None, description="Active terminal tab: company, funds, or quant"),
    ticker: Optional[str] = Query(None, description="Currently selected stock ticker"),
    fund: Optional[str] = Query(None, description="Currently selected mutual fund code or name"),
):
    """
    Returns dynamic conversation starter prompts tailored to the user's active viewport.
    """
    suggestions: List[str] = []

    if tab == "funds" or fund:
        f_name = fund or "Parag Parikh Flexi Cap"
        suggestions = [
            f"Audit {f_name} for 3Y Rolling Alpha & Form Status",
            f"Check Active Share & Closet Indexing for {f_name}",
            "Compare Cross-Fund Overlap between PPFAS & HDFC Flexi",
            "Explain how Downside Capture Ratio protects capital"
        ]
    elif tab == "quant":
        suggestions = [
            "How does inverse-volatility Risk Parity calculate weights?",
            "Stress-test portfolio against COVID-19 and Rate Hike shocks",
            "Explain Marginal Risk Contribution (MRC) vs Weight %",
            "Show current market regime and India VIX level"
        ]
    else:
        # Default: Stock Intelligence
        t_name = ticker or "Reliance Industries"
        suggestions = [
            f"Run 360° Forensic Audit on {t_name}",
            f"Project 3-Year Forward Target Price for {t_name}",
            f"What is the Reverse DCF implied growth for {t_name}?",
            "Explain Altman Z-Score & Piotroski F-Score probes"
        ]

    return CopilotSuggestionsResponse(suggestions=suggestions)
