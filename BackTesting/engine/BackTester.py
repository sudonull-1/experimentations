class Backtester:
    def __init__(self, data, strategy, portfolio, execution):
        self.data = data
        self.strategy = strategy
        self.portfolio = portfolio
        self.execution = execution

    def run(self):
        df = self.strategy.generate_signals(self.data)
        
        # Initialize equity tracking columns
        equity_curve = []
        cash_curve = []
        holdings_curve = []

        for i in range(len(df)):
            price = df.iloc[i]["close"]
            date = df.iloc[i]["date"]
            
            # Execute trades (skip first row for signal comparison)
            if i > 0:
                signal = df.iloc[i]["signal"]
                
                if signal == 1 and self.portfolio.position == 0:
                    # Calculate max quantity we can buy with available cash
                    # Account for slippage and approximate charges (~0.2%)
                    approx_price = price * 1.003  # slippage + charges buffer
                    qty = int(self.portfolio.cash / approx_price)
                    
                    if qty > 0:
                        fill_price, charges = self.execution.execute(price, qty, "BUY")
                        self.portfolio.update(date, fill_price, qty, charges, "BUY")

                elif signal == -1 and self.portfolio.position == 1:
                    # Sell all held quantity
                    qty = self.portfolio.position_qty
                    fill_price, charges = self.execution.execute(price, qty, "SELL")
                    self.portfolio.update(date, fill_price, qty, charges, "SELL")
            
            # Calculate daily equity: cash + position * close_price
            holdings_value = self.portfolio.position_qty * price
            daily_equity = self.portfolio.cash + holdings_value
            
            equity_curve.append(daily_equity)
            cash_curve.append(self.portfolio.cash)
            holdings_curve.append(holdings_value)
        
        # Add equity tracking to dataframe
        df["equity"] = equity_curve
        df["cash"] = cash_curve
        df["holdings"] = holdings_curve

        return df
