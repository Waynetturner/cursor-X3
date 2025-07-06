# X3 Momentum Pro - Development Guide

## Quick Start
1. `npm install` (if first time)
2. `npm run dev` (faster compilation without Turbopack)
3. Open http://localhost:3000

## Alternative Dev Commands
- `npm run dev` - Standard Next.js dev server (recommended)
- `npm run dev:turbo` - With Turbopack (slower initial compilation)
- `npm run dev:fast` - Explicit port 3000 binding

## If localhost doesn't work:
1. Check terminal for actual server address
2. Try http://127.0.0.1:3000
3. Try the network address shown in terminal
4. Kill port conflicts: `lsof -ti:3000 | xargs kill -9`
5. Clear cache: `rm -rf .next`
6. Restart: `npm run dev`

## Common Fixes:
- **Server appears to timeout**: It's actually still compiling! Wait for "✓ Ready" message
- **Cache issues**: `rm -rf .next && npm run dev`
- **Dependencies**: `rm -rf node_modules && npm install`
- **Port conflicts**: Try `npm run dev -- --port 3001`

## Fire Theme Brand Guidelines
- ✅ Light gray page background (#FAFAFA)
- ✅ White hero banner with fire orange wordmark
- ✅ Pure white Material Design cards with gray borders
- ✅ Fire orange accents only (no gradients on content)
- ✅ Proper contrast and accessibility

## Troubleshooting Localhost
The most common issue is browser cache. Try:
1. Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. Incognito/private browsing window
3. Different browser
4. Clear all site data for localhost in DevTools

## Network Addresses
If localhost fails, the terminal shows alternative addresses:
- Network: Usually your local IP (192.168.x.x or 10.x.x.x)
- 127.0.0.1: Direct loopback address
- 0.0.0.0: All interfaces (when using --hostname 0.0.0.0)