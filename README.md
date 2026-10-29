# Buy More - New Average Price Calculator (₹ INR) · Task 02 / 05

Scalezix Ventures LLP · Full Stack Developer Intern Assessment (an assessment label, not an official product).

Shows how a **hypothetical** additional purchase would change your average buying price and total investment.
It is analytical and neutral: it never recommends buying or selling. Frontend only (no backend, database or API).

Built with React 18, TypeScript, Vite, custom CSS, Vitest + React Testing Library, ESLint.

## Run locally
```bash
npm install
npm run dev       # http://localhost:5173
npm test          # Vitest + React Testing Library
npm run lint      # ESLint
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build locally
```
Needs Node.js 18 or newer.

## Formulas
```
Purchase total          = quantity × price
Current total coins     = sum of quantities
Current total investment= sum of purchase totals
Current average         = current investment ÷ current coins

Additional investment   = additional quantity × hypothetical price
Projected coins         = current coins + additional quantity
Projected investment    = current investment + additional investment
Projected average       = projected investment ÷ projected coins

Change in coins / investment / average = projected − current
```
Full precision is kept internally; numbers are rounded only when displayed.

## Project structure
- `src/calc.ts` – pure logic: validation, comparison maths, ₹ formatting (no React)
- `src/rows.ts` – small helpers for the list of existing purchases
- `src/App.tsx` – state, buttons and page layout
- `src/components/PurchaseRow.tsx` – one existing purchase
- `src/components/HypotheticalForm.tsx` – the hypothetical quantity and price
- `src/components/ComparisonResults.tsx` – Before vs. After results
- `src/styles.css` – design system (CSS variables)
- `src/calc.test.ts`, `src/App.test.tsx` – tests

## Upload to a NEW GitHub repository
1. On github.com click **New repository**, name it `buy-more-average-price-calculator`, leave it empty (no README), click **Create**.
2. In a terminal inside this project folder:
```bash
git init
git add .
git commit -m "Task 2: Buy More - New Average Price Calculator"
git branch -M main
git remote add origin https://github.com/<your-username>/buy-more-average-price-calculator.git
git push -u origin main
```

## Deploy on Netlify
1. Log in to netlify.com → **Add new site** → **Import an existing project** → **GitHub**.
2. Pick the `buy-more-average-price-calculator` repository.
3. Settings are read from `netlify.toml` (build command `npm run build`, publish directory `dist`). Click **Deploy**.
4. Netlify gives you a `*.netlify.app` link. Every `git push` redeploys automatically.

(Alternative: run `npm run build`, then drag the `dist` folder onto Netlify's **Deploy manually** page.)
