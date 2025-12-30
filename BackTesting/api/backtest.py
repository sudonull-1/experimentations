"""
Vercel Serverless Function: /api/backtest
"""
import sys
from pathlib import Path
import json

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from http.server import BaseHTTPRequestHandler
import pandas as pd

from strategies.sma_crossover import SMACrossover
from engine.BackTester import Backtester
from engine.Portfolio import Portfolio
from engine.ExecutionEngine import ExecutionEngine
from metric.Performance import calculate_metrics


def run_backtest():
    """Run backtest and return all data"""
    data_path = Path(__file__).resolve().parent.parent / "data" / "reliance.csv"
    data = pd.read_csv(data_path, thousands=",")
    data.columns = data.columns.str.strip()
    data["date"] = pd.to_datetime(data["date"], dayfirst=True)

    strategy = SMACrossover(20, 50)
    portfolio = Portfolio(capital=1_000_000)
    execution = ExecutionEngine()

    bt = Backtester(data, strategy, portfolio, execution)
    result_df = bt.run()

    metrics = calculate_metrics(result_df, portfolio, 1_000_000)
    
    last_price = result_df.iloc[-1]["close"]
    holdings_value = portfolio.position_qty * last_price if portfolio.position == 1 else 0
    total_portfolio_value = portfolio.cash + holdings_value
    
    trades = []
    for trade in portfolio.trades:
        trade_data = {
            "type": trade["type"],
            "date": trade["date"].strftime("%Y-%m-%d"),
            "price": trade["price"],
            "qty": trade["qty"],
            "trade_value": trade["trade_value"],
            "charges": trade["charges"],
            "cash_after": trade["cash_after"],
            "pnl": trade.get("pnl"),
        }
        if trade["type"] == "SELL":
            trade_data["buy_date"] = trade["buy_date"].strftime("%Y-%m-%d")
            trade_data["buy_price"] = trade["buy_price"]
            trade_data["buy_charges"] = trade["buy_charges"]
            trade_data["holding_days"] = trade["holding_days"]
        trades.append(trade_data)
    
    chart_data = []
    for _, row in result_df.iterrows():
        chart_data.append({
            "date": row["date"].strftime("%Y-%m-%d"),
            "close": round(row["close"], 2),
            "sma_short": round(row["sma_short"], 2) if pd.notna(row["sma_short"]) else None,
            "sma_long": round(row["sma_long"], 2) if pd.notna(row["sma_long"]) else None,
            "signal": int(row["signal"]),
            "equity": round(row["equity"], 2),
            "cash": round(row["cash"], 2),
            "holdings": round(row["holdings"], 2)
        })
    
    open_position = None
    if portfolio.position == 1:
        unrealized_pnl = (last_price - portfolio.entry_price) * portfolio.position_qty
        open_position = {
            "qty": portfolio.position_qty,
            "entry_price": round(portfolio.entry_price, 2),
            "entry_date": portfolio.entry_date.strftime("%Y-%m-%d"),
            "current_price": round(last_price, 2),
            "holdings_value": round(holdings_value, 2),
            "unrealized_pnl": round(unrealized_pnl, 2)
        }
    
    total_charges = sum(t["charges"]["total"] for t in portfolio.trades)
    
    return {
        "metrics": metrics,
        "trades": trades,
        "chart_data": chart_data,
        "summary": {
            "initial_capital": portfolio.initial_capital,
            "cash_balance": round(portfolio.cash, 2),
            "holdings_value": round(holdings_value, 2),
            "total_portfolio": round(total_portfolio_value, 2),
            "total_charges": round(total_charges, 2),
            "net_pnl": round(total_portfolio_value - portfolio.initial_capital, 2),
            "return_pct": round(((total_portfolio_value - portfolio.initial_capital) / portfolio.initial_capital) * 100, 2)
        },
        "open_position": open_position
    }


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        try:
            response = run_backtest()
        except Exception as e:
            response = {"error": str(e)}
        
        self.wfile.write(json.dumps(response).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

