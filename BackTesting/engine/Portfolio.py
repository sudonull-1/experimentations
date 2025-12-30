class Portfolio:
    def __init__(self, capital):
        self.initial_capital = capital
        self.cash = capital
        self.position = 0
        self.position_qty = 0
        self.entry_price = 0
        self.entry_date = None
        self.entry_charges = 0
        self.trades = []

    def update(self, date, price, qty, charges, side):
        trade_value = price * qty
        total_charges = charges["total"]
        
        if side == "BUY":
            self.cash -= trade_value + total_charges
            self.position_qty = qty
            self.entry_price = price
            self.entry_date = date
            self.entry_charges = total_charges
            self.position = 1
            
            self.trades.append({
                "type": "BUY",
                "date": date,
                "price": round(price, 2),
                "qty": qty,
                "trade_value": round(trade_value, 2),
                "charges": charges,
                "cash_after": round(self.cash, 2),
                "pnl": None
            })
            
        else:  # SELL
            self.cash += trade_value - total_charges
            
            # P&L = (Sell Value - Buy Value) - All Charges
            buy_value = self.entry_price * self.position_qty
            sell_value = price * qty
            total_cost = self.entry_charges + total_charges
            pnl = sell_value - buy_value - total_cost
            
            self.trades.append({
                "type": "SELL",
                "date": date,
                "price": round(price, 2),
                "qty": qty,
                "trade_value": round(trade_value, 2),
                "charges": charges,
                "cash_after": round(self.cash, 2),
                "pnl": round(pnl, 2),
                "buy_date": self.entry_date,
                "buy_price": round(self.entry_price, 2),
                "buy_charges": round(self.entry_charges, 2),
                "holding_days": (date - self.entry_date).days if self.entry_date else 0
            })
            
            self.position = 0
            self.position_qty = 0
            self.entry_price = 0
            self.entry_date = None
            self.entry_charges = 0
