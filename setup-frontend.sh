#!/bin/bash

# Setup script for trading-dashboard frontend
# This creates all necessary files and directory structure

set -e  # Exit on any error

echo "=========================================="
echo "🚀 Trading Dashboard Setup Script"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "../docker-compose.yml" ]; then
    echo "⚠️  Warning: This script should be run from the trading-dashboard directory"
    echo "Current directory: $(pwd)"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p app/api/stream
mkdir -p app/api/tokens
mkdir -p public

echo "✅ Directories created"
echo ""

# Create postcss.config.js
echo "📝 Creating postcss.config.js..."
cat > postcss.config.js << 'EOF'
/**
 * PostCSS Configuration
 * Handles CSS processing for Tailwind CSS and autoprefixing
 */

module.exports = {
  plugins: {
    // Tailwind CSS plugin - processes Tailwind directives
    tailwindcss: {},
    
    // Autoprefixer - adds vendor prefixes for browser compatibility
    autoprefixer: {},
  },
}
EOF

echo "✅ postcss.config.js created"
echo ""

# Create tailwind.config.js
echo "📝 Creating tailwind.config.js..."
cat > tailwind.config.js << 'EOF'
/**
 * Tailwind CSS Configuration
 * Customizes the default Tailwind theme for the trading dashboard
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Specify which files to scan for Tailwind classes
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  
  theme: {
    extend: {
      // Custom color palette
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          500: '#3b82f6',
          600: '#2563eb',
        },
        secondary: {
          DEFAULT: '#8b5cf6',
          500: '#8b5cf6',
        },
        success: {
          DEFAULT: '#10b981',
          500: '#10b981',
        },
        warning: {
          DEFAULT: '#f59e0b',
        },
        danger: {
          DEFAULT: '#ef4444',
        },
      },
      
      // Custom animations
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  
  // Enable dark mode with class strategy
  darkMode: 'class',
  
  // Plugins
  plugins: [],
}
EOF

echo "✅ tailwind.config.js created"
echo ""

# Create app/globals.css
echo "📝 Creating app/globals.css..."
cat > app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Root CSS Variables */
:root {
  --background: #0a0a0a;
  --foreground: #ededed;
  --card-background: rgba(31, 41, 55, 0.5);
  --border-color: #374151;
  --accent-blue: #3b82f6;
  --accent-purple: #8b5cf6;
  --accent-green: #10b981;
  --accent-red: #ef4444;
  --text-muted: #9ca3af;
}

/* Global Styles */
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: inherit;
  text-decoration: none;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--background);
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #4b5563;
}

/* Chart Container Styling */
.recharts-wrapper {
  font-family: inherit;
}

.recharts-cartesian-grid-horizontal line,
.recharts-cartesian-grid-vertical line {
  stroke: var(--border-color);
  stroke-opacity: 0.5;
}

/* Selection Color */
::selection {
  background: var(--accent-blue);
  color: white;
}
EOF

echo "✅ app/globals.css created"
echo ""

# Create README.md with basic content
echo "📝 Creating README.md..."
cat > README.md << 'EOF'
# Trading Dashboard - Phase 4

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

## 🔧 Configuration

Edit `app/page.tsx` to customize:
- Chart data retention
- RSI thresholds
- Update intervals

## 🐛 Troubleshooting

### Dashboard shows "Disconnected"
- Verify Redpanda is running: `docker ps | grep redpanda`
- Check Rust backend is running
- Verify rsi-data topic has messages

### Charts not updating
- Check browser console for errors (F12)
- Verify SSE connection in Network tab
- Restart Rust backend

## 📚 Documentation

For full documentation, see the complete README in the artifacts.

---

Built for YEBELO Technology Assignment
EOF

echo "✅ README.md created"
echo ""

# Install dependencies if package.json exists
if [ -f "package.json" ]; then
    echo "📦 Installing npm dependencies..."
    echo "   This may take 2-3 minutes..."
    echo ""
    
    npm install
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Dependencies installed successfully"
        echo "✅ package-lock.json generated automatically"
    else
        echo ""
        echo "⚠️  npm install failed. Please run manually:"
        echo "   npm install"
    fi
else
    echo "⚠️  package.json not found. Please create it first."
    echo "   Copy the package.json content from the artifacts."
fi

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "📁 Files created:"
echo "   ✓ postcss.config.js"
echo "   ✓ tailwind.config.js"
echo "   ✓ app/globals.css"
echo "   ✓ README.md"
echo "   ✓ Directory structure"
if [ -f "package-lock.json" ]; then
    echo "   ✓ package-lock.json (auto-generated)"
fi
echo ""
echo "📝 Still needed:"
echo "   • package.json (copy from artifacts)"
echo "   • next.config.js (copy from artifacts)"
echo "   • tsconfig.json (copy from artifacts)"
echo "   • app/layout.tsx (copy from artifacts)"
echo "   • app/page.tsx (copy from artifacts)"
echo "   • app/api/stream/route.ts (copy from artifacts)"
echo "   • app/api/tokens/route.ts (copy from artifacts)"
echo ""
echo "🚀 Next steps:"
echo "   1. Copy remaining files from artifacts"
echo "   2. Run: npm run dev"
echo "   3. Open: http://localhost:3000"
echo ""
echo "Good luck! 🎉"