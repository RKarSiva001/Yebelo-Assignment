# Step-by-Step Execution Guide

Complete walkthrough to build and run the YEBELO Trading Analytics system from scratch.

## ⏱️ Time Estimates

- **Phase 1**: 10 minutes
- **Phase 2**: 5 minutes
- **Phase 3**: 15 minutes (includes first build)
- **Phase 4**: 10 minutes
- **Total**: ~40 minutes (excluding downloads)

---

## 🎯 Pre-Execution Checklist

Before starting, ensure you have:

```bash
# Check Docker
docker --version
# Expected: Docker version 20.x or higher

# Check Python
python3 --version
# Expected: Python 3.8 or higher

# Check Rust
rustc --version
# Expected: rustc 1.70 or higher

# Check Node.js
node --version
# Expected: v18.x or higher

# Check npm
npm --version
# Expected: 9.x or higher
```

**If any are missing**, install them first:

- Docker: https://docker.com/get-started
- Python: https://python.org
- Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- Node.js: https://nodejs.org

---

## 📦 PHASE 1: Infrastructure Setup (10 minutes)

### Step 1.1: Create Project Structure

```bash
# Create main directory
mkdir yebelo-trading-analytics
cd yebelo-trading-analytics

# Create subdirectories
mkdir data-ingestion rsi-calculator trading-dashboard docs
```

### Step 1.2: Create docker-compose.yml

Copy the `docker-compose.yml` content I provided earlier into:

```bash
nano docker-compose.yml
# Or use your preferred editor
```

### Step 1.3: Start Redpanda Services

```bash
# Start services in detached mode
docker-compose up -d

# Expected output:
# Creating network "yebelo-trading-analytics_trading-network"
# Creating volume "yebelo-trading-analytics_redpanda-data"
# Creating redpanda-broker ... done
# Creating redpanda-console ... done
```

### Step 1.4: Verify Services

```bash
# Check containers are running
docker ps

# You should see:
# CONTAINER ID   IMAGE                                    STATUS
# xxxxxxxxx      redpandadata/redpanda:v23.3.5           Up
# xxxxxxxxx      redpandadata/console:v2.4.3             Up

# Wait for health check (30 seconds)
sleep 30

# Check Redpanda health
docker exec -it redpanda-broker rpk cluster health

# Expected: Healthy: true
```

### Step 1.5: Access Redpanda Console

```bash
# Open in browser
open http://localhost:8080
# Or manually navigate to http://localhost:8080

# You should see the Redpanda Console UI
```

### Step 1.6: Create Topics

```bash
# Create trade-data topic
docker exec -it redpanda-broker rpk topic create trade-data --partitions 1 --replicas 1

# Expected: TOPIC       STATUS
#          trade-data  OK

# Create rsi-data topic
docker exec -it redpanda-broker rpk topic create rsi-data --partitions 1 --replicas 1

# Expected: TOPIC      STATUS
#          rsi-data   OK

# Verify topics were created
docker exec -it redpanda-broker rpk topic list

# Expected:
# NAME         PARTITIONS  REPLICAS
# rsi-data     1           1
# trade-data   1           1
```

### Step 1.7: Verify in Console UI

1. Go to http://localhost:8080
2. Click "Topics" in left sidebar
3. You should see `trade-data` and `rsi-data`

**✅ Phase 1 Complete!**

---

## 📊 PHASE 2: Data Ingestion (5 minutes)

### Step 2.1: Create Python Script Directory

```bash
cd data-ingestion
```

### Step 2.2: Create requirements.txt

```bash
cat > requirements.txt << EOF
kafka-python==2.0.2
EOF
```

### Step 2.3: Create data_ingestion.py

Copy the Python script I provided into:

```bash
nano data_ingestion.py
# Paste the entire Python code
```

### Step 2.4: Copy trades_data.csv

```bash
# If you have the CSV from the GitHub repo:
cp ../trades_data.csv .

# Or download it:
# wget <github-raw-url>/trades_data.csv
```

### Step 2.5: Install Python Dependencies

```bash
# Option A: Using venv (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Option B: Global install
pip3 install -r requirements.txt
```

### Step 2.6: Run the Ingestion Script

```bash
python3 data_ingestion.py

# Expected output:
# ============================================================
# 🚀 Pump.fun Trading Data Ingestion Script
# ============================================================
# ✅ Successfully connected to Redpanda at localhost:19092
#
# 📊 Starting data ingestion from trades_data.csv
# 📤 Publishing to topic: trade-data
#
# ✓ Sent 50 messages... (Latest: 8cF2mW7J... Price: 0.00045678 SOL)
# ✓ Sent 100 messages... (Latest: 9aH3nX8K... Price: 0.00056789 SOL)
# ...
#
# ============================================================
# 📈 Ingestion Complete!
# ✅ Successfully published: 500 messages
# ❌ Errors: 0 messages
# ============================================================
```

### Step 2.7: Verify Data in Redpanda

```bash
# View first 5 messages
docker exec -it redpanda-broker rpk topic consume trade-data --num 5 --format json

# Check topic statistics
docker exec -it redpanda-broker rpk topic describe trade-data

# Expected: Should show ~500 messages
```

### Step 2.8: Verify in Console UI

1. Go to http://localhost:8080/topics/trade-data
2. Click "Messages" tab
3. You should see JSON messages with trading data

**✅ Phase 2 Complete!**

---

## 🦀 PHASE 3: Rust Backend (15 minutes)

### Step 3.1: Create Rust Project

```bash
cd ../rsi-calculator
```

### Step 3.2: Create Cargo.toml

```bash
cat > Cargo.toml << EOF
[package]
name = "rsi-calculator"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1.35", features = ["full"] }
rdkafka = { version = "0.36", features = ["cmake-build", "tokio"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
log = "0.4"
env_logger = "0.11"
anyhow = "1.0"
chrono = { version = "0.4", features = ["serde"] }
EOF
```

### Step 3.3: Create src Directory

```bash
mkdir -p src
```

### Step 3.4: Create main.rs

Copy the Rust code I provided into:

```bash
nano src/main.rs
# Paste the entire Rust code
```

### Step 3.5: Install System Dependencies (if needed)

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y librdkafka-dev cmake pkg-config libssl-dev

# macOS
brew install librdkafka cmake

# Windows (MSYS2)
pacman -S mingw-w64-x86_64-librdkafka mingw-w64-x86_64-cmake
```

### Step 3.6: Build the Project

```bash
# First build will take 5-10 minutes
cargo build --release

# Expected: Many "Compiling..." messages
# Final: Finished release [optimized] target(s) in 8m 32s
```

### Step 3.7: Run the RSI Calculator

```bash
# Open a new terminal (keep this running)
cd yebelo-trading-analytics/rsi-calculator
RUST_LOG=info cargo run --release

# Expected output:
# 🚀 Starting RSI Calculator Service
# ✅ Connected to Redpanda at localhost:19092
# 📊 Calculating 14-period RSI for incoming trades
# 🔄 Listening for messages on 'trade-data' topic...
#
# 📈 Token: 8cF2mW7J... | Price: 0.00045678 SOL | RSI: 45.23 | Signal: neutral
# 📈 Token: 9aH3nX8K... | Price: 0.00056789 SOL | RSI: 72.15 | Signal: overbought
# 📊 Stats: Processed 100 trades | Published 85 RSI values
```

### Step 3.8: Verify RSI Data

In a separate terminal:

```bash
# View RSI messages
docker exec -it redpanda-broker rpk topic consume rsi-data --num 5 --format json

# Expected: JSON objects with rsi_value, current_price, signal, etc.
```

### Step 3.9: Verify in Console UI

1. Go to http://localhost:8080/topics/rsi-data
2. Click "Messages" tab
3. You should see RSI calculation results

**✅ Phase 3 Complete!** (Keep Rust service running)

---

## 🌐 PHASE 4: NextJS Frontend (10 minutes)

### Step 4.1: Initialize NextJS Project

```bash
cd ../trading-dashboard

# Create package.json
cat > package.json << 'EOF'
{
  "name": "trading-dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "14.1.0",
    "recharts": "^2.10.3",
    "kafkajs": "^2.2.4"
  },
  "devDependencies": {
    "@types/node": "^20.11.5",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "typescript": "^5.3.3",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1"
  }
}
EOF
```

### Step 4.2: Install Dependencies

```bash
npm install

# This will take 2-3 minutes
# Expected: added 300+ packages
```

### Step 4.3: Create Configuration Files

```bash
# next.config.js
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
      };
    }
    return config;
  },
}
module.exports = nextConfig
EOF

# tsconfig.json
# Copy the tsconfig content I provided

# tailwind.config.js
# Copy the tailwind config I provided

# postcss.config.js
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
```

### Step 4.4: Create App Directory Structure

```bash
mkdir -p app/api/stream
mkdir -p app/api/tokens
mkdir -p public
```

### Step 4.5: Create Source Files

Copy these files I provided:

1. `app/layout.tsx`
2. `app/page.tsx`
3. `app/globals.css`
4. `app/api/stream/route.ts`
5. `app/api/tokens/route.ts`

### Step 4.6: Run Development Server

```bash
# Open a new terminal
cd yebelo-trading-analytics/trading-dashboard
npm run dev

# Expected output:
#   ▲ Next.js 14.1.0
#   - Local:        http://localhost:3000
#   - Ready in 2.3s
```

### Step 4.7: Access the Dashboard

```bash
# Open in browser
open http://localhost:3000

# You should see:
# - Header with "Pump.fun Trading Analytics"
# - Green "Connected" indicator
# - Token selector dropdown
# - Current price, RSI, and signal cards
# - Price chart with blue line
# - RSI chart with purple line and reference lines at 30/70
```

### Step 4.8: Test Real-time Updates

1. Watch the charts - they should update automatically
2. Select different tokens from dropdown
3. Charts should show data for selected token
4. Current values should update in real-time

### Step 4.9: Verify API Endpoints

```bash
# Test token list API
curl http://localhost:3000/api/tokens

# Expected: JSON with array of token addresses

# Test SSE stream (will keep connection open)
curl http://localhost:3000/api/stream?token=all

# Expected: Streaming data in SSE format
# Press Ctrl+C to stop
```

**✅ Phase 4 Complete!**

---

## 🎥 Recording the Demo Video

### What to Show (1-2 minutes):

1. **Redpanda Console** (20 seconds)

   - Open http://localhost:8080
   - Show both topics (trade-data and rsi-data)
   - Click on rsi-data → Messages tab
   - Show messages flowing

2. **Rust Terminal** (20 seconds)

   - Show the terminal running Rust backend
   - Point out RSI calculations streaming
   - Show different tokens and their RSI values

3. **Frontend Dashboard** (40 seconds)

   - Open http://localhost:3000
   - Show connection indicator (green)
   - Select a token from dropdown
   - Point out current price, RSI, signal
   - Show charts updating in real-time
   - Select different token
   - Show charts change to new token data

4. **Full Pipeline** (20 seconds)
   - Quick view of all components running
   - Demonstrate end-to-end data flow

### Recording Tips:

```bash
# Use screen recording software:
# - macOS: QuickTime Player (Cmd+Shift+5)
# - Windows: Xbox Game Bar (Win+G)
# - Linux: OBS Studio

# Narration script:
"Hi, this is my YEBELO assignment demo.

First, in Redpanda Console, you can see both topics with messages flowing.
The trade-data topic has 500 trades, and rsi-data shows calculated RSI values.

In my terminal, the Rust backend is consuming trades and calculating RSI
for each token. You can see RSI values and signals like 'overbought' and 'oversold'.

On the dashboard, I can select any token and see real-time price and RSI charts.
The charts update automatically as new data arrives. The RSI chart shows
reference lines at 30 and 70 for oversold and overbought levels.

This demonstrates the complete pipeline from CSV to real-time visualization."
```

---

## ✅ Final Verification Checklist

Before submitting, verify:

```bash
# 1. All containers running
docker ps | grep redpanda
# Should show 2 containers

# 2. Topics have data
docker exec -it redpanda-broker rpk topic describe trade-data
docker exec -it redpanda-broker rpk topic describe rsi-data
# Both should show message counts

# 3. Rust service running
ps aux | grep rsi-calculator
# Should show cargo run process

# 4. Frontend accessible
curl -s http://localhost:3000 | grep "Trading Analytics"
# Should return HTML

# 5. API working
curl -s http://localhost:3000/api/tokens | grep "tokens"
# Should return JSON
```

---

## 🚀 Submission Steps

### Step 1: Push to GitHub

```bash
cd yebelo-trading-analytics

# Initialize git
git init

# Add .gitignore
cat > .gitignore << 'EOF'
# [paste .gitignore content from earlier]
EOF

# Add all files
git add .

# Commit
git commit -m "Complete YEBELO trading analytics system

- Phase 1: Docker + Redpanda infrastructure
- Phase 2: Python data ingestion from CSV
- Phase 3: Rust RSI calculator backend
- Phase 4: NextJS real-time dashboard"

# Create GitHub repo and push
# Follow GitHub instructions to add remote and push
```

### Step 2: Upload Demo Video

- Upload to YouTube (unlisted), Google Drive, or Loom
- Ensure link is accessible
- Test the link in incognito mode

### Step 3: Submit

Email your point of contact with:

- Subject: "YEBELO Assignment Submission - [Your Name]"
- GitHub repository link
- Demo video link
- Brief summary of what you completed

---

## 🎉 Congratulations!

You've successfully built a complete real-time trading analytics system!

**What you accomplished:**

- ✅ Set up containerized message streaming infrastructure
- ✅ Ingested 500+ trading records from CSV to Redpanda
- ✅ Implemented RSI calculation algorithm in Rust
- ✅ Built real-time dashboard with live charts
- ✅ Integrated all components into working system

**Skills demonstrated:**

- Docker & containerization
- Message streaming with Redpanda/Kafka
- High-performance backend development with Rust
- Modern frontend with NextJS & TypeScript
- Real-time data visualization
- End-to-end system integration
