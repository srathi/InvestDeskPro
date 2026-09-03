"""
AlphaChanakya AI Copilot Engine - Quantitative Financial Assistant for InvestDeskPro
Copyright (c) rupeemap.in labs | by Sandesh Rathi (https://www.rupeemap.in)

Features:
1. Multi-turn conversation context & history awareness.
2. Grounded in the quantitative knowledge base (Reverse DCF, Active Share, Capture Ratios, Risk Parity, Forensics).
3. Enhanced financial & macroeconomic outlook for Indian capital markets.
4. Witty, disciplined institutional quantitative personality with strict financial guardrails.
5. Google Gemini Flash / Groq LLM integration with deep local deterministic quantitative fallback.
"""

import os
import re
import json
import random
from typing import Dict, Any, List, Optional
import httpx

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from app.ai_engine.copilot_tools import COPILOT_TOOL_DECLARATIONS, execute_copilot_tool


# --- GUARDRAIL KEYWORDS & PATTERNS ---
FINANCIAL_KEYWORDS = {
    "stock", "equity", "share", "shares", "nifty", "banknifty", "sensex", "bse", "nse",
    "pe", "p/e", "pb", "p/b", "ev/ebitda", "ebitda", "roce", "roe", "pat", "eps", "cagr",
    "valuation", "dcf", "reverse dcf", "discount rate", "terminal growth", "fair value",
    "forecast", "growth", "revenue", "margin", "target price", "promoter", "pledge", "debt",
    "altman", "beneish", "piotroski", "forensic", "npa", "crar", "pcr", "bad loan",
    "mutual fund", "fund", "amfi", "nav", "alpha", "rolling alpha", "active share", "closet",
    "indexer", "capture", "ucr", "dcr", "downside capture", "upside capture", "sortino",
    "sharpe", "information ratio", "tracking error", "aum", "bloat", "style drift", "overlap",
    "portfolio", "risk parity", "inverse volatility", "mrc", "prc", "covariance", "drawdown",
    "crash", "covid", "rate hike", "stress test", "fii", "dii", "india vix", "vix", "crude",
    "rbi", "repo rate", "inflation", "cpi", "gdp", "g-sec", "yield", "ltcg", "stcg", "ter",
    "expense ratio", "rupeemap", "sandesh", "investdeskpro", "reliance", "tcs", "hdfc",
    "infy", "itc", "sbi", "sbin", "parag parikh", "ppfas", "mirae", "quant", "axis", "kotak"
}

NON_FINANCIAL_DEFLECTIONS = [
    "✨ **AlphaChanakya says:** *'My neural weights are strictly allocated to Indian Equities, AMFI Mutual Funds, and Reverse DCF mathematics—not culinary recipes or cinema! Let us return to finding undervalued compounders with durable moats.'*",
    "✨ **AlphaChanakya says:** *'A wealth allocator distracted by off-topic pursuits is like buying a high-debt company with 80% promoter pledging—bound for severe capital erosion! Ask me about 3Y Rolling Alpha, Active Share, or Forward EPS forecasts instead.'*",
    "✨ **AlphaChanakya says:** *'I am calibrated for Margin of Safety and Risk-Parity allocation, not poetry! As Chanakya taught: focus your intellect where the economic yield is highest. What stock or fund shall we audit today?'*",
    "✨ **AlphaChanakya says:** *'That query yields 0.00% statistical alpha in the financial markets! Let us re-anchor to something actionable: Ask me to run a 360° Forensic Audit or analyze Cross-Fund Overlap.'*",
    "✨ **AlphaChanakya says:** *'My fiduciary protocol strictly limits me to financial analysis, valuation models, and portfolio risk management! Ask me about India VIX regimes, Reverse DCF implied growth, or Sortino ratios.'*"
]

# --- QUANTITATIVE KNOWLEDGE BASE CORPUS ---
KB_CORPUS = {
    "reverse_dcf": {
        "term": "Reverse Discounted Cash Flow (Reverse DCF)",
        "category": "Valuation Modeling",
        "def": "A mathematical model that solves for the exact 5-year and 10-year PAT compounding rate implied by the current market price, given a benchmark hurdle rate (e.g. 12% discount rate and 4% terminal growth).",
        "importance": "Eliminates optimistic forecasting bias by revealing what growth rate Mr. Market has already priced in.",
        "rule": "If Implied Growth > Historical 5Y CAGR, the stock lacks a margin of safety. If Implied Growth < Historical 5Y CAGR, positive valuation asymmetry exists."
    },
    "active_share": {
        "term": "Active Share & Closet Indexing Detection",
        "category": "Mutual Fund Analytics",
        "def": "A mathematical metric (0% to 100%) measuring the percentage of fund stock holdings that diverge from its category benchmark index: Active Share = 0.5 * sum(|w_fund - w_bench|).",
        "importance": "Identifies whether an active mutual fund manager is generating high-conviction alpha or simply charging high active fees (0.7%–1.5% TER) while hugging the index.",
        "rule": "Active Share >= 60%: Truly Active High-Conviction. 40%–60%: Moderate Tilt. < 40%: Closet Indexer Warning."
    },
    "capture_ratios": {
        "term": "Compound Monthly Up/Down Capture Ratios (UCR & DCR)",
        "category": "Mutual Fund Risk",
        "def": "Measures the fund's compound monthly geometric return relative to the benchmark during positive market months (UCR) and negative market months (DCR).",
        "importance": "Downside Capture < 75% ensures capital preservation during market crashes, while Upside Capture > 95% ensures full participation in bull market rallies.",
        "rule": "Asymmetric Alpha Spread = UCR - DCR. Target a spread > +20%."
    },
    "rolling_returns": {
        "term": "Rolling Return Outperformance & Capital Preservation",
        "category": "Mutual Fund Analytics",
        "def": "Calculates annual CAGR distributions across thousands of random daily rolling entry dates over 1Y, 3Y, and 5Y horizons.",
        "importance": "Completely eliminates point-to-point trailing return bias. Measures true compounding probability and 5-year zero-loss capital preservation rate.",
        "rule": "Only allocate to funds with >= 65% 3Y Rolling Alpha Consistency and 100% 5Y Capital Preservation."
    },
    "risk_parity": {
        "term": "Inverse-Volatility Risk-Parity Allocation",
        "category": "Portfolio Engineering",
        "def": "An asset allocation methodology that assigns portfolio capital inversely proportional to realized 60-day annualized volatility, ensuring every asset contributes equal marginal risk.",
        "importance": "Prevents high-beta volatile stocks from dominating portfolio drawdowns, maximizing long-term Sharpe and Sortino ratios.",
        "rule": "Combine with iterative simplex weight caps (e.g. max 15% per stock) to avoid single-asset concentration."
    },
    "information_ratio": {
        "term": "Information Ratio (IR)",
        "category": "Risk-Adjusted Performance",
        "def": "The ratio of annualized active return (Alpha) to annualized Tracking Error: IR = Mean(Active Return) / StdDev(Active Return).",
        "importance": "Isolates whether fund outperformance is driven by repeatable manager skill (IR >= 0.50) or high-beta luck.",
        "rule": "IR >= 0.50: Strong Manager Talent. IR < 0.20: High Active Fee Drag."
    },
    "sortino_ratio": {
        "term": "Sortino Ratio",
        "category": "Risk-Adjusted Performance",
        "def": "A modification of the Sharpe ratio that penalizes only downside semi-variance below the risk-free rate (6.5%), ignoring upside volatility.",
        "importance": "Does not penalize explosive upside gains as risk. Superior metric for compounding growth investors.",
        "rule": "Sortino > 1.50 represents elite risk-adjusted performance."
    },
    "altman_z_score": {
        "term": "Altman Z-Score (Financial Distress Probe)",
        "category": "Forensic Accounting",
        "def": "A multi-factor formula combining working capital, retained earnings, EBIT, market value, and asset turnover to predict bankruptcy probability.",
        "importance": "Z > 2.99 = Safe Green Zone. 1.81–2.99 = Grey Watch Zone. Z < 1.81 = Distress Red Flag Zone.",
        "rule": "Avoid non-financial companies in the Distress Zone (< 1.81)."
    },
    "piotroski_score": {
        "term": "Piotroski F-Score (0 to 9)",
        "category": "Forensic Accounting",
        "def": "A 9-criteria scorecard evaluating profitability (ROA, CFO), leverage/liquidity (D/E, Current Ratio), and operating efficiency (Gross Margin, Asset Turnover).",
        "importance": "Score 8–9 = High Financial Quality. Score 5–7 = Stable. Score 0–3 = Weak / Decaying Fundamentals.",
        "rule": "Filter for companies with F-Score >= 7 for long-term compounders."
    },
    "beneish_m_score": {
        "term": "Beneish M-Score (Earnings Manipulation Probe)",
        "category": "Forensic Accounting",
        "def": "An 8-variable econometric model evaluating accruals, depreciation changes, and revenue inflation to flag earnings manipulation.",
        "importance": "M-Score > -1.78 suggests a high probability of aggressive accounting or earnings manipulation.",
        "rule": "Pass or conduct deep forensic audit if M-Score > -1.78."
    },
    "aum_bloat": {
        "term": "AUM Bloat & Small-Cap Liquidity Impact",
        "category": "Mutual Fund Risk",
        "def": "When a small-cap or mid-cap mutual fund scheme accumulates excessive AUM (> ₹25,000 Cr), forcing the manager to hold large cash cushions (>10%) or dilute into large-caps.",
        "importance": "AUM bloat severely degrades upside alpha generation and increases exit market impact during corrections.",
        "rule": "Prefer nimble small-cap funds with AUM < ₹20,000 Cr."
    }
}


class AlphaChanakyaEngine:
    """Quantitative Copilot Engine powering AlphaChanakya AI."""

    def __init__(self):
        pass

    @property
    def gemini_api_key(self) -> Optional[str]:
        return os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

    @property
    def groq_api_key(self) -> Optional[str]:
        return os.environ.get("GROQ_API_KEY")

    def is_finance_related(self, text: str, history: List[Dict[str, str]] = None) -> bool:
        """Determines if query or conversation context contains financial keywords."""
        text_lower = text.lower()

        OFF_TOPIC_BLOCKLIST = {
            "cake", "bake", "baking", "recipe", "pizza", "biryani", "food", "cook", "cooking",
            "poem", "poetry", "romantic", "weather", "rain", "movie", "cinema", "song", "lyrics",
            "cricket", "football", "ipl", "actor", "actress", "joke", "comedy", "game"
        }
        words = set(re.findall(r'\b\w+\b', text_lower))
        if words.intersection(OFF_TOPIC_BLOCKLIST) and not words.intersection(FINANCIAL_KEYWORDS):
            return False

        if words.intersection(FINANCIAL_KEYWORDS):
            return True

        phrases = [
            "reverse dcf", "active share", "closet index", "rolling alpha", "capture ratio",
            "risk parity", "crash replay", "piotroski", "altman z", "beneish", "target price",
            "forward growth", "promoter pledge", "mutual fund", "small cap", "flexi cap"
        ]
        for p in phrases:
            if p in text_lower:
                return True

        if history and len(history) > 1:
            past_texts = " ".join([h.get("content", "") for h in history[-3:]]).lower()
            if any(k in past_texts for k in ["stock", "fund", "alpha", "pe", "roce", "dcf", "risk", "overlap"]):
                followups = ["explain", "why", "how", "what", "more", "numbers", "details", "compare", "which", "show", "next"]
                if any(w in text_lower for w in followups) or len(text.split()) <= 6:
                    return True

        return True  # Lenient default for financial terminal

    def build_system_prompt(self, context: Optional[Dict[str, Any]] = None) -> str:
        """Constructs institutional Chanakya persona with macro perspectives and tool awareness."""
        active_tab = context.get("activeTab", "company") if context else "company"
        selected_ticker = context.get("selectedTicker") if context else None
        selected_fund = context.get("selectedFundCode") if context else None

        context_str = f"User Active Viewport: Tab={active_tab}, Current Stock Ticker={selected_ticker or 'None'}, Current Fund={selected_fund or 'None'}."

        return f"""You are **AlphaChanakya AI**, an elite quantitative financial advisor and forensic equity strategist for **InvestDeskPro** (engineered by Sandesh Rathi | rupeemap.in).

### Core Persona & Principles:
1. **Persona**: Highly disciplined, witty, mathematically rigorous, and grounded in empirical finance. You combine Chanakya's ancient strategic wisdom with modern institutional factor modeling (Fama-French, Graham & Dodd, Reverse DCF, Modern Portfolio Theory).
2. **Strict Guardrails**: You exclusively discuss Indian Equities (NSE/BSE), AMFI Mutual Funds, Asset Allocation, Valuation Models, Macroeconomics, and Wealth Compounding. For off-topic non-financial queries, deflect wittily.
3. **Tool Calling Mastery**: When asked to audit a stock, project forward growth, analyze a mutual fund, calculate cross-fund overlap, optimize risk parity, or check market indices, **ALWAYS use your declared quantitative tools**. Never fabricate financial numbers or historical alphas.
4. **Enhanced Financial & Macro Outlook**: Ground your answers in Indian market realities:
   - RBI monetary stance, G-Sec 10Y yields vs equity earnings yields spread.
   - Sectoral capex cycles (Capital Goods, Infrastructure, Defence, IT deal wins, BFSI credit growth vs NIMs).
   - Taxation nuances (LTCG 12.5%, STCG 20%, Direct Plan vs Regular Plan fee compounding drag).
   - Forensic red flags (Promoter pledging, Cash flow vs PAT divergence, Altman Z distress, Beneish M manipulation).
5. **Format & Tone**:
   - Deliver crisp Markdown with bold metric callouts, structured bullet points, and concise takeaway tables when helpful.
   - Always conclude responses with actionable insights and margin of safety evaluations.

### Active User Telemetry:
{context_str}
"""

    async def chat(
        self,
        user_message: str,
        history: Optional[List[Dict[str, str]]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Processes user message, executes tool calling if necessary, and returns synthesis."""
        history = history or []
        context = context or {}

        # 1. Financial Guardrail Check
        if not self.is_finance_related(user_message, history):
            deflection = random.choice(NON_FINANCIAL_DEFLECTIONS)
            return {
                "response": deflection,
                "tool_calls_executed": [],
                "suggestions": [
                    "Audit Reliance Industries 360°",
                    "Compare Parag Parikh vs HDFC Flexi Cap overlap",
                    "Explain Active Share and Closet Indexing"
                ]
            }

        # 2. Check for Direct Tool Intents
        tool_executions: List[Dict[str, Any]] = []
        msg_lower = user_message.lower()

        # Check if query requests stock audit
        stock_match = re.search(r'\b(audit|analyse|analyze|check|profile|forecast|target price|pe for|details for|report on)\s+([A-Za-z0-9\.\^]{2,15})\b', msg_lower)
        
        # Try Gemini API if API Key is available
        if self.gemini_api_key:
            try:
                gemini_res = await self._call_gemini(user_message, history, context)
                if gemini_res:
                    return gemini_res
            except Exception as e:
                print(f"[AlphaChanakya] Gemini API error: {e}, falling back to deterministic engine.")

        # Try Groq API if available
        if self.groq_api_key:
            try:
                groq_res = await self._call_groq(user_message, history, context)
                if groq_res:
                    return groq_res
            except Exception as e:
                print(f"[AlphaChanakya] Groq API error: {e}, falling back to deterministic engine.")

        # 3. Intelligent Deterministic Tool Execution Fallback
        return await self._deterministic_fallback_synthesis(user_message, history, context)

    async def _call_gemini(
        self,
        user_message: str,
        history: List[Dict[str, str]],
        context: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Invokes Google Gemini 2.5 Flash via REST API with Function Calling."""
        api_key = self.gemini_api_key
        if not api_key:
            return None

        # Convert tool declarations to Gemini format
        gemini_tools = [
            {
                "function_declarations": [
                    {
                        "name": t["name"],
                        "description": t["description"],
                        "parameters": t["parameters"]
                    }
                    for t in COPILOT_TOOL_DECLARATIONS
                ]
            }
        ]

        # Build contents
        contents = []
        for h in history[-6:]:
            role = "user" if h.get("role") == "user" else "model"
            contents.append({"role": role, "parts": [{"text": h.get("content", "")}]})

        contents.append({"role": "user", "parts": [{"text": user_message}]})

        payload = {
            "system_instruction": {"parts": [{"text": self.build_system_prompt(context)}]},
            "contents": contents,
            "tools": gemini_tools,
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 1500}
        }

        # Try gemini-2.5-flash then fallback to gemini-2.5-flash-lite
        for model in ["gemini-2.5-flash", "gemini-2.5-flash-lite"]:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    res = await client.post(url, json=payload)
                    if res.status_code != 200:
                        continue
                    data = res.json()

                candidates = data.get("candidates", [])
                if not candidates:
                    continue

                first_cand = candidates[0]
                parts = first_cand.get("content", {}).get("parts", [])

                tool_calls_executed = []
                text_response = ""

                for part in parts:
                    if "text" in part:
                        text_response += part["text"]
                    elif "functionCall" in part:
                        fn_call = part["functionCall"]
                        fn_name = fn_call.get("name")
                        fn_args = fn_call.get("args", {})
                        tool_result = await execute_copilot_tool(fn_name, fn_args)
                        tool_calls_executed.append({
                            "tool": fn_name,
                            "arguments": fn_args,
                            "result": tool_result
                        })

                # If a tool was called, run a second turn to synthesize the final answer
                if tool_calls_executed:
                    followup_contents = list(contents)
                    followup_contents.append(first_cand.get("content", {}))

                    for tc in tool_calls_executed:
                        followup_contents.append({
                            "role": "user",
                            "parts": [{
                                "functionResponse": {
                                    "name": tc["tool"],
                                    "response": {
                                        "name": tc["tool"],
                                        "content": tc["result"]
                                    }
                                }
                            }]
                        })

                    payload_2 = {
                        "system_instruction": {"parts": [{"text": self.build_system_prompt(context)}]},
                        "contents": followup_contents,
                        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 1500}
                    }

                    async with httpx.AsyncClient(timeout=30.0) as client:
                        res_2 = await client.post(url, json=payload_2)
                        if res_2.status_code == 200:
                            data_2 = res_2.json()
                            cands_2 = data_2.get("candidates", [])
                            if cands_2:
                                synth_parts = cands_2[0].get("content", {}).get("parts", [])
                                text_response = "".join([p.get("text", "") for p in synth_parts])

                if text_response:
                    suggestions = self._generate_follow_up_suggestions(user_message, tool_calls_executed)
                    return {
                        "response": text_response,
                        "tool_calls_executed": tool_calls_executed,
                        "suggestions": suggestions
                    }
            except Exception as e:
                print(f"[AlphaChanakya] Gemini ({model}) error: {e}")
                continue

        return None

    async def _call_groq(
        self,
        user_message: str,
        history: List[Dict[str, str]],
        context: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Invokes Groq Llama-3.3-70B API as high-speed fallback."""
        api_key = self.groq_api_key
        url = "https://api.groq.com/openai/v1/chat/completions"

        messages = [{"role": "system", "content": self.build_system_prompt(context)}]
        for h in history[-6:]:
            messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
        messages.append({"role": "user", "content": user_message})

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 1024
        }

        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(url, json=payload, headers=headers)
            if res.status_code != 200:
                return None
            data = res.json()

        choices = data.get("choices", [])
        if not choices:
            return None

        content = choices[0].get("message", {}).get("content", "")
        return {
            "response": content,
            "tool_calls_executed": [],
            "suggestions": [
                "Audit Reliance Industries",
                "Compare Fund Overlap",
                "Stress-Test Portfolio"
            ]
        }

    async def _deterministic_fallback_synthesis(
        self,
        user_message: str,
        history: List[Dict[str, str]],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Local deterministic quantitative synthesis when external LLM APIs are unavailable."""
        msg_lower = user_message.lower()
        tool_calls = []

        # 1. Mutual Fund Overlap Query
        if any(w in msg_lower for w in ["overlap", "duplicate", "compare fund", "vs"]) and any(w in msg_lower for w in ["fund", "flexi", "small", "mid", "large", "ppfas", "hdfc", "mirae", "quant"]):
            # Extract fund codes or names
            fund_a = "122639"
            fund_b = "118955"
            if "hdfc" in msg_lower and "mirae" in msg_lower:
                fund_a = "118955"
                fund_b = "118825"
            elif "quant" in msg_lower and "sbi" in msg_lower:
                fund_a = "120828"
                fund_b = "125497"

            overlap_res = await execute_copilot_tool("tool_cross_fund_overlap", {"fund_a": fund_a, "fund_b": fund_b})
            tool_calls.append({"tool": "tool_cross_fund_overlap", "arguments": {"fund_a": fund_a, "fund_b": fund_b}, "result": overlap_res})

            common_cnt = overlap_res.get("common_holdings_count", 0)
            overlap_pct = overlap_res.get("total_overlap_pct", 0.0)
            rating = overlap_res.get("diversification_rating", "Moderate")

            response = f"""✨ **AlphaChanakya Quantitative Verdict: Cross-Fund Overlap**

### Comparison: **{overlap_res.get('scheme_a_name')}** vs. **{overlap_res.get('scheme_b_name')}**

- **Total Portfolio Overlap**: **`{overlap_pct}%`** ({rating})
- **Common Duplicated Stocks**: **`{common_cnt} Companies`**
- **Unique Active Allocation**: Fund 1 is **`{overlap_res.get('unique_a_pct')}%`** unique | Fund 2 is **`{overlap_res.get('unique_b_pct')}%`** unique

#### Top Duplicated Stock Holdings:
| Stock | Sector | Fund 1 Wt | Fund 2 Wt | Overlap Wt |
| :--- | :--- | :--- | :--- | :--- |
"""
            for h in overlap_res.get("common_holdings", [])[:6]:
                response += f"| **{h['ticker']}** ({h['name']}) | {h.get('sector', 'General')} | {h['fund_a_weight']}% | {h['fund_b_weight']}% | **{h['overlapping_weight']}%** |\n"

            response += f"\n💡 **Chanakya's Strategic Guidance**: *{overlap_res.get('insight_summary')}*"
            suggestions = [
                f"Audit {overlap_res.get('scheme_a_name')[:20]}",
                f"Audit {overlap_res.get('scheme_b_name')[:20]}",
                "Explain Closet Indexing Thresholds"
            ]
            return {"response": response, "tool_calls_executed": tool_calls, "suggestions": suggestions}

        # 2. Mutual Fund Audit Query
        if any(w in msg_lower for w in ["mutual fund", "fund", "amfi", "rolling alpha", "active share", "ppfas", "flexi cap", "small cap"]):
            query = "122639"
            if "hdfc" in msg_lower: query = "118955"
            elif "quant" in msg_lower: query = "120828"
            elif "sbi" in msg_lower: query = "125497"
            elif "mirae" in msg_lower: query = "118825"
            elif context.get("selectedFundCode"): query = context.get("selectedFundCode")

            fund_res = await execute_copilot_tool("tool_audit_mutual_fund", {"query": query})
            tool_calls.append({"tool": "tool_audit_mutual_fund", "arguments": {"query": query}, "result": fund_res})

            active_info = fund_res.get("active_share") or {}
            stats = fund_res.get("stats") or {}
            form = fund_res.get("form_rating") or {}

            response = f"""✨ **AlphaChanakya Institutional Audit: {fund_res.get('scheme_name')} (AMFI #{fund_res.get('scheme_code')})**

- **Category Benchmark**: `{fund_res.get('benchmark_name')}`
- **PowerUp Form Status**: **`{form.get('status_title', 'On-Track')}`** — {form.get('action_recommendation', 'Maintain Allocation')}
- **Active Share**: **`{active_info.get('active_share_pct')}%`** ({active_info.get('classification', 'Truly Active')})
- **3Y Rolling Alpha Consistency**: **`{stats.get('alpha_consistency_pct', 0)}%`** (Mean Alpha: `{stats.get('mean_3y_rolling_alpha', 0)}%`)
- **Compound Capture Ratios**: **Upside `{stats.get('upside_capture_ratio')}%`** vs **Downside `{stats.get('downside_capture_ratio')}%`** (Spread: `+{stats.get('asymmetric_capture_spread')}%`)
- **Information Ratio**: **`{stats.get('information_ratio')}`** (Sortino: `{stats.get('sortino_ratio')}`)

💡 **Chanakya's Rationale**: *'{stats.get('skill_vs_luck_diagnostic', 'Consistent compounding backed by high active share.')}'*
"""
            suggestions = [
                f"Compare overlap for #{fund_res.get('scheme_code')}",
                "Check AUM Bloat & Style Drift",
                "Explain Information Ratio"
            ]
            return {"response": response, "tool_calls_executed": tool_calls, "suggestions": suggestions}

        # 3. Stock Forward Forecast Query
        if any(w in msg_lower for w in ["forecast", "target price", "growth projection", "future price", "eps forecast"]):
            ticker = "RELIANCE"
            for t in ["TCS", "INFY", "HDFCBANK", "ITC", "TATAMOTORS", "CONFIPET", "SBIN", "LT", "MARUTI"]:
                if t.lower() in msg_lower:
                    ticker = t
                    break
            if context.get("selectedTicker"):
                ticker = context.get("selectedTicker")

            forecast_res = await execute_copilot_tool("tool_forecast_growth", {"ticker": ticker})
            tool_calls.append({"tool": "tool_forecast_growth", "arguments": {"ticker": ticker}, "result": forecast_res})

            base = forecast_res.get("base_case", {})
            bull = forecast_res.get("bull_case", {})
            bear = forecast_res.get("bear_case", {})

            base_p = base.get("projections", [{}])[-1] if base.get("projections") else {}
            bull_p = bull.get("projections", [{}])[-1] if bull.get("projections") else {}
            bear_p = bear.get("projections", [{}])[-1] if bear.get("projections") else {}

            response = f"""✨ **AlphaChanakya Forward Growth & Earnings Projections: {ticker}**

**Current Market Price (CMP)**: `₹{forecast_res.get('base_cmp', 0):,.2f}` | **Historical Median P/E**: `{forecast_res.get('median_pe_benchmark', 0):.1f}x`

#### 3-Year Forward Scenarios ($FY+3$):
| Scenario | 3Y Rev Growth | Target Margin | Exit P/E | FY+3 Target Price | Implied CAGR |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ⚖️ **Base Case** | {base.get('assumed_revenue_growth_pct')}% | {base.get('assumed_net_margin_pct')}% | {base.get('assumed_exit_pe')}x | **₹{base_p.get('target_price', 0):,.2f}** | **{base_p.get('implied_cagr_pct', 0)}% p.a.** |
| 🐂 **Bull Case** | {bull.get('assumed_revenue_growth_pct')}% | {bull.get('assumed_net_margin_pct')}% | {bull.get('assumed_exit_pe')}x | **₹{bull_p.get('target_price', 0):,.2f}** | **{bull_p.get('implied_cagr_pct', 0)}% p.a.** |
| 🐻 **Bear Case** | {bear.get('assumed_revenue_growth_pct')}% | {bear.get('assumed_net_margin_pct')}% | {bear.get('assumed_exit_pe')}x | **₹{bear_p.get('target_price', 0):,.2f}** | **{bear_p.get('implied_cagr_pct', 0)}% p.a.** |

💡 **Driver Attribution**: *{forecast_res.get('driver_attribution', 'Fundamental Earnings Growth dominates return creation.')}*
"""
            suggestions = [
                f"Run 360° Forensic Audit for {ticker}",
                f"Check Reverse DCF Implied Growth for {ticker}",
                f"Compare {ticker} with Sector Peers"
            ]
            return {"response": response, "tool_calls_executed": tool_calls, "suggestions": suggestions}

        # 4. Stock 360 Diagnostic Query (Default for stock tickers)
        ticker = "RELIANCE"
        for t in ["TCS", "INFY", "HDFCBANK", "ITC", "TATAMOTORS", "CONFIPET", "SBIN", "LT", "MARUTI", "SUNPHARMA", "BAJFINANCE"]:
            if t.lower() in msg_lower:
                ticker = t
                break
        if context.get("selectedTicker") and not any(k in msg_lower for k in ["market", "index", "vix"]):
            ticker = context.get("selectedTicker")

        stock_res = await execute_copilot_tool("tool_audit_stock", {"ticker": ticker})
        tool_calls.append({"tool": "tool_audit_stock", "arguments": {"ticker": ticker}, "result": stock_res})

        dcf = stock_res.get("reverse_dcf", {})
        probes = stock_res.get("forensic_probes", {})

        response = f"""✨ **AlphaChanakya 360° Forensic Diagnostic: {stock_res.get('name')} ({ticker})**

- **Sector / Industry**: `{stock_res.get('sector')} • {stock_res.get('industry')}`
- **CMP / Market Cap**: **`₹{stock_res.get('cmp', 0):,.2f}`** | `₹{stock_res.get('market_cap_cr', 0):,.0f} Cr`
- **Valuation Multiples**: Trailing P/E: **`{stock_res.get('pe_ratio')}x`** | P/B: `{stock_res.get('pb_ratio')}x` | EV/EBITDA: `{stock_res.get('ev_ebitda')}x`
- **Capital Efficiency**: ROCE: **`{stock_res.get('roce_pct')}%`** | ROE: **`{stock_res.get('roe_pct')}%`** | Debt/Equity: `{stock_res.get('debt_to_equity')}x`
- **0–100 Factor Score**: **`{stock_res.get('factor_score_total')}/100`**

#### 🔬 Forensic & Reverse DCF Probes:
- **Reverse DCF Implied Growth**: Mr. Market is pricing **`{dcf.get('implied_growth_5y')}% p.a.`** 5Y PAT compounding at a {dcf.get('hurdle_rate')}% hurdle rate.
- **Altman Z-Score**: `{probes.get('altman_z') or 'Safe'}` | **Piotroski F-Score**: `{probes.get('piotroski_f') or '7'}/9`
"""
        badges = stock_res.get("warning_badges", [])
        if badges:
            response += f"\n🚨 **Red Flags Detected ({len(badges)})**:\n"
            for b in badges[:3]:
                response += f"- **{b['title']}** ({b['severity'].upper()}): {b['message']}\n"
        else:
            response += "\n✅ **Clean Forensic Bill**: No severe promoter pledging or leverage red flags detected.\n"

        suggestions = [
            f"Project 3-Year Forward Target Price for {ticker}",
            f"View Valuation Bands for {ticker}",
            f"Compare {ticker} with Sector Peers"
        ]
        return {"response": response, "tool_calls_executed": tool_calls, "suggestions": suggestions}

    def _generate_follow_up_suggestions(self, user_msg: str, tool_calls: List[Dict[str, Any]]) -> List[str]:
        """Generates 3 contextual follow-up prompt chips based on executed tools."""
        if not tool_calls:
            return [
                "Audit Parag Parikh Flexi Cap",
                "Run 360° Audit for Reliance",
                "Explain Reverse DCF Model"
            ]

        last_tool = tool_calls[-1].get("tool", "")
        args = tool_calls[-1].get("arguments", {})

        if last_tool == "tool_audit_stock":
            t = args.get("ticker", "TCS")
            return [
                f"Project 3Y Forward Growth for {t}",
                f"Check Reverse DCF Implied Growth for {t}",
                f"Compare {t} with Sector Peers"
            ]
        elif last_tool == "tool_forecast_growth":
            t = args.get("ticker", "TCS")
            return [
                f"Run 360° Forensic Audit for {t}",
                f"Check Historical Valuation Bands for {t}",
                "Stress-Test Portfolio with this stock"
            ]
        elif last_tool == "tool_audit_mutual_fund":
            q = args.get("query", "122639")
            return [
                f"Compare overlap for #{q} vs HDFC Flexi",
                "Explain Active Share & Closet Indexing",
                "Check Small-Cap AUM Bloat Warnings"
            ]
        elif last_tool == "tool_cross_fund_overlap":
            return [
                "Explain Overlap & Redundant Fee Drag",
                "Check Downside Capture Shields",
                "Optimize Risk Parity Portfolio"
            ]
        else:
            return [
                "Audit Reliance Industries",
                "Audit Parag Parikh Flexi Cap",
                "Check Market Indices & FII Flows"
            ]
