#!/bin/bash

# Create main directory
mkdir -p yebelo-trading-analytics
cd yebelo-trading-analytics

# Root files
touch README.md TROUBLESHOOTING.md docker-compose.yml .gitignore

# Data ingestion
mkdir -p data-ingestion
touch data-ingestion/data_ingestion.py
touch data-ingestion/requirements.txt
touch data-ingestion/README.md

# Rust calculator
mkdir -p rsi-calculator/src
touch rsi-calculator/Cargo.toml
touch rsi-calculator/src/main.rs
touch rsi-calculator/README.md

# NextJS dashboard
mkdir -p trading-dashboard/app/api/stream
mkdir -p trading-dashboard/app/api/tokens
mkdir -p trading-dashboard/public
touch trading-dashboard/package.json
touch trading-dashboard/next.config.js
touch trading-dashboard/tsconfig.json
touch trading-dashboard/tailwind.config.js
touch trading-dashboard/postcss.config.js
touch trading-dashboard/README.md
touch trading-dashboard/app/layout.tsx
touch trading-dashboard/app/page.tsx
touch trading-dashboard/app/globals.css
touch trading-dashboard/app/api/stream/route.ts
touch trading-dashboard/app/api/tokens/route.ts

# Documentation
mkdir -p docs
touch docs/Phase1-Instructions.md
touch docs/Phase2-Instructions.md
touch docs/Phase3-Instructions.md
touch docs/Phase4-Instructions.md

echo "✅ Folder structure created successfully!"
tree .