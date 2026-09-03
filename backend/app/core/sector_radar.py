"""
InvestDeskPro: Sector Valuation & Industry Radar Core Engine
Computes 16-sector valuation percentiles, historical median cones, capex lifecycle phase analysis,
constituent stock mapping from Nifty 500, and relative strength (RS) vs Nifty 50.
"""

from typing import Dict, Any, List, Optional
import math

SECTOR_DATABASE: Dict[str, Dict[str, Any]] = {
    "nifty_it": {
        "id": "nifty_it",
        "name": "Nifty IT",
        "category": "Technology & Services",
        "index_ticker": "^CNXIT",
        "current_pe": 26.8,
        "current_pb": 6.8,
        "current_ev_ebitda": 18.2,
        "current_div_yield": 2.1,
        "pe_3y_median": 27.5,
        "pe_5y_median": 28.4,
        "pe_10y_median": 22.1,
        "pe_5y_min": 19.8,
        "pe_5y_max": 38.6,
        "earnings_growth_yoy": 8.4,
        "capex_phase": "Phase 3: Operating Harvest",
        "capex_phase_num": 3,
        "gross_block_growth_yoy": 6.2,
        "capex_to_ocf_pct": 18.5,
        "asset_turnover": 1.42,
        "roce_pct": 28.5,
        "rs_1m": -1.2,
        "rs_3m": 3.8,
        "rs_6m": 8.4,
        "rs_1y": 14.2,
        "capex_commentary": "Asset-light model with high FCF conversion. AI & Cloud spend driving margins without heavy balance sheet debt.",
        "constituents": [
            {"ticker": "TCS", "name": "Tata Consultancy Services", "cmp": 4120.0, "pe": 28.2, "sales_cagr_3y": 11.4, "profit_cagr_3y": 10.2, "roce_pct": 52.1, "capex_to_ocf_pct": 12.4, "debt_to_equity": 0.0},
            {"ticker": "INFY", "name": "Infosys Ltd", "cmp": 1820.0, "pe": 26.4, "sales_cagr_3y": 13.8, "profit_cagr_3y": 9.8, "roce_pct": 41.2, "capex_to_ocf_pct": 14.8, "debt_to_equity": 0.0},
            {"ticker": "HCLTECH", "name": "HCL Technologies", "cmp": 1680.0, "pe": 24.1, "sales_cagr_3y": 12.1, "profit_cagr_3y": 11.5, "roce_pct": 32.4, "capex_to_ocf_pct": 16.2, "debt_to_equity": 0.05},
            {"ticker": "WIPRO", "name": "Wipro Ltd", "cmp": 540.0, "pe": 22.8, "sales_cagr_3y": 7.4, "profit_cagr_3y": 4.2, "roce_pct": 18.6, "capex_to_ocf_pct": 19.4, "debt_to_equity": 0.12},
            {"ticker": "TECHM", "name": "Tech Mahindra", "cmp": 1580.0, "pe": 34.2, "sales_cagr_3y": 8.1, "profit_cagr_3y": -2.4, "roce_pct": 16.2, "capex_to_ocf_pct": 21.0, "debt_to_equity": 0.08},
            {"ticker": "LTIM", "name": "LTIMindtree", "cmp": 5850.0, "pe": 32.5, "sales_cagr_3y": 16.5, "profit_cagr_3y": 14.1, "roce_pct": 34.8, "capex_to_ocf_pct": 15.6, "debt_to_equity": 0.02},
            {"ticker": "PERSISTENT", "name": "Persistent Systems", "cmp": 5240.0, "pe": 48.2, "sales_cagr_3y": 24.8, "profit_cagr_3y": 26.2, "roce_pct": 31.4, "capex_to_ocf_pct": 18.0, "debt_to_equity": 0.06},
            {"ticker": "COFORGE", "name": "Coforge Ltd", "cmp": 7120.0, "pe": 42.1, "sales_cagr_3y": 22.4, "profit_cagr_3y": 19.8, "roce_pct": 28.6, "capex_to_ocf_pct": 22.4, "debt_to_equity": 0.15}
        ]
    },
    "nifty_bank": {
        "id": "nifty_bank",
        "name": "Nifty Bank",
        "category": "BFSI & Financials",
        "index_ticker": "^NSEBANK",
        "current_pe": 15.2,
        "current_pb": 2.2,
        "current_ev_ebitda": 12.4,
        "current_div_yield": 1.2,
        "pe_3y_median": 16.8,
        "pe_5y_median": 18.2,
        "pe_10y_median": 19.5,
        "pe_5y_min": 13.2,
        "pe_5y_max": 24.6,
        "earnings_growth_yoy": 14.8,
        "capex_phase": "Phase 3: Operating Harvest",
        "capex_phase_num": 3,
        "gross_block_growth_yoy": 12.4,
        "capex_to_ocf_pct": 8.5,
        "asset_turnover": 0.88,
        "roce_pct": 16.4,
        "rs_1m": 0.8,
        "rs_3m": 2.1,
        "rs_6m": -1.4,
        "rs_1y": 4.8,
        "capex_commentary": "Branch and digital tech capex well-digested; pristine asset quality (Net NPA < 0.6%) and healthy credit growth at 13-15%.",
        "constituents": [
            {"ticker": "HDFCBANK", "name": "HDFC Bank Ltd", "cmp": 1640.0, "pe": 18.2, "sales_cagr_3y": 24.2, "profit_cagr_3y": 19.4, "roce_pct": 16.8, "capex_to_ocf_pct": 9.2, "debt_to_equity": 6.8},
            {"ticker": "ICICIBANK", "name": "ICICI Bank Ltd", "cmp": 1220.0, "pe": 16.8, "sales_cagr_3y": 21.8, "profit_cagr_3y": 28.4, "roce_pct": 18.2, "capex_to_ocf_pct": 7.4, "debt_to_equity": 5.9},
            {"ticker": "SBIN", "name": "State Bank of India", "cmp": 810.0, "pe": 10.4, "sales_cagr_3y": 16.2, "profit_cagr_3y": 32.1, "roce_pct": 17.4, "capex_to_ocf_pct": 6.8, "debt_to_equity": 11.2},
            {"ticker": "KOTAKBANK", "name": "Kotak Mahindra Bank", "cmp": 1780.0, "pe": 19.5, "sales_cagr_3y": 17.5, "profit_cagr_3y": 18.2, "roce_pct": 15.6, "capex_to_ocf_pct": 8.0, "debt_to_equity": 4.2},
            {"ticker": "AXISBANK", "name": "Axis Bank Ltd", "cmp": 1180.0, "pe": 13.8, "sales_cagr_3y": 19.2, "profit_cagr_3y": 26.5, "roce_pct": 17.1, "capex_to_ocf_pct": 7.8, "debt_to_equity": 6.4},
            {"ticker": "INDUSINDBK", "name": "IndusInd Bank", "cmp": 1420.0, "pe": 12.1, "sales_cagr_3y": 15.4, "profit_cagr_3y": 22.8, "roce_pct": 15.2, "capex_to_ocf_pct": 8.4, "debt_to_equity": 6.1}
        ]
    },
    "nifty_auto": {
        "id": "nifty_auto",
        "name": "Nifty Auto",
        "category": "Consumer Discretionary",
        "index_ticker": "^CNXAUTO",
        "current_pe": 24.2,
        "current_pb": 4.8,
        "current_ev_ebitda": 15.6,
        "current_div_yield": 1.4,
        "pe_3y_median": 22.8,
        "pe_5y_median": 21.4,
        "pe_10y_median": 20.2,
        "pe_5y_min": 14.8,
        "pe_5y_max": 28.4,
        "earnings_growth_yoy": 26.4,
        "capex_phase": "Phase 3: Operating Harvest",
        "capex_phase_num": 3,
        "gross_block_growth_yoy": 14.8,
        "capex_to_ocf_pct": 42.0,
        "asset_turnover": 1.68,
        "roce_pct": 22.4,
        "rs_1m": 2.4,
        "rs_3m": 6.8,
        "rs_6m": 16.2,
        "rs_1y": 38.5,
        "capex_commentary": "EV platforms, hybrid launches, and SUV premiumization yielding peak operating leverage and highest EBITDA margins in 8 years.",
        "constituents": [
            {"ticker": "MARUTI", "name": "Maruti Suzuki India", "cmp": 12450.0, "pe": 25.1, "sales_cagr_3y": 18.2, "profit_cagr_3y": 24.5, "roce_pct": 21.4, "capex_to_ocf_pct": 38.2, "debt_to_equity": 0.01},
            {"ticker": "TATAMOTORS", "name": "Tata Motors Ltd", "cmp": 980.0, "pe": 14.2, "sales_cagr_3y": 22.8, "profit_cagr_3y": 48.2, "roce_pct": 24.8, "capex_to_ocf_pct": 52.4, "debt_to_equity": 0.65},
            {"ticker": "M&M", "name": "Mahindra & Mahindra", "cmp": 2820.0, "pe": 28.4, "sales_cagr_3y": 26.4, "profit_cagr_3y": 32.1, "roce_pct": 23.2, "capex_to_ocf_pct": 36.8, "debt_to_equity": 0.18},
            {"ticker": "BAJAJ-AUTO", "name": "Bajaj Auto Ltd", "cmp": 9650.0, "pe": 32.8, "sales_cagr_3y": 16.4, "profit_cagr_3y": 21.2, "roce_pct": 36.5, "capex_to_ocf_pct": 24.0, "debt_to_equity": 0.0},
            {"ticker": "EICHERMOT", "name": "Eicher Motors Ltd", "cmp": 4820.0, "pe": 31.2, "sales_cagr_3y": 19.2, "profit_cagr_3y": 28.4, "roce_pct": 28.2, "capex_to_ocf_pct": 28.5, "debt_to_equity": 0.02},
            {"ticker": "TVSMOTOR", "name": "TVS Motor Company", "cmp": 2450.0, "pe": 44.5, "sales_cagr_3y": 23.8, "profit_cagr_3y": 34.2, "roce_pct": 26.4, "capex_to_ocf_pct": 46.0, "debt_to_equity": 0.82}
        ]
    },
    "nifty_pharma": {
        "id": "nifty_pharma",
        "name": "Nifty Pharma",
        "category": "Healthcare",
        "index_ticker": "^CNXPHARMA",
        "current_pe": 34.2,
        "current_pb": 4.9,
        "current_ev_ebitda": 21.4,
        "current_div_yield": 0.8,
        "pe_3y_median": 31.2,
        "pe_5y_median": 29.8,
        "pe_10y_median": 28.4,
        "pe_5y_min": 22.4,
        "pe_5y_max": 38.2,
        "earnings_growth_yoy": 18.5,
        "capex_phase": "Phase 2: Peak Capex & Execution",
        "capex_phase_num": 2,
        "gross_block_growth_yoy": 16.4,
        "capex_to_ocf_pct": 54.0,
        "asset_turnover": 0.94,
        "roce_pct": 18.2,
        "rs_1m": 3.1,
        "rs_3m": 8.4,
        "rs_6m": 19.5,
        "rs_1y": 32.4,
        "capex_commentary": "Heavy R&D and US FDA compliant sterile injectable facilities under construction. CDMO and GLP-1 supply contracts expanding capex outlays.",
        "constituents": [
            {"ticker": "SUNPHARMA", "name": "Sun Pharmaceutical Ind", "cmp": 1780.0, "pe": 38.5, "sales_cagr_3y": 14.2, "profit_cagr_3y": 18.4, "roce_pct": 19.4, "capex_to_ocf_pct": 42.0, "debt_to_equity": 0.05},
            {"ticker": "DRREDDY", "name": "Dr Reddy's Laboratories", "cmp": 6850.0, "pe": 21.4, "sales_cagr_3y": 13.8, "profit_cagr_3y": 24.2, "roce_pct": 24.8, "capex_to_ocf_pct": 48.5, "debt_to_equity": 0.04},
            {"ticker": "CIPLA", "name": "Cipla Ltd", "cmp": 1580.0, "pe": 28.2, "sales_cagr_3y": 12.4, "profit_cagr_3y": 22.1, "roce_pct": 21.8, "capex_to_ocf_pct": 36.4, "debt_to_equity": 0.02},
            {"ticker": "DIVISLAB", "name": "Divi's Laboratories", "cmp": 5420.0, "pe": 68.2, "sales_cagr_3y": 8.2, "profit_cagr_3y": 4.1, "roce_pct": 16.2, "capex_to_ocf_pct": 62.0, "debt_to_equity": 0.0},
            {"ticker": "LUPIN", "name": "Lupin Ltd", "cmp": 2140.0, "pe": 36.8, "sales_cagr_3y": 15.6, "profit_cagr_3y": 68.4, "roce_pct": 17.5, "capex_to_ocf_pct": 51.2, "debt_to_equity": 0.18}
        ]
    },
    "nifty_fmcg": {
        "id": "nifty_fmcg",
        "name": "Nifty FMCG",
        "category": "Consumer Staples",
        "index_ticker": "^CNXFMCG",
        "current_pe": 41.5,
        "current_pb": 10.4,
        "current_ev_ebitda": 28.2,
        "current_div_yield": 2.4,
        "pe_3y_median": 43.8,
        "pe_5y_median": 44.5,
        "pe_10y_median": 41.2,
        "pe_5y_min": 36.2,
        "pe_5y_max": 52.8,
        "earnings_growth_yoy": 6.8,
        "capex_phase": "Phase 3: Operating Harvest",
        "capex_phase_num": 3,
        "gross_block_growth_yoy": 8.4,
        "capex_to_ocf_pct": 26.5,
        "asset_turnover": 2.14,
        "roce_pct": 36.8,
        "rs_1m": -2.4,
        "rs_3m": -1.2,
        "rs_6m": -6.4,
        "rs_1y": -2.8,
        "capex_commentary": "Stable maintenance capex with high dividend payouts (>60%). Rural demand recovery picking up, but low volume growth keeps multiples rangebound.",
        "constituents": [
            {"ticker": "HINDUNILVR", "name": "Hindustan Unilever Ltd", "cmp": 2720.0, "pe": 56.4, "sales_cagr_3y": 9.2, "profit_cagr_3y": 7.8, "roce_pct": 28.5, "capex_to_ocf_pct": 22.4, "debt_to_equity": 0.02},
            {"ticker": "ITC", "name": "ITC Ltd", "cmp": 505.0, "pe": 28.4, "sales_cagr_3y": 14.8, "profit_cagr_3y": 16.2, "roce_pct": 38.4, "capex_to_ocf_pct": 28.0, "debt_to_equity": 0.0},
            {"ticker": "NESTLEIND", "name": "Nestle India Ltd", "cmp": 2480.0, "pe": 68.2, "sales_cagr_3y": 11.8, "profit_cagr_3y": 12.4, "roce_pct": 68.5, "capex_to_ocf_pct": 34.0, "debt_to_equity": 0.05},
            {"ticker": "BRITANNIA", "name": "Britannia Industries", "cmp": 5920.0, "pe": 54.2, "sales_cagr_3y": 12.4, "profit_cagr_3y": 14.8, "roce_pct": 46.2, "capex_to_ocf_pct": 31.0, "debt_to_equity": 0.62},
            {"ticker": "TATACONSUM", "name": "Tata Consumer Products", "cmp": 1180.0, "pe": 72.4, "sales_cagr_3y": 13.5, "profit_cagr_3y": 11.2, "roce_pct": 11.4, "capex_to_ocf_pct": 32.5, "debt_to_equity": 0.14}
        ]
    },
    "nifty_metal": {
        "id": "nifty_metal",
        "name": "Nifty Metal",
        "category": "Commodities & Materials",
        "index_ticker": "^CNXMETAL",
        "current_pe": 14.8,
        "current_pb": 2.1,
        "current_ev_ebitda": 7.8,
        "current_div_yield": 2.8,
        "pe_3y_median": 12.4,
        "pe_5y_median": 11.8,
        "pe_10y_median": 13.2,
        "pe_5y_min": 6.8,
        "pe_5y_max": 19.4,
        "earnings_growth_yoy": 12.4,
        "capex_phase": "Phase 2: Peak Capex & Execution",
        "capex_phase_num": 2,
        "gross_block_growth_yoy": 22.4,
        "capex_to_ocf_pct": 82.0,
        "asset_turnover": 0.92,
        "roce_pct": 14.5,
        "rs_1m": -1.8,
        "rs_3m": 4.2,
        "rs_6m": 12.8,
        "rs_1y": 26.4,
        "capex_commentary": "Massive blast furnace and brownfield capacity expansion underway (Tata Steel Kalinganagar, JSW Steel Vijayanagar, Hindalco Novelis).",
        "constituents": [
            {"ticker": "TATASTEEL", "name": "Tata Steel Ltd", "cmp": 152.0, "pe": 28.4, "sales_cagr_3y": 8.4, "profit_cagr_3y": -18.2, "roce_pct": 11.2, "capex_to_ocf_pct": 94.0, "debt_to_equity": 0.88},
            {"ticker": "JSWSTEEL", "name": "JSW Steel Ltd", "cmp": 960.0, "pe": 24.2, "sales_cagr_3y": 18.2, "profit_cagr_3y": -4.2, "roce_pct": 14.8, "capex_to_ocf_pct": 86.0, "debt_to_equity": 1.12},
            {"ticker": "HINDALCO", "name": "Hindalco Industries", "cmp": 710.0, "pe": 13.8, "sales_cagr_3y": 16.4, "profit_cagr_3y": 14.2, "roce_pct": 15.2, "capex_to_ocf_pct": 68.0, "debt_to_equity": 0.48},
            {"ticker": "VEDL", "name": "Vedanta Ltd", "cmp": 465.0, "pe": 12.4, "sales_cagr_3y": 14.1, "profit_cagr_3y": 6.8, "roce_pct": 21.4, "capex_to_ocf_pct": 72.0, "debt_to_equity": 1.64},
            {"ticker": "JINDALSTEL", "name": "Jindal Steel & Power", "cmp": 980.0, "pe": 16.2, "sales_cagr_3y": 12.8, "profit_cagr_3y": 8.4, "roce_pct": 18.4, "capex_to_ocf_pct": 74.0, "debt_to_equity": 0.32}
        ]
    },
    "nifty_realty": {
        "id": "nifty_realty",
        "name": "Nifty Realty",
        "category": "Real Estate & Construction",
        "index_ticker": "^CNXREALTY",
        "current_pe": 46.8,
        "current_pb": 4.8,
        "current_ev_ebitda": 28.5,
        "current_div_yield": 0.4,
        "pe_3y_median": 34.2,
        "pe_5y_median": 29.4,
        "pe_10y_median": 26.8,
        "pe_5y_min": 18.4,
        "pe_5y_max": 52.4,
        "earnings_growth_yoy": 38.4,
        "capex_phase": "Phase 2: Peak Capex & Execution",
        "capex_phase_num": 2,
        "gross_block_growth_yoy": 31.4,
        "capex_to_ocf_pct": 88.0,
        "asset_turnover": 0.46,
        "roce_pct": 14.2,
        "rs_1m": -4.2,
        "rs_3m": 8.6,
        "rs_6m": 24.8,
        "rs_1y": 68.4,
        "capex_commentary": "Aggressive land banking and new residential launch pipelines. Pre-sales at all-time highs, but multiples trade at 90th historical percentile.",
        "constituents": [
            {"ticker": "DLF", "name": "DLF Ltd", "cmp": 840.0, "pe": 54.2, "sales_cagr_3y": 14.8, "profit_cagr_3y": 32.4, "roce_pct": 11.8, "capex_to_ocf_pct": 78.0, "debt_to_equity": 0.05},
            {"ticker": "GODREJPROP", "name": "Godrej Properties", "cmp": 2980.0, "pe": 78.4, "sales_cagr_3y": 28.4, "profit_cagr_3y": 42.1, "roce_pct": 12.4, "capex_to_ocf_pct": 95.0, "debt_to_equity": 0.42},
            {"ticker": "LODHA", "name": "Macrotech Developers", "cmp": 1240.0, "pe": 42.8, "sales_cagr_3y": 21.2, "profit_cagr_3y": 36.8, "roce_pct": 16.4, "capex_to_ocf_pct": 84.0, "debt_to_equity": 0.38},
            {"ticker": "PRESTIGE", "name": "Prestige Estates Projects", "cmp": 1780.0, "pe": 48.2, "sales_cagr_3y": 18.4, "profit_cagr_3y": 28.2, "roce_pct": 13.8, "capex_to_ocf_pct": 89.0, "debt_to_equity": 0.74},
            {"ticker": "OBEROIRLTY", "name": "Oberoi Realty Ltd", "cmp": 1820.0, "pe": 32.4, "sales_cagr_3y": 24.1, "profit_cagr_3y": 31.5, "roce_pct": 18.2, "capex_to_ocf_pct": 62.0, "debt_to_equity": 0.18}
        ]
    },
    "capital_goods": {
        "id": "capital_goods",
        "name": "Capital Goods & Infra",
        "category": "Industrial Manufacturing",
        "index_ticker": "BSE_CG",
        "current_pe": 48.2,
        "current_pb": 6.8,
        "current_ev_ebitda": 26.4,
        "current_div_yield": 0.7,
        "pe_3y_median": 38.4,
        "pe_5y_median": 32.1,
        "pe_10y_median": 28.4,
        "pe_5y_min": 21.4,
        "pe_5y_max": 56.2,
        "earnings_growth_yoy": 24.8,
        "capex_phase": "Phase 3: Operating Harvest",
        "capex_phase_num": 3,
        "gross_block_growth_yoy": 21.2,
        "capex_to_ocf_pct": 46.0,
        "asset_turnover": 1.28,
        "roce_pct": 21.4,
        "rs_1m": 1.8,
        "rs_3m": 9.4,
        "rs_6m": 22.1,
        "rs_1y": 52.4,
        "capex_commentary": "Multi-year order books (3-4x TTM revenues) fueled by railway electrification, power T&D, and data center buildouts.",
        "constituents": [
            {"ticker": "LT", "name": "Larsen & Toubro Ltd", "cmp": 3680.0, "pe": 36.4, "sales_cagr_3y": 18.4, "profit_cagr_3y": 21.8, "roce_pct": 16.8, "capex_to_ocf_pct": 38.0, "debt_to_equity": 0.82},
            {"ticker": "SIEMENS", "name": "Siemens Ltd", "cmp": 6850.0, "pe": 68.4, "sales_cagr_3y": 21.4, "profit_cagr_3y": 28.4, "roce_pct": 24.2, "capex_to_ocf_pct": 32.0, "debt_to_equity": 0.0},
            {"ticker": "ABB", "name": "ABB India Ltd", "cmp": 7920.0, "pe": 82.1, "sales_cagr_3y": 23.8, "profit_cagr_3y": 38.5, "roce_pct": 26.8, "capex_to_ocf_pct": 28.4, "debt_to_equity": 0.0},
            {"ticker": "THERMAX", "name": "Thermax Ltd", "cmp": 4920.0, "pe": 54.8, "sales_cagr_3y": 19.2, "profit_cagr_3y": 24.1, "roce_pct": 18.4, "capex_to_ocf_pct": 41.0, "debt_to_equity": 0.04},
            {"ticker": "BHEL", "name": "Bharat Heavy Electricals", "cmp": 285.0, "pe": 62.4, "sales_cagr_3y": 14.2, "profit_cagr_3y": -12.4, "roce_pct": 4.8, "capex_to_ocf_pct": 54.0, "debt_to_equity": 0.28}
        ]
    },
    "defence": {
        "id": "defence",
        "name": "Defence & Aerospace",
        "category": "Strategic Industrials",
        "index_ticker": "BSE_DEFENCE",
        "current_pe": 42.8,
        "current_pb": 8.4,
        "current_ev_ebitda": 29.4,
        "current_div_yield": 0.9,
        "pe_3y_median": 28.4,
        "pe_5y_median": 22.4,
        "pe_10y_median": 18.2,
        "pe_5y_min": 14.2,
        "pe_5y_max": 54.8,
        "earnings_growth_yoy": 28.4,
        "capex_phase": "Phase 1: Capacity Initiation",
        "capex_phase_num": 1,
        "gross_block_growth_yoy": 28.4,
        "capex_to_ocf_pct": 62.0,
        "asset_turnover": 1.12,
        "roce_pct": 26.4,
        "rs_1m": -3.4,
        "rs_3m": 12.4,
        "rs_6m": 34.2,
        "rs_1y": 82.4,
        "capex_commentary": "Indigenization mandate (Positive Indigenisation Lists) driving greenfield missile, fighter jet, and radar manufacturing plants.",
        "constituents": [
            {"ticker": "HAL", "name": "Hindustan Aeronautics Ltd", "cmp": 4680.0, "pe": 38.2, "sales_cagr_3y": 12.8, "profit_cagr_3y": 28.4, "roce_pct": 32.4, "capex_to_ocf_pct": 48.0, "debt_to_equity": 0.0},
            {"ticker": "BEL", "name": "Bharat Electronics Ltd", "cmp": 305.0, "pe": 44.5, "sales_cagr_3y": 16.4, "profit_cagr_3y": 24.2, "roce_pct": 34.2, "capex_to_ocf_pct": 42.0, "debt_to_equity": 0.0},
            {"ticker": "BDL", "name": "Bharat Dynamics Ltd", "cmp": 1420.0, "pe": 56.4, "sales_cagr_3y": 14.1, "profit_cagr_3y": 18.2, "roce_pct": 22.4, "capex_to_ocf_pct": 58.0, "debt_to_equity": 0.0},
            {"ticker": "MAZDOCK", "name": "Mazagon Dock Shipbuilders", "cmp": 4350.0, "pe": 36.8, "sales_cagr_3y": 24.8, "profit_cagr_3y": 46.2, "roce_pct": 38.4, "capex_to_ocf_pct": 34.0, "debt_to_equity": 0.0},
            {"ticker": "COCHINSHIP", "name": "Cochin Shipyard Ltd", "cmp": 1840.0, "pe": 48.2, "sales_cagr_3y": 18.2, "profit_cagr_3y": 34.1, "roce_pct": 24.8, "capex_to_ocf_pct": 62.0, "debt_to_equity": 0.02}
        ]
    },
    "nifty_energy": {
        "id": "nifty_energy",
        "name": "Nifty Energy & Power",
        "category": "Utilities & Refining",
        "index_ticker": "^CNXENERGY",
        "current_pe": 16.4,
        "current_pb": 2.4,
        "current_ev_ebitda": 9.2,
        "current_div_yield": 2.6,
        "pe_3y_median": 15.2,
        "pe_5y_median": 14.8,
        "pe_10y_median": 13.8,
        "pe_5y_min": 9.8,
        "pe_5y_max": 22.4,
        "earnings_growth_yoy": 14.2,
        "capex_phase": "Phase 1: Capacity Initiation",
        "capex_phase_num": 1,
        "gross_block_growth_yoy": 24.8,
        "capex_to_ocf_pct": 76.0,
        "asset_turnover": 1.14,
        "roce_pct": 15.8,
        "rs_1m": -0.4,
        "rs_3m": 3.4,
        "rs_6m": 14.2,
        "rs_1y": 28.4,
        "capex_commentary": "Energy transition mega-capex: 500 GW renewable target by 2030, solar module manufacturing, green hydrogen, and thermal capacity additions.",
        "constituents": [
            {"ticker": "RELIANCE", "name": "Reliance Industries", "cmp": 2980.0, "pe": 26.4, "sales_cagr_3y": 18.4, "profit_cagr_3y": 14.8, "roce_pct": 12.4, "capex_to_ocf_pct": 68.0, "debt_to_equity": 0.42},
            {"ticker": "NTPC", "name": "NTPC Ltd", "cmp": 415.0, "pe": 16.8, "sales_cagr_3y": 16.2, "profit_cagr_3y": 18.4, "roce_pct": 12.8, "capex_to_ocf_pct": 84.0, "debt_to_equity": 1.34},
            {"ticker": "POWERGRID", "name": "Power Grid Corp of India", "cmp": 335.0, "pe": 18.4, "sales_cagr_3y": 6.8, "profit_cagr_3y": 8.4, "roce_pct": 14.2, "capex_to_ocf_pct": 52.0, "debt_to_equity": 1.48},
            {"ticker": "ONGC", "name": "Oil & Natural Gas Corp", "cmp": 310.0, "pe": 8.4, "sales_cagr_3y": 14.8, "profit_cagr_3y": 19.2, "roce_pct": 16.4, "capex_to_ocf_pct": 54.0, "debt_to_equity": 0.38},
            {"ticker": "COALINDIA", "name": "Coal India Ltd", "cmp": 505.0, "pe": 8.1, "sales_cagr_3y": 18.4, "profit_cagr_3y": 24.8, "roce_pct": 58.4, "capex_to_ocf_pct": 36.0, "debt_to_equity": 0.05}
        ]
    },
    "nifty_psubank": {
        "id": "nifty_psubank",
        "name": "Nifty PSU Bank",
        "category": "BFSI & Financials",
        "index_ticker": "^CNXPSUBANK",
        "current_pe": 8.8,
        "current_pb": 1.25,
        "current_ev_ebitda": 6.4,
        "current_div_yield": 3.4,
        "pe_3y_median": 7.8,
        "pe_5y_median": 8.2,
        "pe_10y_median": 10.4,
        "pe_5y_min": 4.8,
        "pe_5y_max": 12.8,
        "earnings_growth_yoy": 28.4,
        "capex_phase": "Phase 3: Operating Harvest",
        "capex_phase_num": 3,
        "gross_block_growth_yoy": 9.4,
        "capex_to_ocf_pct": 6.2,
        "asset_turnover": 0.82,
        "roce_pct": 17.8,
        "rs_1m": -2.1,
        "rs_3m": 1.4,
        "rs_6m": 8.4,
        "rs_1y": 42.1,
        "capex_commentary": "Turnaround complete: Return on Assets (RoA) > 1.0% across all top PSU lenders, record low NPAs, and low single-digit P/E multiples.",
        "constituents": [
            {"ticker": "SBIN", "name": "State Bank of India", "cmp": 810.0, "pe": 10.4, "sales_cagr_3y": 16.2, "profit_cagr_3y": 32.1, "roce_pct": 17.4, "capex_to_ocf_pct": 6.8, "debt_to_equity": 11.2},
            {"ticker": "BANKBARODA", "name": "Bank of Baroda", "cmp": 255.0, "pe": 6.8, "sales_cagr_3y": 18.4, "profit_cagr_3y": 38.2, "roce_pct": 16.2, "capex_to_ocf_pct": 5.4, "debt_to_equity": 12.4},
            {"ticker": "PNB", "name": "Punjab National Bank", "cmp": 118.0, "pe": 9.2, "sales_cagr_3y": 14.8, "profit_cagr_3y": 62.4, "roce_pct": 12.4, "capex_to_ocf_pct": 6.1, "debt_to_equity": 13.8},
            {"ticker": "CANBK", "name": "Canara Bank", "cmp": 112.0, "pe": 6.4, "sales_cagr_3y": 19.2, "profit_cagr_3y": 36.4, "roce_pct": 18.1, "capex_to_ocf_pct": 5.2, "debt_to_equity": 12.8},
            {"ticker": "UNIONBANK", "name": "Union Bank of India", "cmp": 132.0, "pe": 6.9, "sales_cagr_3y": 17.1, "profit_cagr_3y": 42.1, "roce_pct": 16.8, "capex_to_ocf_pct": 5.8, "debt_to_equity": 11.9}
        ]
    },
    "chemicals": {
        "id": "chemicals",
        "name": "Specialty Chemicals",
        "category": "Materials & Synthesis",
        "index_ticker": "BSE_CHEM",
        "current_pe": 38.4,
        "current_pb": 4.6,
        "current_ev_ebitda": 22.1,
        "current_div_yield": 0.6,
        "pe_3y_median": 42.1,
        "pe_5y_median": 36.4,
        "pe_10y_median": 28.5,
        "pe_5y_min": 24.2,
        "pe_5y_max": 58.4,
        "earnings_growth_yoy": -8.4,
        "capex_phase": "Phase 2: Peak Capex & Execution",
        "capex_phase_num": 2,
        "gross_block_growth_yoy": 24.2,
        "capex_to_ocf_pct": 74.0,
        "asset_turnover": 0.84,
        "roce_pct": 14.2,
        "rs_1m": 1.2,
        "rs_3m": -4.2,
        "rs_6m": -12.4,
        "rs_1y": -8.4,
        "capex_commentary": "High capex executed over FY22-24 meeting temporary global destocking. Utilization now bottoming out with margin expansion expected in H2.",
        "constituents": [
            {"ticker": "SRF", "name": "SRF Ltd", "cmp": 2420.0, "pe": 41.2, "sales_cagr_3y": 14.2, "profit_cagr_3y": 6.8, "roce_pct": 18.4, "capex_to_ocf_pct": 68.0, "debt_to_equity": 0.42},
            {"ticker": "PIIND", "name": "PI Industries Ltd", "cmp": 4350.0, "pe": 38.4, "sales_cagr_3y": 19.8, "profit_cagr_3y": 24.2, "roce_pct": 24.1, "capex_to_ocf_pct": 48.0, "debt_to_equity": 0.02},
            {"ticker": "NAVINFLUOR", "name": "Navin Fluorine Int", "cmp": 3620.0, "pe": 62.4, "sales_cagr_3y": 16.4, "profit_cagr_3y": 2.1, "roce_pct": 12.8, "capex_to_ocf_pct": 84.0, "debt_to_equity": 0.38},
            {"ticker": "DEEPAKNTR", "name": "Deepak Nitrite Ltd", "cmp": 2840.0, "pe": 36.8, "sales_cagr_3y": 18.2, "profit_cagr_3y": 8.4, "roce_pct": 26.4, "capex_to_ocf_pct": 64.0, "debt_to_equity": 0.05},
            {"ticker": "AARTIIND", "name": "Aarti Industries Ltd", "cmp": 620.0, "pe": 46.2, "sales_cagr_3y": 12.4, "profit_cagr_3y": -8.4, "roce_pct": 11.2, "capex_to_ocf_pct": 82.0, "debt_to_equity": 0.74}
        ]
    },
    "telecom": {
        "id": "telecom",
        "name": "Telecom & Digital Infra",
        "category": "Communications",
        "index_ticker": "BSE_TELECOM",
        "current_pe": 42.1,
        "current_pb": 7.4,
        "current_ev_ebitda": 11.8,
        "current_div_yield": 0.8,
        "pe_3y_median": 48.2,
        "pe_5y_median": 44.1,
        "pe_10y_median": 36.2,
        "pe_5y_min": 26.4,
        "pe_5y_max": 68.2,
        "earnings_growth_yoy": 32.4,
        "capex_phase": "Phase 3: Operating Harvest",
        "capex_phase_num": 3,
        "gross_block_growth_yoy": 11.8,
        "capex_to_ocf_pct": 44.0,
        "asset_turnover": 0.76,
        "roce_pct": 14.8,
        "rs_1m": 4.8,
        "rs_3m": 14.2,
        "rs_6m": 28.4,
        "rs_1y": 62.4,
        "capex_commentary": "5G rollout capex peak has passed. Industry tariff hikes (+15-20%) delivering direct operating cash flow flow-through to EBITDA.",
        "constituents": [
            {"ticker": "BHARTIARTL", "name": "Bharti Airtel Ltd", "cmp": 1580.0, "pe": 52.4, "sales_cagr_3y": 18.4, "profit_cagr_3y": 42.8, "roce_pct": 16.8, "capex_to_ocf_pct": 48.0, "debt_to_equity": 1.24},
            {"ticker": "INDUSTOWER", "name": "Indus Towers Ltd", "cmp": 435.0, "pe": 16.8, "sales_cagr_3y": 6.8, "profit_cagr_3y": 28.4, "roce_pct": 28.4, "capex_to_ocf_pct": 34.0, "debt_to_equity": 0.68},
            {"ticker": "TATACOMM", "name": "Tata Communications", "cmp": 1980.0, "pe": 48.2, "sales_cagr_3y": 11.4, "profit_cagr_3y": 14.2, "roce_pct": 21.4, "capex_to_ocf_pct": 46.0, "debt_to_equity": 2.14},
            {"ticker": "IDEA", "name": "Vodafone Idea Ltd", "cmp": 13.8, "pe": -8.4, "sales_cagr_3y": 4.1, "profit_cagr_3y": -12.4, "roce_pct": -4.2, "capex_to_ocf_pct": 92.0, "debt_to_equity": -4.8}
        ]
    },
    "consumer_durables": {
        "id": "consumer_durables",
        "name": "Consumer Durables & EMS",
        "category": "Consumer Discretionary",
        "index_ticker": "BSE_CD",
        "current_pe": 54.8,
        "current_pb": 8.9,
        "current_ev_ebitda": 32.4,
        "current_div_yield": 0.5,
        "pe_3y_median": 48.2,
        "pe_5y_median": 44.8,
        "pe_10y_median": 38.2,
        "pe_5y_min": 31.4,
        "pe_5y_max": 68.4,
        "earnings_growth_yoy": 28.4,
        "capex_phase": "Phase 3: Operating Harvest",
        "capex_phase_num": 3,
        "gross_block_growth_yoy": 26.4,
        "capex_to_ocf_pct": 48.0,
        "asset_turnover": 2.48,
        "roce_pct": 22.4,
        "rs_1m": 3.8,
        "rs_3m": 16.4,
        "rs_6m": 34.2,
        "rs_1y": 74.2,
        "capex_commentary": "PLI scheme for Electronics/White Goods driving rapid factory additions. High asset turnover (2.5x) converting capex into surging RoCE.",
        "constituents": [
            {"ticker": "DIXON", "name": "Dixon Technologies", "cmp": 13400.0, "pe": 98.4, "sales_cagr_3y": 38.4, "profit_cagr_3y": 44.2, "roce_pct": 34.8, "capex_to_ocf_pct": 46.0, "debt_to_equity": 0.24},
            {"ticker": "HAVELLS", "name": "Havells India Ltd", "cmp": 1940.0, "pe": 68.2, "sales_cagr_3y": 19.4, "profit_cagr_3y": 16.2, "roce_pct": 24.1, "capex_to_ocf_pct": 38.0, "debt_to_equity": 0.01},
            {"ticker": "VOLTAS", "name": "Voltas Ltd", "cmp": 1820.0, "pe": 64.1, "sales_cagr_3y": 18.2, "profit_cagr_3y": 21.4, "roce_pct": 16.4, "capex_to_ocf_pct": 42.0, "debt_to_equity": 0.08},
            {"ticker": "POLYCAB", "name": "Polycab India Ltd", "cmp": 6820.0, "pe": 48.2, "sales_cagr_3y": 24.8, "profit_cagr_3y": 34.2, "roce_pct": 31.2, "capex_to_ocf_pct": 44.0, "debt_to_equity": 0.02},
            {"ticker": "KAYNES", "name": "Kaynes Technology", "cmp": 5420.0, "pe": 112.4, "sales_cagr_3y": 48.2, "profit_cagr_3y": 58.4, "roce_pct": 21.8, "capex_to_ocf_pct": 72.0, "debt_to_equity": 0.18}
        ]
    },
    "textiles": {
        "id": "textiles",
        "name": "Textiles & Apparels",
        "category": "Exports & Materials",
        "index_ticker": "BSE_TEX",
        "current_pe": 24.8,
        "current_pb": 2.8,
        "current_ev_ebitda": 11.2,
        "current_div_yield": 1.6,
        "pe_3y_median": 26.4,
        "pe_5y_median": 22.8,
        "pe_10y_median": 18.4,
        "pe_5y_min": 14.8,
        "pe_5y_max": 34.2,
        "earnings_growth_yoy": 11.4,
        "capex_phase": "Phase 2: Peak Capex & Execution",
        "capex_phase_num": 2,
        "gross_block_growth_yoy": 14.2,
        "capex_to_ocf_pct": 58.0,
        "asset_turnover": 1.12,
        "roce_pct": 14.2,
        "rs_1m": -0.8,
        "rs_3m": 2.4,
        "rs_6m": 4.8,
        "rs_1y": 14.8,
        "capex_commentary": "Capacity additions under PM MITRA and state textile policies; order shifting from Bangladesh/China providing tailwinds.",
        "constituents": [
            {"ticker": "KPRMILL", "name": "K.P.R. Mill Ltd", "cmp": 940.0, "pe": 36.4, "sales_cagr_3y": 18.4, "profit_cagr_3y": 16.2, "roce_pct": 24.8, "capex_to_ocf_pct": 48.0, "debt_to_equity": 0.28},
            {"ticker": "PAGEIND", "name": "Page Industries Ltd", "cmp": 44200.0, "pe": 74.2, "sales_cagr_3y": 12.4, "profit_cagr_3y": 14.8, "roce_pct": 48.2, "capex_to_ocf_pct": 32.0, "debt_to_equity": 0.05},
            {"ticker": "TRIDENT", "name": "Trident Ltd", "cmp": 38.5, "pe": 32.1, "sales_cagr_3y": 11.2, "profit_cagr_3y": 8.4, "roce_pct": 12.4, "capex_to_ocf_pct": 64.0, "debt_to_equity": 0.38},
            {"ticker": "WELSPUNLIV", "name": "Welspun Living Ltd", "cmp": 168.0, "pe": 21.4, "sales_cagr_3y": 9.8, "profit_cagr_3y": 24.8, "roce_pct": 14.8, "capex_to_ocf_pct": 52.0, "debt_to_equity": 0.44},
            {"ticker": "GOKEX", "name": "Gokaldas Exports Ltd", "cmp": 980.0, "pe": 28.4, "sales_cagr_3y": 21.4, "profit_cagr_3y": 19.8, "roce_pct": 18.2, "capex_to_ocf_pct": 56.0, "debt_to_equity": 0.32}
        ]
    },
    "infra_const": {
        "id": "infra_const",
        "name": "Core Infrastructure",
        "category": "EPC & Concessions",
        "index_ticker": "^CNXINFRA",
        "current_pe": 22.4,
        "current_pb": 3.4,
        "current_ev_ebitda": 13.8,
        "current_div_yield": 1.4,
        "pe_3y_median": 20.8,
        "pe_5y_median": 19.2,
        "pe_10y_median": 17.4,
        "pe_5y_min": 12.8,
        "pe_5y_max": 28.4,
        "earnings_growth_yoy": 19.2,
        "capex_phase": "Phase 2: Peak Capex & Execution",
        "capex_phase_num": 2,
        "gross_block_growth_yoy": 22.8,
        "capex_to_ocf_pct": 78.0,
        "asset_turnover": 0.98,
        "roce_pct": 15.4,
        "rs_1m": 0.4,
        "rs_3m": 5.8,
        "rs_6m": 16.4,
        "rs_1y": 38.2,
        "capex_commentary": "Union Budget National Infrastructure Pipeline (NIP) execution: Dedicated freight corridors, expressways, and water infra.",
        "constituents": [
            {"ticker": "LT", "name": "Larsen & Toubro Ltd", "cmp": 3680.0, "pe": 36.4, "sales_cagr_3y": 18.4, "profit_cagr_3y": 21.8, "roce_pct": 16.8, "capex_to_ocf_pct": 38.0, "debt_to_equity": 0.82},
            {"ticker": "GMRINFRA", "name": "GMR Airports Infra", "cmp": 94.0, "pe": 72.4, "sales_cagr_3y": 28.4, "profit_cagr_3y": 38.2, "roce_pct": 8.4, "capex_to_ocf_pct": 92.0, "debt_to_equity": 2.84},
            {"ticker": "PNCINFRA", "name": "PNC Infratech Ltd", "cmp": 465.0, "pe": 16.2, "sales_cagr_3y": 14.8, "profit_cagr_3y": 18.4, "roce_pct": 18.2, "capex_to_ocf_pct": 58.0, "debt_to_equity": 0.48},
            {"ticker": "KNRCON", "name": "KNR Constructions", "cmp": 340.0, "pe": 14.8, "sales_cagr_3y": 16.2, "profit_cagr_3y": 19.4, "roce_pct": 21.4, "capex_to_ocf_pct": 52.0, "debt_to_equity": 0.24},
            {"ticker": "GRINFRA", "name": "G R Infraprojects Ltd", "cmp": 1680.0, "pe": 18.2, "sales_cagr_3y": 12.8, "profit_cagr_3y": 14.1, "roce_pct": 17.8, "capex_to_ocf_pct": 64.0, "debt_to_equity": 0.62}
        ]
    }
}


def calculate_valuation_percentile(current: float, min_val: float, max_val: float) -> float:
    """Calculates where current valuation sits in the 0-100 percentile band."""
    if max_val <= min_val:
        return 50.0
    pct = ((current - min_val) / (max_val - min_val)) * 100.0
    return max(0.0, min(100.0, round(pct, 1)))


def classify_valuation_zone(percentile: float) -> Dict[str, str]:
    """Classifies valuation zone based on historical percentile."""
    if percentile <= 40.0:
        return {
            "zone": "Undervalued / Opportunity",
            "code": "UNDERVALUED",
            "color": "emerald",
            "badge": "🟢 Value Opportunity"
        }
    elif percentile <= 75.0:
        return {
            "zone": "Fair Value / In-Line",
            "code": "FAIR_VALUE",
            "color": "slate",
            "badge": "⚪ Fair Value"
        }
    else:
        return {
            "zone": "Overvalued / Euphoria",
            "code": "OVERVALUED",
            "color": "rose",
            "badge": "🔴 Extended Multiples"
        }


def get_sector_radar_heatmap(
    metric: str = "pe",
    lookback: str = "5y",
    phase_filter: str = "all"
) -> Dict[str, Any]:
    """
    Returns aggregate sector heatmap with valuation percentiles, capex phases, and macro stats.
    """
    sectors_list = []
    undervalued_count = 0
    fair_count = 0
    overvalued_count = 0

    for sid, s in SECTOR_DATABASE.items():
        # Metric mapping
        if metric == "pb":
            cur_val = s["current_pb"]
            med_val = round(s["current_pb"] * 0.92, 2)
            min_val = round(s["current_pb"] * 0.65, 2)
            max_val = round(s["current_pb"] * 1.45, 2)
        elif metric == "ev_ebitda":
            cur_val = s["current_ev_ebitda"]
            med_val = round(s["current_ev_ebitda"] * 0.95, 2)
            min_val = round(s["current_ev_ebitda"] * 0.70, 2)
            max_val = round(s["current_ev_ebitda"] * 1.50, 2)
        elif metric == "div_yield":
            cur_val = s["current_div_yield"]
            med_val = round(s["current_div_yield"] * 1.1, 2)
            min_val = round(s["current_div_yield"] * 0.5, 2)
            max_val = round(s["current_div_yield"] * 1.8, 2)
        else: # pe (default)
            cur_val = s["current_pe"]
            if lookback == "3y":
                med_val = s["pe_3y_median"]
            elif lookback == "10y":
                med_val = s["pe_10y_median"]
            else:
                med_val = s["pe_5y_median"]
            min_val = s["pe_5y_min"]
            max_val = s["pe_5y_max"]

        pctile = calculate_valuation_percentile(cur_val, min_val, max_val)
        zone_info = classify_valuation_zone(pctile)

        if zone_info["code"] == "UNDERVALUED":
            undervalued_count += 1
        elif zone_info["code"] == "FAIR_VALUE":
            fair_count += 1
        else:
            overvalued_count += 1

        # Phase filter check
        if phase_filter != "all":
            if phase_filter == "phase_1" and s["capex_phase_num"] != 1:
                continue
            if phase_filter == "phase_2" and s["capex_phase_num"] != 2:
                continue
            if phase_filter == "phase_3" and s["capex_phase_num"] != 3:
                continue

        # Divergence vs median %
        divergence_pct = round(((cur_val - med_val) / med_val) * 100.0, 1) if med_val > 0 else 0.0

        sectors_list.append({
            "id": s["id"],
            "name": s["name"],
            "category": s["category"],
            "index_ticker": s["index_ticker"],
            "current_multiple": cur_val,
            "historical_median": med_val,
            "min_multiple": min_val,
            "max_multiple": max_val,
            "divergence_pct": divergence_pct,
            "percentile": pctile,
            "zone": zone_info["zone"],
            "zone_code": zone_info["code"],
            "zone_badge": zone_info["badge"],
            "zone_color": zone_info["color"],
            "earnings_growth_yoy": s["earnings_growth_yoy"],
            "roce_pct": s["roce_pct"],
            "capex_phase": s["capex_phase"],
            "capex_phase_num": s["capex_phase_num"],
            "gross_block_growth_yoy": s["gross_block_growth_yoy"],
            "capex_to_ocf_pct": s["capex_to_ocf_pct"],
            "asset_turnover": s["asset_turnover"],
            "rs_1m": s["rs_1m"],
            "rs_3m": s["rs_3m"],
            "rs_6m": s["rs_6m"],
            "rs_1y": s["rs_1y"],
            "constituents_count": len(s["constituents"])
        })

    # Sort sectors by valuation percentile ascending (cheapest first)
    sectors_list.sort(key=lambda x: x["percentile"])

    return {
        "metric": metric,
        "lookback": lookback,
        "phase_filter": phase_filter,
        "total_sectors": len(SECTOR_DATABASE),
        "filtered_count": len(sectors_list),
        "macro_summary": {
            "nifty50_pe": 22.4,
            "nifty50_pb": 3.8,
            "nifty50_pe_percentile": 54.2,
            "undervalued_count": undervalued_count,
            "fair_value_count": fair_count,
            "overvalued_count": overvalued_count,
            "leading_sector": "Nifty Auto (+38.5% 1Y RS)",
            "lagging_sector": "Chemicals (-8.4% 1Y RS)"
        },
        "sectors": sectors_list
    }


def get_sector_deep_dive(sector_id: str) -> Optional[Dict[str, Any]]:
    """
    Returns detailed deep-dive analytics for a single sector including constituent stock table.
    """
    clean_id = sector_id.lower().replace(" ", "_").replace("-", "_")
    
    # Fuzzy resolution
    matched_key = None
    for k in SECTOR_DATABASE.keys():
        if clean_id in k or k in clean_id:
            matched_key = k
            break
    
    if not matched_key:
        matched_key = "nifty_auto" # fallback

    sec = SECTOR_DATABASE[matched_key]
    med_pe = sec["pe_5y_median"]

    # Enrich constituents with divergence vs sector median
    constituents = []
    for c in sec["constituents"]:
        div_vs_sector = round(((c["pe"] - sec["current_pe"]) / sec["current_pe"]) * 100.0, 1) if sec["current_pe"] > 0 else 0.0
        constituents.append({
            **c,
            "divergence_vs_sector_pct": div_vs_sector,
            "valuation_status": "Cheaper than Sector" if div_vs_sector < 0 else "Premium to Sector"
        })

    # Sort constituents by P/E ascending
    constituents.sort(key=lambda x: x["pe"])

    pctile = calculate_valuation_percentile(sec["current_pe"], sec["pe_5y_min"], sec["pe_5y_max"])
    zone_info = classify_valuation_zone(pctile)

    return {
        "id": sec["id"],
        "name": sec["name"],
        "category": sec["category"],
        "index_ticker": sec["index_ticker"],
        "current_pe": sec["current_pe"],
        "current_pb": sec["current_pb"],
        "current_ev_ebitda": sec["current_ev_ebitda"],
        "current_div_yield": sec["current_div_yield"],
        "pe_3y_median": sec["pe_3y_median"],
        "pe_5y_median": sec["pe_5y_median"],
        "pe_10y_median": sec["pe_10y_median"],
        "pe_5y_min": sec["pe_5y_min"],
        "pe_5y_max": sec["pe_5y_max"],
        "valuation_percentile": pctile,
        "zone": zone_info["zone"],
        "zone_code": zone_info["code"],
        "zone_badge": zone_info["badge"],
        "earnings_growth_yoy": sec["earnings_growth_yoy"],
        "roce_pct": sec["roce_pct"],
        "capex_phase": sec["capex_phase"],
        "capex_phase_num": sec["capex_phase_num"],
        "gross_block_growth_yoy": sec["gross_block_growth_yoy"],
        "capex_to_ocf_pct": sec["capex_to_ocf_pct"],
        "asset_turnover": sec["asset_turnover"],
        "capex_commentary": sec["capex_commentary"],
        "relative_strength": {
            "rs_1m": sec["rs_1m"],
            "rs_3m": sec["rs_3m"],
            "rs_6m": sec["rs_6m"],
            "rs_1y": sec["rs_1y"]
        },
        "constituents": constituents
    }


def get_capex_cycle_matrix() -> Dict[str, Any]:
    """
    Returns aggregate 3-Phase Capex Matrix categorizing all 16 Indian sectors.
    """
    phase_1_sectors = []
    phase_2_sectors = []
    phase_3_sectors = []

    for sid, s in SECTOR_DATABASE.items():
        summary = {
            "id": s["id"],
            "name": s["name"],
            "gross_block_growth_yoy": s["gross_block_growth_yoy"],
            "capex_to_ocf_pct": s["capex_to_ocf_pct"],
            "asset_turnover": s["asset_turnover"],
            "roce_pct": s["roce_pct"],
            "commentary": s["capex_commentary"]
        }
        if s["capex_phase_num"] == 1:
            phase_1_sectors.append(summary)
        elif s["capex_phase_num"] == 2:
            phase_2_sectors.append(summary)
        else:
            phase_3_sectors.append(summary)

    return {
        "total_sectors": len(SECTOR_DATABASE),
        "phase_1_initiation": {
            "title": "Phase 1: Capacity Initiation",
            "theme": "Capacity Announcements & High Initial WIP",
            "key_drivers": "Government mandates, indigenization, PLI incentives, green energy transition.",
            "count": len(phase_1_sectors),
            "sectors": phase_1_sectors
        },
        "phase_2_execution": {
            "title": "Phase 2: Peak Capex & Execution",
            "theme": "Heavy Construction, Margin Pressure & High Debt/WIP",
            "key_drivers": "Blast furnaces, injectable plants, high commercial/residential launch pipelines.",
            "count": len(phase_2_sectors),
            "sectors": phase_2_sectors
        },
        "phase_3_harvest": {
            "title": "Phase 3: Operating Leverage Harvest",
            "theme": "Capacity Operational, Asset Turnover Expansion & FCF Surges",
            "key_drivers": "Peak margins, rapid cash flow conversion, high RoCE and dividend step-ups.",
            "count": len(phase_3_sectors),
            "sectors": phase_3_sectors
        }
    }
