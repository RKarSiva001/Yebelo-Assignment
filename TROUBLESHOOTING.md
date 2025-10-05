# Troubleshooting Guide

This guide covers common issues and their solutions for the YEBELO Trading Analytics system.

## 🔴 Phase 1: Infrastructure Issues

### Problem: Docker containers fail to start

**Symptoms:**

- `docker-compose up -d` shows errors
- Containers exit immediately

**Solutions:**

```bash
# Check Docker is running
docker --version

# Remove existing containers and volumes
docker-compose down -v

# Check for port conflicts
lsof -i :8080
lsof -i :19092

# Kill processes using the ports if needed
kill -9 <PID>

# Start fresh
docker-compose up -d

# View logs
docker-compose logs -f
```

### Problem: Can't access Redpanda Console

**Symptoms:**

- http://localhost:8080 doesn't load
- Connection refused error

**Solutions:**

```bash
# Check if console container is running
docker ps | grep console

# Check console logs
docker logs redpanda-console

# Restart console
docker-compose restart console

# Verify port mapping
docker port redpanda-console
```

### Problem: Topic creation fails

**Symptoms:**

- `rpk topic create` command errors
- "Connection refused" message

**Solutions:**

```bash
# Wait for Redpanda to be healthy
docker exec -it redpanda-broker rpk cluster health

# If not healthy, restart
docker-compose restart redpanda

# Wait 30 seconds, then try again
sleep 30
docker exec -it redpanda-broker rpk topic create trade-data --partitions 1
```

## 🟡 Phase 2: Data Ingestion Issues

### Problem: "Failed to create producer"

**Symptoms:**

- Python script can't connect
- Connection timeout errors

**Solutions:**

```bash
# Verify Redpanda is running
docker ps | grep redpanda

# Test connectivity
telnet localhost 19092

# Check if port is accessible
docker exec -it redpanda-broker rpk cluster info

# If still failing, check firewall settings
```

### Problem: "CSV file not found"

**Symptoms:**

- FileNotFoundError in Python

**Solutions:**

```bash
# Check current directory
pwd

# List files
ls -la

# Ensure trades_data.csv exists
# Copy it to the same directory as data_ingestion.py

# Or specify full path in script
CSV_FILE = '/full/path/to/trades_data.csv'
```

### Problem: Messages not appearing in Redpanda

**Symptoms:**

- Script runs but no messages in Console
- Topic is empty

**Solutions:**

```bash
# Verify topic exists
docker exec -it redpanda-broker rpk topic list

# Check topic has messages
docker exec -it redpanda-broker rpk topic describe trade-data

# Try consuming directly
docker exec -it redpanda-broker rpk topic consume trade-data --num 1

# If empty, check script output for errors
python data_ingestion.py 2>&1 | tee ingestion.log
```

### Problem: Python dependency errors

**Symptoms:**

- ImportError or ModuleNotFoundError

**Solutions:**

```bash
# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Verify installation
pip list | grep kafka
```

## 🟠 Phase 3: Rust Backend Issues

### Problem: Cargo build fails

**Symptoms:**

- Compilation errors
- Missing dependencies

**Solutions:**

```bash
# Update Rust toolchain
rustup update

# Clean build directory
cargo clean

# Rebuild
cargo build --release

# If librdkafka error on Ubuntu/Debian:
sudo apt-get update
sudo apt-get install -y librdkafka-dev cmake

# On macOS:
brew install librdkafka cmake

# On Windows (use MSYS2):
pacman -S mingw-w64-x86_64-librdkafka
```

### Problem: Rust can't connect to Redpanda

**Symptoms:**

- "Failed to create consumer" error
- Connection timeout

**Solutions:**

```bash
# Test Redpanda connection
telnet localhost 19092

# Verify broker address in main.rs
let brokers = "localhost:19092";  # Should match docker-compose port

# Check if trade-data topic exists
docker exec -it redpanda-broker rpk topic list

# Restart Redpanda if needed
docker-compose restart redpanda
```

### Problem: No RSI values being calculated

**Symptoms:**

- "Not enough data" or no output
- RSI values not published

**Solutions:**

```bash
# Need at least 15 price points per token
# Ensure data ingestion ran completely

# Check how many messages in trade-data
docker exec -it redpanda-broker rpk topic describe trade-data

# If < 15 messages per token, run ingestion again
python data_ingestion.py

# Check for parsing errors in Rust logs
RUST_LOG=debug cargo run --release
```

### Problem: Rust binary crashes

**Symptoms:**

- Segmentation fault
- Panic errors

**Solutions:**

```bash
# Run in debug mode to see full error
RUST_LOG=debug cargo run

# Check Redpanda is stable
docker logs redpanda-broker | tail -50

# Rebuild from scratch
cargo clean
cargo build --release

# Verify Cargo.toml dependencies are correct
```

## 🟢 Phase 4: Frontend Issues

### Problem: npm install fails

**Symptoms:**

- Dependency resolution errors
- Permission denied

**Solutions:**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If permission errors, don't use sudo
# Instead, fix npm permissions:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Problem: "Cannot connect to Redpanda" in browser

**Symptoms:**

- Dashboard shows disconnected
- API route errors

**Solutions:**

```bash
# Check if Redpanda is accessible from Node.js
node -e "const net = require('net'); const client = net.connect(19092, 'localhost', () => console.log('Connected')); client.on('error', console.error);"

# Verify rsi-data topic has messages
docker exec -it redpanda-broker rpk topic consume rsi-data --num 1

# Check if Rust backend is running
ps aux | grep rsi-calculator

# Check Next.js API route logs in terminal
```

### Problem: Charts not updating

**Symptoms:**

- Dashboard loads but no data
- Static charts

**Solutions:**

```bash
# Open browser console (F12) and check for errors

# Verify SSE connection in Network tab
# Should see "stream?token=..." with "EventStream" type

# Check if RSI data is flowing
docker exec -it redpanda-broker rpk topic consume rsi-data --format json

# Restart Next.js dev server
# Ctrl+C, then: npm run dev
```

### Problem: TypeScript compilation errors

**Symptoms:**

- Type errors during build
- TSX syntax errors

**Solutions:**

```bash
# Ensure TypeScript is installed
npm install --save-dev typescript @types/react @types/node

# Check tsconfig.json is present and valid

# Clear Next.js cache
rm -rf .next

# Rebuild
npm run dev
```

### Problem: Port 3000 already in use

**Symptoms:**

- "Address already in use" error
- Can't start dev server

**Solutions:**

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev

# Then access at http://localhost:3001
```

## 🔵 General System Issues

### Problem: Everything is slow

**Solutions:**

```bash
# Check Docker resource usage
docker stats

# Increase Docker memory/CPU in Docker Desktop settings
# Recommended: 4GB RAM, 2 CPUs minimum

# Check disk space
df -h

# Clean up Docker
docker system prune -a
```

### Problem: Data flow stops unexpectedly

**Solutions:**

```bash
# Check all services status
docker ps
ps aux | grep data_ingestion
ps aux | grep rsi-calculator
lsof -i :3000

# Restart services one by one
docker-compose restart

# Re-run ingestion
python data_ingestion.py

# Restart Rust backend
cargo run --release

# Restart frontend
npm run dev
```

### Problem: Inconsistent data between components

**Solutions:**

```bash
# Reset everything
docker-compose down -v

# Start fresh
docker-compose up -d

# Wait for health check
docker exec -it redpanda-broker rpk cluster health

# Recreate topics
docker exec -it redpanda-broker rpk topic create trade-data --partitions 1
docker exec -it redpanda-broker rpk topic create rsi-data --partitions 1

# Run full pipeline again
python data_ingestion.py
cargo run --release
npm run dev
```

## 📊 Verification Commands

Use these to verify each component is working:

```bash
# Phase 1: Infrastructure
docker ps                                                    # Should show 2 containers
curl http://localhost:8080                                   # Should return HTML
docker exec -it redpanda-broker rpk cluster health          # Should show "Healthy: true"

# Phase 2: Data Ingestion
docker exec -it redpanda-broker rpk topic describe trade-data  # Should show message count
docker exec -it redpanda-broker rpk topic consume trade-data --num 1  # Should show a message

# Phase 3: Rust Backend
docker exec -it redpanda-broker rpk topic describe rsi-data     # Should show messages
docker exec -it redpanda-broker rpk topic consume rsi-data --num 1  # Should show RSI data

# Phase 4: Frontend
curl http://localhost:3000                                   # Should return HTML
curl http://localhost:3000/api/tokens                        # Should return JSON
```

## 🆘 Still Having Issues?

1. **Check all logs systematically**:

   ```bash
   docker logs redpanda-broker
   docker logs redpanda-console
   # Python script output
   # Rust terminal output
   # Browser console (F12)
   ```

2. **Verify prerequisites**:

   - Docker Desktop is running
   - All ports (8080, 19092, 3000) are free
   - Sufficient system resources (4GB RAM minimum)

3. **Start from scratch**:

   ```bash
   # Complete reset
   docker-compose down -v
   rm -rf node_modules .next
   cargo clean

   # Follow Quick Start Guide again
   ```

4. **Document your issue**:
   - What command caused the error?
   - Full error message
   - Output of verification commands
   - System information (OS, Docker version)

## 📝 Logging Best Practices

Enable detailed logging for debugging:

```bash
# Python
python data_ingestion.py > ingestion.log 2>&1

# Rust
RUST_LOG=debug cargo run --release > rust.log 2>&1

# Docker
docker-compose logs -f > docker.log 2>&1

# Next.js (check terminal output)
```

Remember: Most issues are due to:

1. Services not running
2. Port conflicts
3. Incorrect connection strings
4. Missing dependencies
5. Insufficient data for RSI calculation

Good luck! 🍀
