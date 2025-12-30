import sys
from pathlib import Path

# Add BackTesting directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pandas as pd
from strategies.sma_crossover import SMACrossover
from engine.BackTester import Backtester
from engine.Portfolio import Portfolio
from engine.ExecutionEngine import ExecutionEngine
from metric.Performance import calculate_metrics

def main():
    # Use path relative to BackTesting directory
    data_path = Path(__file__).resolve().parent.parent / "data" / "reliance.csv"
    data = pd.read_csv(data_path, thousands=",")
    
    # Clean column names (remove extra whitespace)
    data.columns = data.columns.str.strip()
    
    # Parse date column
    data["date"] = pd.to_datetime(data["date"], dayfirst=True)

    strategy = SMACrossover(20, 50)
    portfolio = Portfolio(capital=1_000_000)
    execution = ExecutionEngine()

    bt = Backtester(data, strategy, portfolio, execution)
    result_df = bt.run()

    metrics = calculate_metrics(result_df, portfolio, 1_000_000)

    print("\n📊 BACKTEST RESULTS")
    for k, v in metrics.items():
        print(f"{k}: {v}")
    
    # Display detailed trade information
    print("\n" + "=" * 90)
    print("📈 TRADE DETAILS")
    print("=" * 90)
    
    trade_num = 0
    for i, trade in enumerate(portfolio.trades):
        charges = trade["charges"]
        
        if trade["type"] == "BUY":
            trade_num += 1
            print(f"\n{'─' * 90}")
            print(f"🟢 TRADE {trade_num} - BUY")
            print(f"{'─' * 90}")
            print(f"   Date:           {trade['date'].strftime('%Y-%m-%d')}")
            print(f"   Price:          ₹{trade['price']:,.2f}")
            print(f"   Quantity:       {trade['qty']:,}")
            print(f"   Trade Value:    ₹{trade['trade_value']:,.2f}")
            print(f"\n   📋 CHARGES BREAKDOWN:")
            print(f"      Brokerage:   ₹{charges['brokerage']:,.2f}")
            print(f"      STT:         ₹{charges['stt']:,.2f}")
            print(f"      Exchange:    ₹{charges['exchange_fee']:,.2f}")
            print(f"      SEBI:        ₹{charges['sebi_fee']:,.2f}")
            print(f"      GST:         ₹{charges['gst']:,.2f}")
            print(f"      Stamp Duty:  ₹{charges['stamp_duty']:,.2f}")
            print(f"      ────────────────────")
            print(f"      TOTAL:       ₹{charges['total']:,.2f}")
            print(f"\n   💰 Cash After:  ₹{trade['cash_after']:,.2f}")
            
        else:  # SELL
            print(f"\n🔴 TRADE {trade_num} - SELL")
            print(f"{'─' * 90}")
            print(f"   Buy Date:       {trade['buy_date'].strftime('%Y-%m-%d')}")
            print(f"   Sell Date:      {trade['date'].strftime('%Y-%m-%d')}")
            print(f"   Holding:        {trade['holding_days']} days")
            print(f"\n   Buy Price:      ₹{trade['buy_price']:,.2f}")
            print(f"   Sell Price:     ₹{trade['price']:,.2f}")
            print(f"   Quantity:       {trade['qty']:,}")
            print(f"   Trade Value:    ₹{trade['trade_value']:,.2f}")
            print(f"\n   📋 CHARGES BREAKDOWN:")
            print(f"      Brokerage:   ₹{charges['brokerage']:,.2f}")
            print(f"      STT:         ₹{charges['stt']:,.2f}")
            print(f"      Exchange:    ₹{charges['exchange_fee']:,.2f}")
            print(f"      SEBI:        ₹{charges['sebi_fee']:,.2f}")
            print(f"      GST:         ₹{charges['gst']:,.2f}")
            print(f"      Stamp Duty:  ₹{charges['stamp_duty']:,.2f}")
            print(f"      ────────────────────")
            print(f"      TOTAL:       ₹{charges['total']:,.2f}")
            print(f"\n   📊 Buy Charges:  ₹{trade['buy_charges']:,.2f}")
            print(f"   📊 Sell Charges: ₹{charges['total']:,.2f}")
            print(f"   📊 Total Costs:  ₹{trade['buy_charges'] + charges['total']:,.2f}")
            pnl_icon = '✅' if trade['pnl'] > 0 else '❌'
            print(f"\n   💵 P&L:          ₹{trade['pnl']:,.2f} {pnl_icon}")
            print(f"   💰 Cash After:   ₹{trade['cash_after']:,.2f}")
    
    # Calculate total charges
    total_charges = sum(t["charges"]["total"] for t in portfolio.trades)
    
    # Calculate current holdings value (if any open position)
    last_price = result_df.iloc[-1]["close"]
    holdings_value = portfolio.position_qty * last_price if portfolio.position == 1 else 0
    total_portfolio_value = portfolio.cash + holdings_value
    
    print("\n" + "=" * 90)
    print("💼 SUMMARY")
    print("=" * 90)
    print(f"   Initial Capital:   ₹{portfolio.initial_capital:,.2f}")
    print(f"   Cash Balance:      ₹{portfolio.cash:,.2f}")
    
    if portfolio.position == 1:
        print(f"\n   📦 OPEN POSITION:")
        print(f"      Quantity:       {portfolio.position_qty:,} shares")
        print(f"      Entry Price:    ₹{portfolio.entry_price:,.2f}")
        print(f"      Current Price:  ₹{last_price:,.2f}")
        print(f"      Holdings Value: ₹{holdings_value:,.2f}")
        unrealized_pnl = (last_price - portfolio.entry_price) * portfolio.position_qty
        pnl_icon = '✅' if unrealized_pnl > 0 else '❌'
        print(f"      Unrealized P&L: ₹{unrealized_pnl:,.2f} {pnl_icon}")
    
    print(f"\n   💰 Total Portfolio: ₹{total_portfolio_value:,.2f}")
    print(f"   📊 Total Charges:   ₹{total_charges:,.2f}")
    net_pnl = total_portfolio_value - portfolio.initial_capital
    pct_return = (net_pnl / portfolio.initial_capital) * 100
    pnl_icon = '✅' if net_pnl > 0 else '❌'
    print(f"   💵 Net P&L:         ₹{net_pnl:,.2f} {pnl_icon}")
    print(f"   📈 Return:          {pct_return:.2f}%")
    print("=" * 90)

if __name__ == "__main__":
    main()
