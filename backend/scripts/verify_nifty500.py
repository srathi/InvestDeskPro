#!/usr/bin/env python3
"""
Nifty 500 Automated Background Verification Runner.
Compares InvestDeskPro API (http://127.0.0.1:8005) against Screener.in live data
and outputs comprehensive discrepancy reports (CSV, JSON, and Summary Markdown).
"""

import os
import sys
import time
import csv
import json
import re
import urllib.request
import urllib.parse
from typing import Dict, Any, Optional

NIFTY500_CSV = "/Users/sandesh/Desktop/myProjects/other_repos/warren-buffett-skill/reports/_lists/nifty500.csv"
REPORT_CSV = "/Users/sandesh/antigravity/investdeskpro/nifty500_verification_report.csv"
REPORT_JSON = "/Users/sandesh/antigravity/investdeskpro/nifty500_verification_report.json"
REPORT_MD = "/Users/sandesh/antigravity/investdeskpro/nifty500_verification_summary.md"
LOG_FILE = "/Users/sandesh/antigravity/investdeskpro/nifty500_verification.log"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
}


def log_msg(msg: str):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def parse_screener_page(symbol: str) -> Dict[str, Any]:
    """Fetch and parse essential metrics directly from Screener.in."""
    urls = [
        f"https://www.screener.in/company/{urllib.parse.quote(symbol)}/consolidated/",
        f"https://www.screener.in/company/{urllib.parse.quote(symbol)}/",
    ]
    
    html = ""
    for u in urls:
        try:
            req = urllib.request.Request(u, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=8) as resp:
                html = resp.read().decode("utf-8")
                if "Market Cap" in html:
                    break
        except Exception:
            continue

    if not html:
        return {}

    def get_metric(name: str) -> Optional[float]:
        pattern = r'<span class="name">\s*' + re.escape(name) + r'\s*</span>.*?<span class="number">\s*([^<]+)\s*</span>'
        m = re.search(pattern, html, re.DOTALL)
        if m:
            clean_str = m.group(1).replace(",", "").strip()
            try:
                return float(clean_str)
            except ValueError:
                return None
        return None

    return {
        "market_cap_cr": get_metric("Market Cap"),
        "current_price": get_metric("Current Price"),
        "pe": get_metric("Stock P/E"),
        "book_value": get_metric("Book Value"),
        "dividend_yield": get_metric("Dividend Yield"),
        "roce": get_metric("ROCE"),
        "roe": get_metric("ROE"),
        "face_value": get_metric("Face Value"),
        "high_52w": None,  # high/low usually in combined span
    }


def fetch_investdesk_data(symbol: str) -> Dict[str, Any]:
    """Fetch live company data from local InvestDeskPro backend API."""
    url = f"http://127.0.0.1:8005/api/v1/company/{urllib.parse.quote(symbol)}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "InvestDesk-Verifier/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            ess = data.get("essentials", {})
            return {
                "success": True,
                "ticker": data.get("ticker"),
                "company_name": data.get("company_name"),
                "sector": data.get("sector"),
                "market_cap_cr": ess.get("market_cap_cr"),
                "current_price": ess.get("current_price"),
                "pe": ess.get("pe"),
                "pb": ess.get("pb"),
                "roce": ess.get("roce"),
                "roe": ess.get("roe"),
                "dividend_yield": ess.get("dividend_yield"),
                "debt_to_equity": ess.get("debt_to_equity"),
                "high_52w": ess.get("high_52w"),
                "low_52w": ess.get("low_52w"),
                "market_cap_category": data.get("market_cap_category"),
            }
    except Exception as e:
        return {"success": False, "error": str(e)}


def calc_error_pct(val1: Optional[float], val2: Optional[float]) -> Optional[float]:
    """Calculate absolute percentage difference."""
    if val1 is None or val2 is None or val2 == 0:
        return None
    return round(abs((val1 - val2) / val2) * 100.0, 2)


def generate_markdown_summary(results: list):
    """Generate high-level markdown summary table and metrics."""
    total = len(results)
    if total == 0:
        return

    successful = [r for r in results if r.get("status") == "SUCCESS"]
    failed = [r for r in results if r.get("status") != "SUCCESS"]

    # Calculate average error margins
    mcap_errors = [r["mcap_err_pct"] for r in successful if r["mcap_err_pct"] is not None]
    price_errors = [r["price_err_pct"] for r in successful if r["price_err_pct"] is not None]
    pe_errors = [r["pe_err_pct"] for r in successful if r["pe_err_pct"] is not None]

    avg_mcap_err = round(sum(mcap_errors) / len(mcap_errors), 2) if mcap_errors else 0.0
    avg_price_err = round(sum(price_errors) / len(price_errors), 2) if price_errors else 0.0
    avg_pe_err = round(sum(pe_errors) / len(pe_errors), 2) if pe_errors else 0.0

    # Count outliers (>5% mcap difference)
    mcap_outliers = [r for r in successful if r["mcap_err_pct"] is not None and r["mcap_err_pct"] > 5.0]

    with open(REPORT_MD, "w", encoding="utf-8") as f:
        f.write("# 📊 Nifty 500 Verification & Fidelity Report\n\n")
        f.write(f"**Last Updated:** {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"- **Total Stocks Tested:** {total} / 501\n")
        f.write(f"- **Successful Verifications:** {len(successful)} ({(len(successful)/total)*100:.1f}%)\n")
        f.write(f"- **Failed / Unavailable:** {len(failed)}\n")
        f.write(f"- **Avg Market Cap Variance:** `{avg_mcap_err}%`\n")
        f.write(f"- **Avg CMP Variance:** `{avg_price_err}%`\n")
        f.write(f"- **Avg P/E Variance:** `{avg_pe_err}%`\n")
        f.write(f"- **Market Cap Outliers (>5%):** {len(mcap_outliers)}\n\n")

        f.write("## 📋 Sample Verification Log (Latest 30 Equities)\n\n")
        f.write("| Symbol | Company Name | InvestDesk CMP | Screener CMP | Price Err % | InvestDesk MCap (₹ Cr) | Screener MCap (₹ Cr) | MCap Err % | Status |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n")

        for r in results[-30:]:
            id_cmp = f"₹{r['id_price']}" if r.get('id_price') else "N/A"
            sc_cmp = f"₹{r['sc_price']}" if r.get('sc_price') else "N/A"
            p_err = f"{r['price_err_pct']}%" if r.get('price_err_pct') is not None else "-"
            id_mc = f"₹{r['id_mcap_cr']:,.1f}" if r.get('id_mcap_cr') else "N/A"
            sc_mc = f"₹{r['sc_mcap_cr']:,.1f}" if r.get('sc_mcap_cr') else "N/A"
            m_err = f"{r['mcap_err_pct']}%" if r.get('mcap_err_pct') is not None else "-"
            status = "✅ PASS" if (r.get('mcap_err_pct') or 0) <= 5.0 and r.get('status') == "SUCCESS" else "⚠️ REVIEW"
            f.write(f"| `{r['symbol']}` | {r.get('company_name', '')[:22]} | {id_cmp} | {sc_cmp} | {p_err} | {id_mc} | {sc_mc} | {m_err} | {status} |\n")


def main():
    delay_seconds = int(sys.argv[1]) if len(sys.argv) > 1 else 10  # Default 10 seconds between calls
    log_msg(f"Starting Nifty 500 Verification Run with {delay_seconds}s throttle per stock...")

    # Read Nifty 500 symbols
    symbols_data = []
    if os.path.exists(NIFTY500_CSV):
        with open(NIFTY500_CSV, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                sym = row.get("Symbol", "").strip()
                name = row.get("Company Name", "").strip()
                ind = row.get("Industry", "").strip()
                if sym:
                    symbols_data.append({"symbol": sym, "name": name, "industry": ind})
    else:
        log_msg(f"Error: Nifty 500 CSV not found at {NIFTY500_CSV}")
        return

    log_msg(f"Loaded {len(symbols_data)} equities from Nifty 500 list.")

    # Prepare CSV Header if not exists
    csv_fields = [
        "symbol", "company_name", "industry", "status",
        "id_price", "sc_price", "price_err_pct",
        "id_mcap_cr", "sc_mcap_cr", "mcap_err_pct",
        "id_pe", "sc_pe", "pe_err_pct",
        "id_roe", "sc_roe",
        "id_roce", "sc_roce",
        "id_div_yield", "sc_div_yield",
        "error_message"
    ]

    all_results = []

    # If CSV exists, read already processed symbols to allow resuming
    processed_symbols = set()
    if os.path.exists(REPORT_CSV):
        try:
            with open(REPORT_CSV, "r", encoding="utf-8") as f:
                rdr = csv.DictReader(f)
                for r in rdr:
                    processed_symbols.add(r["symbol"])
                    # Populate in memory results
                    all_results.append({
                        "symbol": r["symbol"],
                        "company_name": r["company_name"],
                        "status": r["status"],
                        "id_price": float(r["id_price"]) if r["id_price"] else None,
                        "sc_price": float(r["sc_price"]) if r["sc_price"] else None,
                        "price_err_pct": float(r["price_err_pct"]) if r["price_err_pct"] else None,
                        "id_mcap_cr": float(r["id_mcap_cr"]) if r["id_mcap_cr"] else None,
                        "sc_mcap_cr": float(r["sc_mcap_cr"]) if r["sc_mcap_cr"] else None,
                        "mcap_err_pct": float(r["mcap_err_pct"]) if r["mcap_err_pct"] else None,
                    })
        except Exception:
            pass

    if not os.path.exists(REPORT_CSV) or len(processed_symbols) == 0:
        with open(REPORT_CSV, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=csv_fields)
            writer.writeheader()

    for idx, item in enumerate(symbols_data, 1):
        sym = item["symbol"]
        name = item["name"]

        if sym in processed_symbols:
            continue

        log_msg(f"[{idx}/{len(symbols_data)}] Verifying {sym} ({name})...")

        id_data = fetch_investdesk_data(sym)
        sc_data = parse_screener_page(sym)

        if not id_data.get("success"):
            row = {
                "symbol": sym,
                "company_name": name,
                "industry": item["industry"],
                "status": "INVESTDESK_ERROR",
                "id_price": None, "sc_price": None, "price_err_pct": None,
                "id_mcap_cr": None, "sc_mcap_cr": None, "mcap_err_pct": None,
                "id_pe": None, "sc_pe": None, "pe_err_pct": None,
                "id_roe": None, "sc_roe": None,
                "id_roce": None, "sc_roce": None,
                "id_div_yield": None, "sc_div_yield": None,
                "error_message": id_data.get("error", "API failure"),
            }
        elif not sc_data or sc_data.get("market_cap_cr") is None:
            row = {
                "symbol": sym,
                "company_name": id_data.get("company_name") or name,
                "industry": item["industry"],
                "status": "SCREENER_MISSING",
                "id_price": id_data.get("current_price"), "sc_price": None, "price_err_pct": None,
                "id_mcap_cr": id_data.get("market_cap_cr"), "sc_mcap_cr": None, "mcap_err_pct": None,
                "id_pe": id_data.get("pe"), "sc_pe": None, "pe_err_pct": None,
                "id_roe": id_data.get("roe"), "sc_roe": None,
                "id_roce": id_data.get("roce"), "sc_roce": None,
                "id_div_yield": id_data.get("dividend_yield"), "sc_div_yield": None,
                "error_message": "Screener.in page not found or unparseable",
            }
        else:
            p_err = calc_error_pct(id_data.get("current_price"), sc_data.get("current_price"))
            m_err = calc_error_pct(id_data.get("market_cap_cr"), sc_data.get("market_cap_cr"))
            pe_err = calc_error_pct(id_data.get("pe"), sc_data.get("pe"))

            row = {
                "symbol": sym,
                "company_name": id_data.get("company_name") or name,
                "industry": item["industry"],
                "status": "SUCCESS",
                "id_price": id_data.get("current_price"),
                "sc_price": sc_data.get("current_price"),
                "price_err_pct": p_err,
                "id_mcap_cr": id_data.get("market_cap_cr"),
                "sc_mcap_cr": sc_data.get("market_cap_cr"),
                "mcap_err_pct": m_err,
                "id_pe": id_data.get("pe"),
                "sc_pe": sc_data.get("pe"),
                "pe_err_pct": pe_err,
                "id_roe": id_data.get("roe"),
                "sc_roe": sc_data.get("roe"),
                "id_roce": id_data.get("roce"),
                "sc_roce": sc_data.get("roce"),
                "id_div_yield": id_data.get("dividend_yield"),
                "sc_div_yield": sc_data.get("dividend_yield"),
                "error_message": "",
            }
            log_msg(f"   -> Result: CMP (ID ₹{row['id_price']} vs SC ₹{row['sc_price']} | Err {p_err}%) | MCap (ID ₹{row['id_mcap_cr']} Cr vs SC ₹{row['sc_mcap_cr']} Cr | Err {m_err}%)")

        # Append to CSV
        with open(REPORT_CSV, "a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=csv_fields)
            writer.writerow(row)

        all_results.append(row)

        # Update JSON and Markdown summary periodically
        if len(all_results) % 5 == 0 or idx == len(symbols_data):
            with open(REPORT_JSON, "w", encoding="utf-8") as f:
                json.dump(all_results, f, indent=2)
            generate_markdown_summary(all_results)

        # Throttle sleep
        time.sleep(delay_seconds)

    log_msg("Nifty 500 verification completed successfully!")


if __name__ == "__main__":
    main()
