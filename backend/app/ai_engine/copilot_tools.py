"""
AlphaChanakya AI Quantitative Tool Registry & Execution Dispatcher for InvestDeskPro.
Connects Gemini / Groq function calling to InvestDeskPro's valuation, forensic, mutual fund, and risk engines.

Copyright (c) rupeemap.in labs | by Sandesh Rathi (https://www.rupeemap.in)
"""

from typing import Dict, Any, List, Optional
import math
import traceback

from app.core.company_deep import fetch_company_360, fetch_company_forecast
from app.core.growth_forecast import calculate_forward_estimates
from app.core.factors import (
    fetch_live_market_indices,
    fetch_latest_institutional_flow,
    generate_stock_scorecard,
)
from app.core.mf_engine import analyze_mutual_fund, calculate_cross_fund_overlap, search_mutual_funds
from app.core.portfolio import optimize_risk_parity_portfolio


# 8 Quantitative Tool Declarations for LLMs (Google Gemini & OpenAI formats)
COPILOT_TOOL_DECLARATIONS = [
    {
        "name": "tool_audit_stock",
        "description": "Performs a 360-degree forensic and fundamental diagnostic on an Indian stock (NSE/BSE). Returns CMP, Market Cap, Trailing P/E, P/B, EV/EBITDA, ROCE %, ROE %, Debt/Equity, Promoter Pledging %, Cash Flow health, Reverse DCF Implied Growth, and Forensic Probe scores (Altman Z, Beneish M, Piotroski F, or BFSI NPA/CAR).",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "ticker": {
                    "type": "STRING",
                    "description": "Stock symbol or NSE ticker, e.g. 'RELIANCE', 'TCS', 'HDFCBANK', 'CONFIPET', 'TATAMOTORS', 'SBIN'."
                }
            },
            "required": ["ticker"]
        }
    },
    {
        "name": "tool_forecast_growth",
        "description": "Projects 1Y, 2Y, and 3Y forward financial estimates for an Indian stock: Revenue (₹ Cr), PAT (₹ Cr), Diluted EPS (₹), Target Share Price (₹), Implied CAGR %, and Return Driver Attribution (Fundamental Growth vs Valuation Multiple Expansion).",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "ticker": {
                    "type": "STRING",
                    "description": "Stock symbol or ticker, e.g. 'TCS', 'RELIANCE', 'INFY', 'ITC'."
                },
                "revenue_growth_pct": {
                    "type": "NUMBER",
                    "description": "Optional custom revenue growth rate % p.a. If omitted, uses blended historical multi-factor rate."
                },
                "net_margin_pct": {
                    "type": "NUMBER",
                    "description": "Optional custom net profit margin %. If omitted, uses mean-reverting 5Y margin."
                },
                "target_exit_pe": {
                    "type": "NUMBER",
                    "description": "Optional custom exit P/E multiple. If omitted, uses 5-year historical median P/E."
                }
            },
            "required": ["ticker"]
        }
    },
    {
        "name": "tool_audit_mutual_fund",
        "description": "Audits an AMFI Mutual Fund scheme. Returns 3-Year Rolling Alpha, Active Share % & Closet Indexing alert, Compound Monthly Upside/Downside Capture Ratios (UCR/DCR), Capital Preservation Rate, 5-Pillar Scorecard, and PowerUp 4-State Form Status.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "query": {
                    "type": "STRING",
                    "description": "AMFI scheme name or 6-digit numeric code, e.g. 'Parag Parikh Flexi Cap', '122639', 'Quant Small Cap', '120828', 'HDFC Flexi Cap'."
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "tool_cross_fund_overlap",
        "description": "Computes cross-fund portfolio overlap % and common stock holdings between 2 mutual funds to detect duplicate stock exposure and redundant fee drag.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "fund_a": {
                    "type": "STRING",
                    "description": "First mutual fund scheme name or code, e.g. 'Parag Parikh Flexi Cap' or '122639'."
                },
                "fund_b": {
                    "type": "STRING",
                    "description": "Second mutual fund scheme name or code, e.g. 'HDFC Flexi Cap' or '118955'."
                }
            },
            "required": ["fund_a", "fund_b"]
        }
    },
    {
        "name": "tool_optimize_portfolio",
        "description": "Constructs an algorithmic inverse-volatility Risk-Parity portfolio allocation for a basket of Indian stocks. Returns optimal weights, Marginal Risk Contribution (MRC), Percent Risk Contribution (PRC), and Annualized Volatility.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "tickers": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "List of NSE stock tickers, e.g. ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ITC', 'LT']."
                },
                "max_weight_pct": {
                    "type": "NUMBER",
                    "description": "Maximum weight cap percentage per stock (e.g. 15 or 25), default 15."
                }
            },
            "required": ["tickers"]
        }
    },
    {
        "name": "tool_stress_test_portfolio",
        "description": "Simulates custom stock portfolio drawdowns across major historical Indian market crash regimes: 1. COVID-19 Liquidity Shock (Feb 2020), 2. Global Rate Hike & Inflation (Oct 2021), 3. Mid/Smallcap Liquidity Squeeze (Jan 2024). Returns Max Drawdown %, Downside Cushion vs Nifty 50, and Recovery Days.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "tickers": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "List of NSE stock tickers, e.g. ['RELIANCE', 'TCS', 'HDFCBANK']."
                },
                "weights": {
                    "type": "ARRAY",
                    "items": {"type": "NUMBER"},
                    "description": "Optional allocation weights corresponding to tickers (in percentage e.g. [35, 35, 30])."
                }
            },
            "required": ["tickers"]
        }
    },
    {
        "name": "tool_get_market_overview",
        "description": "Fetches live real-time quotes for benchmark indices (Nifty 50, Sensex, Bank Nifty, India VIX, Brent Crude) and latest institutional FII / DII net cash flow numbers.",
        "parameters": {
            "type": "OBJECT",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "tool_explain_jargon",
        "description": "Retrieves comprehensive institutional definitions, mathematical formulas, and practical interpretations from the InvestDeskPro Playbook (e.g., Active Share, Reverse DCF, Sortino, Information Ratio, Risk Parity, Altman Z, Beneish M, Piotroski F).",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "term_key": {
                    "type": "STRING",
                    "description": "Key financial term or topic, e.g. 'active_share', 'reverse_dcf', 'information_ratio', 'downside_capture', 'risk_parity', 'piotroski_score', 'altman_z_score', 'beneish_m_score'."
                }
            },
            "required": ["term_key"]
        }
    }
]


async def execute_copilot_tool(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Dispatches tool execution to the appropriate InvestDeskPro backend engine."""
    try:
        if tool_name == "tool_audit_stock":
            ticker = arguments.get("ticker", "").strip().upper()
            if not ticker:
                return {"error": "Ticker symbol is required."}
            profile = fetch_company_360(ticker)
            scorecard = generate_stock_scorecard(ticker)
            
            essentials = profile.essentials
            dcf = profile.reverse_dcf
            forensic_map = {f.title: f"{f.value_str} ({f.status})" for f in profile.forensics}
            
            return {
                "ticker": ticker,
                "name": profile.company_name,
                "sector": profile.sector,
                "industry": profile.industry,
                "cmp": essentials.current_price,
                "market_cap_cr": essentials.market_cap_cr,
                "pe_ratio": essentials.pe,
                "pb_ratio": essentials.pb,
                "roce_pct": essentials.roce,
                "roe_pct": essentials.roe,
                "debt_to_equity": essentials.debt_to_equity,
                "promoter_pledge_pct": profile.shareholding[0].pledged_pct if profile.shareholding else 0.0,
                "reverse_dcf": {
                    "implied_growth_5y": dcf.implied_5y_cagr if dcf else None,
                    "implied_growth_10y": dcf.implied_10y_cagr if dcf else None,
                    "hurdle_rate": dcf.discount_rate_pct if dcf else 12.0,
                },
                "factor_score_total": scorecard.total_score if scorecard else 0,
                "factor_scores": scorecard.model_dump() if scorecard else {},
                "forensic_probes": forensic_map,
                "swot_strengths": profile.swot_strengths[:3],
                "swot_weaknesses": profile.swot_weaknesses[:3],
            }

        elif tool_name == "tool_forecast_growth":
            ticker = arguments.get("ticker", "").strip().upper()
            forecast = fetch_company_forecast(ticker)
            return forecast.model_dump()

        elif tool_name == "tool_audit_mutual_fund":
            query = str(arguments.get("query", "")).strip()
            clean_code = "".join(ch for ch in query if ch.isdigit())
            
            if not clean_code or len(clean_code) < 5:
                search_res = await search_mutual_funds(query)
                if search_res:
                    clean_code = search_res[0].scheme_code
                else:
                    clean_code = "122639"  # Default fallback

            fund = await analyze_mutual_fund(clean_code)
            return {
                "scheme_code": fund.meta.scheme_code,
                "scheme_name": fund.meta.scheme_name,
                "fund_house": fund.meta.fund_house,
                "category": fund.meta.scheme_category,
                "benchmark_name": fund.benchmark_name,
                "latest_nav": fund.latest_nav,
                "latest_nav_date": fund.latest_nav_date,
                "form_rating": fund.form_rating.model_dump() if fund.form_rating else None,
                "active_share": fund.active_share.model_dump() if fund.active_share else None,
                "aum_diagnostic": fund.aum_diagnostic.model_dump() if fund.aum_diagnostic else None,
                "stats": fund.stats.model_dump() if fund.stats else None,
                "scorecard": {
                    "total_score": fund.scorecard.total_score if fund.scorecard else None,
                    "grade": fund.scorecard.grade if fund.scorecard else None,
                    "verdict": fund.scorecard.verdict if fund.scorecard else None,
                } if fund.scorecard else None,
                "top_holdings": [h.model_dump() for h in fund.top_holdings[:8]],
            }

        elif tool_name == "tool_cross_fund_overlap":
            fund_a = str(arguments.get("fund_a", "")).strip()
            fund_b = str(arguments.get("fund_b", "")).strip()
            overlap = calculate_cross_fund_overlap([fund_a, fund_b])
            return overlap.model_dump()

        elif tool_name == "tool_optimize_portfolio":
            tickers = arguments.get("tickers", [])
            max_wt = float(arguments.get("max_weight_pct", 15.0))
            if not tickers or len(tickers) < 2:
                tickers = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ITC", "LT"]
            opt = optimize_risk_parity_portfolio(tickers, max_wt)
            return opt.model_dump()

        elif tool_name == "tool_stress_test_portfolio":
            tickers = arguments.get("tickers", [])
            if not tickers or len(tickers) < 2:
                tickers = ["RELIANCE", "TCS", "HDFCBANK", "INFY"]
            
            opt = optimize_risk_parity_portfolio(tickers)
            return {
                "tickers": tickers,
                "historical_crashes": [c.model_dump() for c in opt.stress_test_events]
            }

        elif tool_name == "tool_get_market_overview":
            indices = fetch_live_market_indices()
            flows = fetch_latest_institutional_flow()
            return {
                "indices": [i.model_dump() for i in indices],
                "institutional_flows": [f.model_dump() for f in flows]
            }

        elif tool_name == "tool_explain_jargon":
            term_key = arguments.get("term_key", "").lower().strip()
            from app.ai_engine.copilot_engine import KB_CORPUS
            if term_key in KB_CORPUS:
                return KB_CORPUS[term_key]
            for k, v in KB_CORPUS.items():
                if term_key in k or term_key in v.get("term", "").lower():
                    return v
            return {
                "term": term_key,
                "def": f"Quantitative concept relating to {term_key} across InvestDeskPro analytics.",
                "importance": "Enables rigorous data-driven decision making."
            }

        else:
            return {"error": f"Unknown tool name: {tool_name}"}

    except Exception as e:
        return {
            "error": f"Tool execution error in {tool_name}: {str(e)}",
            "traceback": traceback.format_exc()
        }
