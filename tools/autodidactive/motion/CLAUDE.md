# Claude Instructions for ONI Demo Motion Canvas

## Session Cleanup (IMPORTANT)

**At the end of every session, close all dev servers:**

```bash
# Kill Motion Canvas server (port 9000)
lsof -ti :9000 | xargs kill -9 2>/dev/null

# Kill Remotion server (port 3000) if running
lsof -ti :3000 | xargs kill -9 2>/dev/null
```

## Active Servers

Track which servers are running during the session:
- Port 9000: Motion Canvas (`npm run dev` in oni-demo-motion)
- Port 3000: Remotion (`npm run dev` in oni-demo-video)

## Project Overview

This is a Motion Canvas implementation of the ONI Framework demo video.

**Scenes:**
- `title.tsx` - ONI logo reveal with glow effect
- `layers.tsx` - 14-layer security model cascade
- `coherence.tsx` - Coherence score metric visualization
- `credits.tsx` - Manifesto closing ("Our mind. Our future. Our rules.")

**Start dev server:**
```bash
cd oni-demo-motion && npm run dev
# Opens at http://localhost:9000
```

**Render video:**
```bash
npm run build
```
