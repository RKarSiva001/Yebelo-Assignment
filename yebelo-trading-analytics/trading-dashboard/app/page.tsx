'use client';

/**
 * Main Trading Dashboard Page
 * Displays real-time price and RSI charts for pump.fun tokens
 */

import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine 
} from 'recharts';

// TypeScript interfaces
interface RsiData {
  token_address: string;
  rsi_value: number;
  current_price: number;
  timestamp: string;
  period: number;
  signal: string;
}

interface ChartDataPoint {
  time: string;
  price: number;
  rsi: number;
}

export default function TradingDashboard() {
  // State management
  const [selectedToken, setSelectedToken] = useState<string>('all');
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [currentData, setCurrentData] = useState<RsiData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available tokens on mount
  useEffect(() => {
    fetchTokens();
  }, []);

  // Connect to SSE stream when token changes
  useEffect(() => {
    connectToStream();

    // Cleanup on unmount or token change
    return () => {
      setIsConnected(false);
    };
  }, [selectedToken]);

  /**
   * Fetch list of available tokens from API
   */
  const fetchTokens = async () => {
    try {
      const response = await fetch('/api/tokens');
      const data = await response.json();
      
      if (data.tokens && data.tokens.length > 0) {
        setAvailableTokens(data.tokens);
        // Automatically select first token
        if (selectedToken === 'all') {
          setSelectedToken(data.tokens[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch tokens:', err);
      setError('Could not load token list');
    }
  };

  /**
   * Connect to Server-Sent Events stream for real-time data
   */
  const connectToStream = () => {
    const eventSource = new EventSource(
      `/api/stream?token=${selectedToken}`
    );

    eventSource.onopen = () => {
      console.log('✅ Connected to stream');
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const rsiData: RsiData = JSON.parse(event.data);
        
        // Update current values
        setCurrentData(rsiData);

        // Add to chart data
        const newDataPoint: ChartDataPoint = {
          time: new Date(rsiData.timestamp).toLocaleTimeString(),
          price: rsiData.current_price,
          rsi: rsiData.rsi_value,
        };

        setChartData((prev) => {
          const updated = [...prev, newDataPoint];
          // Keep only last 50 data points
          return updated.slice(-50);
        });

      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      setIsConnected(false);
      setError('Connection lost. Retrying...');
      eventSource.close();
      
      // Retry connection after 3 seconds
      setTimeout(connectToStream, 3000);
    };

    return () => eventSource.close();
  };

  /**
   * Get signal color based on RSI value
   */
  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'oversold':
        return 'text-green-400';
      case 'overbought':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Pump.fun Trading Analytics
              </h1>
              <p className="text-gray-400 mt-1">Real-time RSI Monitoring Dashboard</p>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
            ⚠️ {error}
          </div>
        )}

        {/* Token Selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Token
          </label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="w-full md:w-96 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableTokens.map((token) => (
              <option key={token} value={token}>
                {token.substring(0, 8)}...{token.substring(token.length - 6)}
              </option>
            ))}
          </select>
        </div>

        {/* Current Values Card */}
        {currentData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Current Price */}
            <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700/50 rounded-lg p-6">
              <div className="text-sm text-gray-400 mb-1">Current Price</div>
              <div className="text-3xl font-bold text-blue-300">
                {currentData.current_price.toFixed(8)} SOL
              </div>
            </div>

            {/* Current RSI */}
            <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-700/50 rounded-lg p-6">
              <div className="text-sm text-gray-400 mb-1">RSI ({currentData.period} Period)</div>
              <div className="text-3xl font-bold text-purple-300">
                {currentData.rsi_value.toFixed(2)}
              </div>
            </div>

            {/* Signal */}
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-700/40 border border-gray-600/50 rounded-lg p-6">
              <div className="text-sm text-gray-400 mb-1">Signal</div>
              <div className={`text-3xl font-bold uppercase ${getSignalColor(currentData.signal)}`}>
                {currentData.signal}
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 gap-8">
          {/* Price Chart */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-200">Price Chart (SOL)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af' }}
                  tickFormatter={(value) => value.toFixed(8)}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '0.5rem'
                  }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  name="Price (SOL)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* RSI Chart */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-200">RSI Indicator</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af' }}
                />
                <YAxis 
                  domain={[0, 100]}
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '0.5rem'
                  }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Legend />
                {/* Overbought line (70) */}
                <ReferenceLine 
                  y={70} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3"
                  label={{ value: 'Overbought (70)', fill: '#ef4444', position: 'right' }}
                />
                {/* Oversold line (30) */}
                <ReferenceLine 
                  y={30} 
                  stroke="#10b981" 
                  strokeDasharray="3 3"
                  label={{ value: 'Oversold (30)', fill: '#10b981', position: 'right' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="rsi" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={false}
                  name="RSI Value"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">📊 About RSI</h3>
          <p className="text-sm text-gray-400">
            The Relative Strength Index (RSI) is a momentum indicator that measures the magnitude of recent price changes.
            Values above 70 indicate overbought conditions (potential sell signal), while values below 30 indicate oversold conditions (potential buy signal).
          </p>
        </div>
      </main>
    </div>
  );
}