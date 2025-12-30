import numpy as np
import pandas as pd

def calculate_metrics(df, portfolio, capital):
    """
    Calculate performance metrics using actual portfolio equity curve.
    
    Equity = Cash + Position * Close Price (tracked daily by BackTester)
    
    Trade counting:
    - A "trade" is counted as 1 only when both BUY and SELL happen (round-trip)
    - Open positions are tracked separately
    """
    df = df.copy()
    
    # Calculate daily returns from equity curve
    df["equity_returns"] = df["equity"].pct_change().fillna(0)
    
    # Total Return
    total_return = (df["equity"].iloc[-1] / capital) - 1
    
    # CAGR (assuming 252 trading days per year)
    n_days = len(df)
    if n_days > 1:
        cagr = (df["equity"].iloc[-1] / capital) ** (252 / n_days) - 1
    else:
        cagr = 0
    
    # Maximum Drawdown
    rolling_max = df["equity"].cummax()
    drawdown = df["equity"] / rolling_max - 1
    max_dd = drawdown.min()
    
    # Sharpe Ratio (annualized)
    if df["equity_returns"].std() != 0:
        sharpe = (df["equity_returns"].mean() / df["equity_returns"].std()) * np.sqrt(252)
    else:
        sharpe = 0
    
    # Trade statistics
    # A completed trade = BUY + SELL pair
    all_trades = portfolio.trades
    completed_trades = [t for t in all_trades if t["type"] == "SELL"]
    open_positions = 1 if portfolio.position == 1 else 0
    
    # Win rate based on completed trades only
    wins = sum(1 for t in completed_trades if t["pnl"] is not None and t["pnl"] > 0)
    losses = sum(1 for t in completed_trades if t["pnl"] is not None and t["pnl"] <= 0)
    
    return {
        "Total Return": round(total_return * 100, 2),
        "CAGR": round(cagr * 100, 2),
        "Max Drawdown": round(max_dd * 100, 2),
        "Sharpe Ratio": round(sharpe, 2),
        "Completed Trades": len(completed_trades),  # Only count BUY+SELL pairs
        "Open Positions": open_positions,
        "Winning Trades": wins,
        "Losing Trades": losses,
        "Win Rate": round(wins / len(completed_trades) * 100, 2) if completed_trades else 0
    }
