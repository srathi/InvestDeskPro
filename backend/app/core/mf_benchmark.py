"""SEBI Mutual Fund Category Benchmark Mapping & Index Allocation Engine.

Dynamically maps mutual fund schemes to their appropriate SEBI-mandated category
benchmarks (e.g. Small Cap -> Nifty Smallcap 250, Mid Cap -> Nifty Midcap 150,
Flexi Cap -> Nifty 500 TRI, Sectoral -> Nifty IT/Bank/Pharma) rather than
comparing every equity fund blindly to Nifty 50.
"""

from typing import Tuple, Optional
import re


def detect_scheme_category(scheme_name: str, scheme_category: Optional[str] = None) -> str:
    """Detect SEBI category from AMFI category string and scheme name."""
    full_text = f"{scheme_category or ''} {scheme_name}".lower()

    if any(k in full_text for k in ["small cap", "smallcap", "emerging business", "micro cap"]):
        return "Small Cap"
    elif any(k in full_text for k in ["mid cap", "midcap", "emerging equity", "mid & small"]):
        return "Mid Cap"
    elif any(k in full_text for k in ["large & mid", "large and mid", "largemid"]):
        return "Large & Mid Cap"
    elif any(k in full_text for k in ["flexi cap", "flexicap"]):
        return "Flexi Cap"
    elif any(k in full_text for k in ["multi cap", "multicap"]):
        return "Multi Cap"
    elif any(k in full_text for k in ["focused"]):
        return "Focused"
    elif any(k in full_text for k in ["elss", "tax saver", "tax saving", "long term equity"]):
        return "ELSS (Tax Saver)"
    elif any(k in full_text for k in ["value", "contra", "contrarian", "dividend yield"]):
        return "Value / Contra"
    elif any(k in full_text for k in ["banking", "bank", "financial services", "fintech"]):
        return "Sectoral - Banking & Financials"
    elif any(k in full_text for k in ["technology", "tech", "digital", "software", "it fund"]):
        return "Sectoral - Technology / IT"
    elif any(k in full_text for k in ["pharma", "healthcare", "health care", "biotech"]):
        return "Sectoral - Pharma & Healthcare"
    elif any(k in full_text for k in ["auto", "transportation", "mobility"]):
        return "Sectoral - Auto & Mobility"
    elif any(k in full_text for k in ["infra", "infrastructure", "manufacturing", "energy"]):
        return "Thematic - Infrastructure & Energy"
    elif any(k in full_text for k in ["balanced advantage", "dynamic asset", "hybrid", "equity savings", "multi asset", "aggressive hybrid"]):
        return "Hybrid / Balanced Advantage"
    elif any(k in full_text for k in ["large cap", "largecap", "bluechip", "top 100", "frontline", "nifty 50", "sensex"]):
        return "Large Cap"
    elif any(k in full_text for k in ["nasdaq", "s&p 500", "us equity", "global", "overseas", "greater china"]):
        return "International / US Equity"
    elif any(k in full_text for k in ["liquid", "overnight", "money market", "short duration", "corporate bond", "gilt", "debt"]):
        return "Debt / Liquid"
    else:
        return "Flexi Cap"


def get_benchmark_for_category(scheme_name: str, scheme_category: Optional[str] = None) -> Tuple[str, str, str]:
    """
    Returns (benchmark_symbol, benchmark_display_name, fallback_symbol).
    """
    category = detect_scheme_category(scheme_name, scheme_category)

    if category == "Small Cap":
        return ("HDFCSML250.NS", "Nifty Smallcap 250 TRI", "^CRSLDX")
    elif category == "Mid Cap":
        return ("NIFTYMIDCAP150.NS", "Nifty Midcap 150 TRI", "^NSEMDCP50")
    elif category == "Large & Mid Cap":
        return ("NIFTYMIDCAP150.NS", "Nifty LargeMidcap 250 TRI", "^CRSLDX")
    elif category in ["Flexi Cap", "Multi Cap", "Focused", "ELSS (Tax Saver)", "Value / Contra"]:
        return ("^CRSLDX", "Nifty 500 TRI", "^NSEI")
    elif category == "Large Cap":
        return ("^NSEI", "Nifty 50 TRI", "^BSESN")
    elif category == "Sectoral - Banking & Financials":
        return ("^NSEBANK", "Nifty Bank TRI", "^NSEI")
    elif category == "Sectoral - Technology / IT":
        return ("^CNXIT", "Nifty IT TRI", "^NSEI")
    elif category == "Sectoral - Pharma & Healthcare":
        return ("^CNXPHARMA", "Nifty Pharma TRI", "^NSEI")
    elif category == "Sectoral - Auto & Mobility":
        return ("^CNXAUTO", "Nifty Auto TRI", "^NSEI")
    elif category == "Thematic - Infrastructure & Energy":
        return ("^CRSLDX", "Nifty Infrastructure TRI", "^NSEI")
    elif category == "Hybrid / Balanced Advantage":
        return ("^CRSLDX", "CRISIL Hybrid 50+50 Composite", "^NSEI")
    elif category == "International / US Equity":
        return ("^GSPC", "S&P 500 TRI", "^IXIC")
    elif category == "Debt / Liquid":
        return ("^NSEI", "CRISIL Composite Debt Index", "^NSEI")
    else:
        return ("^CRSLDX", "Nifty 500 TRI", "^NSEI")
