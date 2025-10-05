# YEBELO Technology - Real-time Trading Analytics System

A complete real-time cryptocurrency trading analytics system for pump.fun tokens, featuring RSI calculation and live dashboard visualization.

## 🎯 Project Overview

This system processes trading data from pump.fun (Solana-based platform), calculates the Relative Strength Index (RSI) for multiple tokens, and displays results in a real-time dashboard.

### Architecture

```
CSV File (trades_data.csv)
    ↓
Python Ingestion Script
    ↓
Redpanda (trade-data topic)
    ↓
Rust Backend (RSI Calculator)
    ↓
Redpanda (rsi-data topic)
    ↓
NextJS Dashboard (Live Charts)
```

## 🛠️ Technologies Used

- **Docker & Docker Compose**: Container orchestration
- **Redpanda**: Kafka-compatible streaming platform
- **Python**: Data ingestion from CSV
- **Rust**: High-performance RSI calculations
- **NextJS + TypeScript**: React-based frontend
- **Recharts**: Data visualization library
- **TailwindCSS**: Styling framework

## 📁 Project Structure

```
yebelo-trading-analytics/
├── docker-compose.yml              # Redpanda infrastructure
├── trades_data.csv                 # Trading data (provided)
│
├── data-ingestion/
│   ├── data_ingestion.py          # CSV to Redpanda script
│   └── requirements.txt           # Python dependencies
│
├── rsi-calculator/                # Rust backend
│   ├── Cargo.toml                 # Rust dependencies
│   └── src/
│       └── main.rs                # RSI calculation logic
│
└── trading-dashboard/             # NextJS frontend
    ├── package.json               # Node dependencies
    ├── next.config.js             # NextJS config
    ├── tailwind.config.js         # Tailwind config
    └── app/
        ├── page.tsx               # Main dashboard
        ├── layout.tsx             # Root layout
        ├── globals.css            # Global styles
        └── api/
            ├── stream/route.ts    # SSE streaming endpoint
            └── tokens/route.ts    # Token list endpoint
```

## 🚀 Quick Start Guide

### Prerequisites

Install the following on your system:

- Docker Desktop (https://docker.com)
- Python 3.8+ (https://python.org)
- Rust (https://rustup.rs)
- Node.js 18+ (https://nodejs.org)

### Step 1: Infrastructure Setup (5 minutes)

```bash
# Clone repository
git clone <your-repo-url>
cd yebelo-trading-analytics

# Start Redpanda
docker-compose up -d

# Verify services
docker ps

# Create topics
docker exec -it redpanda-broker rpk topic create trade-data --partitions 1
docker exec -it redpanda-broker rpk topic create rsi-data --partitions 1

# Access Redpanda Console
open http://localhost:8080
```

### Step 2: Data Ingestion (2 minutes)

```bash
cd data-ingestion

# Install dependencies
pip install -r requirements.txt

# Run ingestion script
python data_ingestion.py

# You should see messages being published
```

### Step 3: Rust Backend (10 minutes)

```bash
cd ../rsi-calculator

# Build project (first time takes ~10 min)
cargo build --release

# Run RSI calculator
RUST_LOG=info cargo run --release

# You should see RSI calculations streaming
```

### Step 4: Frontend Dashboard (5 minutes)

```bash
cd ../trading-dashboard

# Install dependencies
npm install

# Start development server
npm run dev

# Access dashboard
open http://localhost:3000
```

## 📊 What Each Component Does

### Phase 1: Redpanda Infrastructure

- **Purpose**: Message broker for real-time data streaming
- **Topics**:
  - `trade-data`: Stores incoming trades
  - `rsi-data`: Stores calculated RSI values
- **Console**: Web UI at http://localhost:8080

### Phase 2: Data Ingestion

- **Language**: Python
- **Input**: `trades_data.csv` (~500 trades)
- **Output**: JSON messages to `trade-data` topic
- **Features**:
  - Validates and cleans CSV data
  - Uses token_address as partition key
  - Simulates real-time with 100ms delays

### Phase 3: RSI Calculator

- **Language**: Rust
- **Input**: Trades from `trade-data` topic
- **Output**: RSI values to `rsi-data` topic
- **Algorithm**:
  - Maintains price history per token
  - Calculates 14-period RSI
  - Classifies as oversold (<30), neutral, or overbought (>70)

### Phase 4: Dashboard

- **Framework**: NextJS 14 with TypeScript
- **Features**:
  - Token selector dropdown
  - Real-time price chart
  - Real-time RSI chart with reference lines
  - Live connection status
  - Server-Sent Events (SSE) for streaming

## 🔍 Monitoring & Debugging

### Check Redpanda Health

```bash
docker exec -it redpanda-broker rpk cluster health
```

### View Messages in Topics

```bash
# View trade data
docker exec -it redpanda-broker rpk topic consume trade-data --format json --num 5

# View RSI data
docker exec -it redpanda-broker rpk topic consume rsi-data --format json --num 5
```

### Check Topic Statistics

```bash
docker exec -it redpanda-broker rpk topic describe trade-data
docker exec -it redpanda-broker rpk topic describe rsi-data
```

### View Logs

```bash
# Redpanda logs
docker logs redpanda-broker

# Console logs
docker logs redpanda-console
```

## 📈 Understanding RSI

**Relative Strength Index (RSI)** is a momentum indicator:

- **Formula**: RSI = 100 - (100 / (1 + RS))
  - RS = Average Gain / Average Loss over 14 periods
- **Interpretation**:

  - RSI < 30: **Oversold** (potential buy signal)
  - RSI 30-70: **Neutral** (normal trading range)
  - RSI > 70: **Overbought** (potential sell signal)

- **Use Case**: Traders use RSI to identify:
  - Trend reversals
  - Entry/exit points
  - Divergences from price action

## 🐛 Common Issues & Solutions

### Issue: Docker containers won't start

```bash
# Solution: Remove all containers and volumes
docker-compose down -v
docker-compose up -d
```

### Issue: Python can't connect to Redpanda

```bash
# Solution: Check port accessibility
telnet localhost 19092
# If fails, check docker-compose.yml port mappings
```

### Issue: Rust build fails with librdkafka error

```bash
# Ubuntu/Debian
sudo apt-get install librdkafka-dev

# macOS
brew install librdkafka
```

### Issue: NextJS can't fetch tokens

```bash
# Solution: Ensure trade-data has messages
docker exec -it redpanda-broker rpk topic consume trade-data --num 1
```

### Issue: Dashboard shows "Disconnected"

```bash
# Check if Rust backend is running and publishing
docker exec -it redpanda-broker rpk topic consume rsi-data --num 1
```

## 🔧 Configuration

### Redpanda Ports

- `9092`: Internal Kafka API
- `19092`: External Kafka API (use this from host)
- `8080`: Redpanda Console UI
- `8081`: Schema Registry
- `9644`: Admin API

### Adjust RSI Period

Edit `rsi-calculator/src/main.rs`:

```rust
let rsi_period = 14; // Change to desired period
```

### Change Data Ingestion Speed

Edit `data-ingestion/data_ingestion.py`:

```python
time.sleep(0.1)  # Change delay (seconds)
# Or set simulate_realtime=False for instant ingestion
```

### Modify Chart Data Window

Edit `trading-dashboard/app/page.tsx`:

```typescript
return updated.slice(-50); // Keep last 50 points
```

## 📝 AI Tools Used

This project leveraged AI assistance for:

- Understanding Redpanda/Kafka concepts
- Generating Docker Compose configuration
- Implementing RSI calculation algorithm in Rust
- Creating NextJS API routes for SSE streaming
- Debugging connection issues
- Optimizing chart performance

## 🎓 Learning Resources

- **Redpanda Docs**: https://docs.redpanda.com
- **Rust Book**: https://doc.rust-lang.org/book/
- **NextJS Docs**: https://nextjs.org/docs
- **RSI Explained**: https://www.investopedia.com/terms/r/rsi.asp
- **Server-Sent Events**: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events

## 📧 Support

For assignment questions or issues:

- Check Redpanda Console for data flow
- Review component logs for errors
- Verify all services are running
- Consult phase-specific README files

## 📜 License

This project is created for YEBELO Technology Pvt Ltd assignment purposes.

## 🙏 Acknowledgments

- YEBELO Technology for the assignment
- Redpanda team for excellent documentation
- Rust and NextJS communities
- AI tools (ChatGPT, Claude) for development assistance
