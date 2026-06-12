# Agrosantos B2B: Serverless Catalog & Automated ETL Pipeline

A high-throughput, zero-dependency static digital storefront powered by a custom-built Python ETL pipeline and autonomous web-crawlers. This project was developed as a real-world commercial solution for Agrosantos to automate inventory processing and eliminate manual data entry.

## 🚀 Live Production Environment
👉 **[View the Deployed Storefront](#)** *(Replace with your GitHub Pages URL)*

---

## 🎯 The Business Architecture & The Problem
The company's legacy process involved manually generating PDFs to share inventory pricing, which suffered from rapid obsolescence and missing product images. Building a traditional full-stack e-commerce (Node.js/SQL) was unviable due to high server maintenance costs and poor mobile network connectivity in rural client areas.

The solution is an **asynchronous static architecture (SSG)**: Python automates the heavy lifting of inventory processing in the background, generating a lightweight JSON "database", which a vanilla JavaScript frontend consumes in milliseconds via Edge CDN.

## ⚙️ The Engineering Stack (Under the Hood)

### 1. Data Cleaning & Extraction (`criarJSON.py`)
- **Pandas ETL:** Ingests raw `.xlsx` inventory spreadsheets, applying robust Regex filtering to purge discontinued items, sanitize floating-point anomalies, and standardize String casings.
- **Data Serialization:** Compiles the sanitized DataFrame into a highly optimized, client-ready `produtos.json` payload.

### 2. Autonomous Visual Crawler (`completarImagens.py`)
- **Automated Media Acquisition:** Integrates `icrawler` (Google/Bing engines) to actively scan the generated JSON against the local file system. 
- **Anti-Ban Mechanics:** Automatically spins up isolated temporary directories (`temp_reparo_{ID}`) and executes rate-limited, targeted web scraping to acquire missing product images based on SKUs, eliminating hours of manual Google image searches.

### 3. High-Performance Client UI (`script.js` & `index.html`)
- **Infinite Scrolling & DOM Optimization:** Implements aggressive batch-rendering (`TAMANHO_LOTE = 50`) and `Lazy Loading`. By fragmenting the DOM injection, the catalog maintains 60fps scrolling even when handling hundreds of high-resolution images.
- **State Hydration:** Captures and stores `window.scrollY` via `localStorage`, ensuring the UI rehydrates seamlessly to the exact scroll position upon cart-navigation.
- **WhatsApp API Gateway:** The cart system programmatically compiles user selections into a structured, read-only sales report and dispatches it directly to the company's WhatsApp endpoint.

### 4. CI/CD Automation (`deploy.sh`)
- A custom Bash script that orchestrates the entire deployment lifecycle: triggering Git pulls, ingesting new spreadsheets, firing the Python ETL engines, cleaning residual caches, and pushing the compiled static bundle to the production server.

---

## 📈 Impact
By treating the frontend simply as a static view layer and shifting all business logic to Python background scripts, the system achieves **zero hosting costs, 100% uptime, and millisecond load times**, proving the value of pragmatic, problem-focused engineering.
