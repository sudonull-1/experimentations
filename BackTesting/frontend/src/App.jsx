import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Activity,
  Calendar,
  Clock,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertCircle,
  Sun,
  Moon,
  Percent,
  Target,
  LineChart as LineChartIcon,
  PieChart
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import './App.css';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'dark';
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use relative URL in production, localhost in development
      const apiUrl = import.meta.env.PROD 
        ? '/api/backtest' 
        : 'http://localhost:5001/api/backtest';
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <button className="theme-toggle floating-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <RefreshCw className="spin" size={48} />
        <p>Loading backtest results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <button className="theme-toggle floating-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <AlertCircle size={48} />
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <button onClick={fetchData} className="retry-btn">
          <RefreshCw size={18} />
          Retry
        </button>
      </div>
    );
  }

  const { metrics, trades, chart_data, summary, open_position } = data;

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <BarChart3 size={32} />
            <h1>BackTest<span>Pro</span></h1>
          </div>
          <div className="header-info">
            <span className="stock-badge">RELIANCE</span>
            <span className="strategy-badge">SMA Crossover (20/50)</span>
            <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Hero Stats */}
        <section className="hero-stats">
          <div className="hero-stat main-stat">
            <span className="hero-label">Portfolio Value</span>
            <span className="hero-value">₹{summary.total_portfolio.toLocaleString()}</span>
            <span className={`hero-change ${summary.net_pnl >= 0 ? 'positive' : 'negative'}`}>
              {summary.net_pnl >= 0 ? '+' : ''}₹{summary.net_pnl.toLocaleString()} ({summary.return_pct}%)
            </span>
          </div>
        </section>

        {/* Metrics Table */}
        <section className="metrics-table-section">
          <div className="metrics-table-container">
            <table className="metrics-table">
              <thead>
                <tr>
                  <th colSpan="2">Portfolio Summary</th>
                  <th colSpan="2">Performance</th>
                  <th colSpan="2">Trade Statistics</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="label">Initial Capital</td>
                  <td className="value">₹{summary.initial_capital.toLocaleString()}</td>
                  <td className="label">Total Return</td>
                  <td className={`value ${metrics['Total Return'] >= 0 ? 'positive' : 'negative'}`}>{metrics['Total Return']}%</td>
                  <td className="label">Completed Trades</td>
                  <td className="value">{metrics['Completed Trades']}</td>
                </tr>
                <tr>
                  <td className="label">Current Value</td>
                  <td className="value">₹{summary.total_portfolio.toLocaleString()}</td>
                  <td className="label">CAGR</td>
                  <td className={`value ${metrics['CAGR'] >= 0 ? 'positive' : 'negative'}`}>{metrics['CAGR']}%</td>
                  <td className="label">Open Positions</td>
                  <td className="value highlight">{metrics['Open Positions']}</td>
                </tr>
                <tr>
                  <td className="label">Cash Balance</td>
                  <td className="value">₹{summary.cash_balance.toLocaleString()}</td>
                  <td className="label">Max Drawdown</td>
                  <td className="value negative">{metrics['Max Drawdown']}%</td>
                  <td className="label">Winning</td>
                  <td className="value positive">{metrics['Winning Trades']}</td>
                </tr>
                <tr>
                  <td className="label">Holdings Value</td>
                  <td className="value">₹{summary.holdings_value.toLocaleString()}</td>
                  <td className="label">Sharpe Ratio</td>
                  <td className={`value ${metrics['Sharpe Ratio'] >= 1 ? 'positive' : ''}`}>{metrics['Sharpe Ratio']}</td>
                  <td className="label">Losing</td>
                  <td className="value negative">{metrics['Losing Trades']}</td>
                </tr>
                <tr>
                  <td className="label">Total Charges</td>
                  <td className="value muted">₹{summary.total_charges.toLocaleString()}</td>
                  <td className="label">Net P&L</td>
                  <td className={`value ${summary.net_pnl >= 0 ? 'positive' : 'negative'}`}>₹{summary.net_pnl.toLocaleString()}</td>
                  <td className="label">Win Rate</td>
                  <td className={`value ${metrics['Win Rate'] >= 50 ? 'positive' : 'negative'}`}>{metrics['Win Rate']}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Open Position Alert */}
        {open_position && (
          <section className="open-position-banner">
            <div className="banner-content">
              <div className="banner-icon">
                <span className="pulse"></span>
                <Activity size={24} />
              </div>
              <div className="banner-info">
                <h4>Open Position</h4>
                <p>{open_position.qty} shares @ ₹{open_position.entry_price} since {open_position.entry_date}</p>
              </div>
              <div className="banner-stats">
                <div className="banner-stat">
                  <span className="label">Current Price</span>
                  <span className="value">₹{open_position.current_price}</span>
                </div>
                <div className="banner-stat">
                  <span className="label">Holdings Value</span>
                  <span className="value">₹{open_position.holdings_value.toLocaleString()}</span>
                </div>
                <div className="banner-stat">
                  <span className="label">Unrealized P&L</span>
                  <span className={`value ${open_position.unrealized_pnl >= 0 ? 'positive' : 'negative'}`}>
                    {open_position.unrealized_pnl >= 0 ? '+' : ''}₹{open_position.unrealized_pnl.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}


        {/* Price Chart */}
        <section className="chart-section">
          <div className="chart-card">
            <h3>Price & SMA Signals</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chart_data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'} />
                  <XAxis 
                    dataKey="date" 
                    stroke={theme === 'dark' ? '#6b7280' : '#94a3b8'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#64748b', fontSize: 11 }}
                    tickFormatter={(value) => value.slice(5)}
                  />
                  <YAxis 
                    stroke={theme === 'dark' ? '#6b7280' : '#94a3b8'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#64748b', fontSize: 11 }}
                    domain={['dataMin - 50', 'dataMax + 50']}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke="#3b82f6"
                    fill="url(#priceGradient)"
                    strokeWidth={2}
                    name="Price"
                  />
                  <Line
                    type="monotone"
                    dataKey="sma_short"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    dot={false}
                    name="SMA 20"
                  />
                  <Line
                    type="monotone"
                    dataKey="sma_long"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    dot={false}
                    name="SMA 50"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Equity Curve Chart */}
        <section className="chart-section">
          <div className="chart-card">
            <h3>📈 Portfolio Equity Curve</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={chart_data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'} />
                  <XAxis 
                    dataKey="date" 
                    stroke={theme === 'dark' ? '#6b7280' : '#94a3b8'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#64748b', fontSize: 11 }}
                    tickFormatter={(value) => value.slice(5)}
                  />
                  <YAxis 
                    stroke={theme === 'dark' ? '#6b7280' : '#94a3b8'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#64748b', fontSize: 11 }}
                    tickFormatter={(value) => `₹${(value/100000).toFixed(1)}L`}
                    domain={['dataMin - 50000', 'dataMax + 50000']}
                  />
                  <Tooltip content={<EquityTooltip />} />
                  <Legend />
                  <ReferenceLine y={summary.initial_capital} stroke="#6b7280" strokeDasharray="5 5" label={{ value: 'Initial', fill: theme === 'dark' ? '#9ca3af' : '#64748b', fontSize: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="equity"
                    stroke="#10b981"
                    fill="url(#equityGradient)"
                    strokeWidth={2}
                    name="Portfolio Value"
                  />
                  <Line
                    type="stepAfter"
                    dataKey="cash"
                    stroke="#8b5cf6"
                    strokeWidth={1.5}
                    dot={false}
                    name="Cash"
                  />
                  <Area
                    type="monotone"
                    dataKey="holdings"
                    stroke="#3b82f6"
                    fill="rgba(59, 130, 246, 0.1)"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    name="Holdings"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Trade History */}
        <section className="trades-section">
          <div className="trades-card">
            <h3>Trade History</h3>
            <div className="trades-list">
              {trades.map((trade, index) => (
                <TradeCard key={index} trade={trade} index={index} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>BackTest Pro • Built with React & Python</p>
      </footer>
    </div>
  );
}

function MetricCard({ icon, label, value, subtext, color }) {
  return (
    <div className={`metric-card metric-${color}`}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <span className="metric-label">{label}</span>
        <span className="metric-value">{value}</span>
        {subtext && <span className="metric-subtext">{subtext}</span>}
      </div>
    </div>
  );
}

function MetricRow({ label, value, positive, neutral }) {
  return (
    <div className="metric-row">
      <span className="metric-row-label">{label}</span>
      <span className={`metric-row-value ${neutral ? '' : positive ? 'positive' : 'negative'}`}>
        {value}
      </span>
    </div>
  );
}

function TradeCard({ trade, index }) {
  const isBuy = trade.type === 'BUY';
  
  return (
    <div className={`trade-card ${isBuy ? 'buy' : 'sell'}`}>
      <div className="trade-header">
        <div className="trade-type">
          {isBuy ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
          <span>{trade.type}</span>
        </div>
        <div className="trade-date">
          <Calendar size={14} />
          {trade.date}
        </div>
      </div>
      
      <div className="trade-body">
        <div className="trade-info">
          <div className="trade-stat">
            <span className="label">Price</span>
            <span className="value">₹{trade.price.toLocaleString()}</span>
          </div>
          <div className="trade-stat">
            <span className="label">Quantity</span>
            <span className="value">{trade.qty.toLocaleString()}</span>
          </div>
          <div className="trade-stat">
            <span className="label">Value</span>
            <span className="value">₹{trade.trade_value.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="trade-charges">
          <h4>Charges Breakdown</h4>
          <div className="charges-grid">
            <span>Brokerage: ₹{trade.charges.brokerage}</span>
            <span>STT: ₹{trade.charges.stt}</span>
            <span>Exchange: ₹{trade.charges.exchange_fee}</span>
            <span>GST: ₹{trade.charges.gst}</span>
            <span>Stamp: ₹{trade.charges.stamp_duty}</span>
            <span className="total">Total: ₹{trade.charges.total}</span>
          </div>
        </div>

        {!isBuy && trade.pnl !== null && (
          <div className="trade-pnl">
            <div className="pnl-info">
              <Clock size={14} />
              <span>{trade.holding_days} days held</span>
            </div>
            <div className={`pnl-value ${trade.pnl >= 0 ? 'profit' : 'loss'}`}>
              {trade.pnl >= 0 ? '+' : ''}₹{trade.pnl.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null;
  
  return (
    <div className="custom-tooltip">
      <p className="tooltip-date">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} style={{ color: entry.color }}>
          {entry.name}: ₹{entry.value?.toFixed(2)}
        </p>
      ))}
    </div>
  );
}

function EquityTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  
  const equity = payload.find(p => p.dataKey === 'equity')?.value || 0;
  const cash = payload.find(p => p.dataKey === 'cash')?.value || 0;
  const holdings = payload.find(p => p.dataKey === 'holdings')?.value || 0;
  
  return (
    <div className="custom-tooltip">
      <p className="tooltip-date">{label}</p>
      <p style={{ color: '#10b981', fontWeight: 600 }}>
        Portfolio: ₹{equity.toLocaleString()}
      </p>
      <p style={{ color: '#8b5cf6' }}>
        Cash: ₹{cash.toLocaleString()}
      </p>
      <p style={{ color: '#3b82f6' }}>
        Holdings: ₹{holdings.toLocaleString()}
      </p>
    </div>
  );
}

export default App;
