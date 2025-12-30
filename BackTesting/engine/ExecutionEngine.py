class ExecutionEngine:
    def __init__(self, slippage=0.001):
        self.slippage = slippage
        
        # Charge rates
        self.BROKERAGE_RATE = 0.0003      # 0.03%
        self.STT_RATE = 0.001             # 0.1% (SELL only)
        self.EXCHANGE_TXN = 0.0000345
        self.SEBI_RATE = 0.000001
        self.STAMP_DUTY = 0.00015         # BUY only
        self.GST_RATE = 0.18

    def calculate_charges(self, price, qty, side):
        """Calculate all trading charges for a transaction"""
        turnover = price * qty

        brokerage = turnover * self.BROKERAGE_RATE
        exchange_fee = turnover * self.EXCHANGE_TXN
        sebi_fee = turnover * self.SEBI_RATE
        gst = self.GST_RATE * (brokerage + exchange_fee)
        stt = turnover * self.STT_RATE if side == "SELL" else 0
        stamp = turnover * self.STAMP_DUTY if side == "BUY" else 0

        total_charges = (
            brokerage +
            exchange_fee +
            sebi_fee +
            gst +
            stt +
            stamp
        )

        return {
            "brokerage": round(brokerage, 2),
            "stt": round(stt, 2),
            "exchange_fee": round(exchange_fee, 2),
            "sebi_fee": round(sebi_fee, 2),
            "gst": round(gst, 2),
            "stamp_duty": round(stamp, 2),
            "total": round(total_charges, 2)
        }

    def execute(self, price, qty, side):
        """Execute a trade with slippage and calculate charges"""
        # Apply slippage (higher price for buy, lower for sell)
        if side == "BUY":
            fill_price = price * (1 + self.slippage)
        else:
            fill_price = price * (1 - self.slippage)
        
        charges = self.calculate_charges(fill_price, qty, side)
        
        return fill_price, charges
