@echo off
echo Starting OALASS development environment...
echo.
echo This will start both the Next.js development server and WebSocket server.
echo.
echo Press Ctrl+C to stop both servers.
echo.

REM Start both servers concurrently (Next.js + WebSocket server)
set NEXT_PUBLIC_WS_URL=ws://localhost:3001
npm run dev:full

