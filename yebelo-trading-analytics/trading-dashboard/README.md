# Trading Dashboard

Real-time cryptocurrency trading analytics dashboard for pump.fun tokens.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## 📋 Prerequisites

- Node.js 18+
- Redpanda running (Phase 1)
- Rust backend running (Phase 3)

## 🛠️ Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Recharts
- KafkaJS

## 📊 Features

- Real-time price charts
- RSI indicator with reference lines
- Token selector
- Live connection status
- Server-Sent Events streaming

## 🐛 Troubleshooting

### Dashboard shows "Disconnected"

- Verify Redpanda is running: `docker ps | grep redpanda`
- Check Rust backend is running
- Verify rsi-data topic has messages

### Charts not updating

- Check browser console for errors (F12)
- Verify SSE connection in Network tab
- Restart Rust backend
