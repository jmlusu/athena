# Athena — AI Studio Prototype Run & Build Guide

> **Prototype Version**: v2.4.0  
> **Repository Baseline**: Google AI Studio Reference Implementation  

---

## 1. Local Prototype Execution

To run the reference AI Studio prototype locally for inspection and visual QA:

### Prerequisites
- Node.js 22+
- npm

### Installation
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
The application will launch on `http://0.0.0.0:3000` with Express backend endpoints and Vite middleware serving the React 19 SPA.

### Build Verification
```bash
npm run build
```
Runs `vite build` to compile the client-side SPA into `dist/` and bundles `server.ts` into `dist/server.cjs`.

### Linting & Type Checking
```bash
npm run lint
```
Runs `tsc --noEmit` to verify 100% strict TypeScript compliance.
