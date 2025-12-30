import pandas as pd

class SMACrossover:
    def __init__(self, short_window=20, long_window=50):
        self.short = short_window
        self.long = long_window

    def generate_signals(self, df: pd.DataFrame):
        df = df.copy()
        df["sma_short"] = df["close"].rolling(self.short).mean()
        df["sma_long"] = df["close"].rolling(self.long).mean()

        df["signal"] = 0
        df.loc[df["sma_short"] > df["sma_long"], "signal"] = 1
        df.loc[df["sma_short"] < df["sma_long"], "signal"] = -1

        return df
