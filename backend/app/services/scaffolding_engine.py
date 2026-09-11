import io
import json
import zipfile
from typing import Dict, List, Any


def generate_scaffold_files(project_name: str, tasks: List[Dict[str, Any]]) -> Dict[str, str]:
    """
    Generates a dictionary of all scaffold files mapping relative file path to its full text content.
    Includes FastAPI backend, dynamic mock endpoints based on the roadmap tasks,
    React frontend shell, Docker Compose, and GitHub Actions CI.
    """
    files: Dict[str, str] = {}

    # Collect mock routes from tasks
    mock_routes = []
    for task in tasks:
        spec = task.get("api_route_spec")
        if spec:
            if isinstance(spec, str):
                try:
                    spec = json.loads(spec)
                except Exception:
                    continue
            mock_routes.append({
                "code": task.get("task_code", "API"),
                "path": spec.get("path", "/api/v1/mock"),
                "method": spec.get("method", "GET").upper(),
                "summary": spec.get("summary", task.get("title", "Mock Endpoint")),
                "response": spec.get("response_mock", {"status": "success", "message": "mocked response"})
            })

    # 1. Root README.md
    readme_content = f"""# {project_name}

> Generated automatically by **Daedalus AI** — Autonomous Multi-Agent Orchestration.

## 🚀 Architecture Overview
- **Backend**: FastAPI (Python 3.12)
- **Frontend**: React + Vite + Tailwind CSS
- **Database**: PostgreSQL with `pgvector`
- **Infrastructure**: Docker & Docker Compose
- **CI/CD**: GitHub Actions

## 📦 Quickstart with Docker Compose

```bash
docker compose up --build
```
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs

## 📋 Task Matrix & Initial Routes
"""
    for r in mock_routes:
        readme_content += f"- **[{r['code']}]** `{r['method']} {r['path']}` — {r['summary']}\n"

    files["README.md"] = readme_content

    # 2. Root docker-compose.yml
    docker_compose_content = """version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: app_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: app_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: app_backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:password@postgres:5432/app_db
    depends_on:
      - postgres

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: app_frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  pgdata:
"""
    files["docker-compose.yml"] = docker_compose_content

    # 3. .github/workflows/ci.yml
    ci_content = """name: CI / CD Verification Pipeline

on:
  push:
    branches: [ main, dev, 'task/**' ]
  pull_request:
    branches: [ main ]

jobs:
  test-and-lint:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install Backend Dependencies
        run: |
          cd backend
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest flake8

      - name: Lint Code
        run: |
          cd backend
          flake8 app --count --select=E9,F63,F7,F82 --show-source --statistics

      - name: Run Pytest
        run: |
          cd backend
          pytest tests/

      - name: Notify Daedalus Webhook
        if: always()
        run: |
          echo "CI Pipeline Completed with status: ${{ job.status }}"
"""
    files[".github/workflows/ci.yml"] = ci_content

    # 4. Backend Code
    files["backend/requirements.txt"] = """fastapi>=0.111.0
uvicorn[standard]>=0.30.0
pydantic>=2.7.0
sqlalchemy>=2.0.30
asyncpg>=0.29.0
python-multipart>=0.0.9
httpx>=0.27.0
pytest>=8.0.0
"""

    files["backend/Dockerfile"] = """FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
"""

    files["backend/app/__init__.py"] = ""

    # Synthesize dynamic mock router file
    routes_py = """from fastapi import APIRouter

router = APIRouter()

"""
    for i, r in enumerate(mock_routes):
        fn_name = f"mock_{r['code'].lower().replace('-', '_')}_{i}"
        path = r["path"].replace("/api/v1", "") if r["path"].startswith("/api/v1") else r["path"]
        routes_py += f"""@router.{r['method'].lower()}("{path}", summary="{r['summary']}")
async def {fn_name}():
    \"\"\"Auto-generated mock endpoint for task {r['code']}\"\"\"
    return {repr(r['response'])}

"""

    files["backend/app/routers/mock_routes.py"] = routes_py
    files["backend/app/routers/__init__.py"] = ""

    # Backend Main
    main_py = f"""from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.mock_routes import router as mock_router

app = FastAPI(
    title="{project_name} API",
    description="Generated by Daedalus AI Scaffolding Engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mock_router, prefix="/api/v1", tags=["Roadmap Endpoints"])

@app.get("/")
def read_root():
    return {{"system": "{project_name}", "status": "running", "engine": "Daedalus AI"}}

@app.get("/health")
def health_check():
    return {{"status": "healthy"}}
"""
    files["backend/app/main.py"] = main_py
    files["backend/tests/test_main.py"] = """from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "running"

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
"""

    # 5. Frontend Starter Code
    files["frontend/package.json"] = """{
  "name": "frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.395.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.5",
    "vite": "^5.3.0"
  }
}
"""

    files["frontend/vite.config.ts"] = """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
"""

    files["frontend/index.html"] = """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Daedalus Generated App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
"""

    files["frontend/tsconfig.json"] = """{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
"""

    files["frontend/tailwind.config.js"] = """/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
"""

    files["frontend/postcss.config.js"] = """export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"""

    files["frontend/src/App.tsx"] = f"""import React, {{ useEffect, useState }} from 'react'

export function App() {{
  const [data, setData] = useState<any>(null)

  useEffect(() => {{
    fetch('/api/v1/health')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error(err))
  }}, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="p-8 rounded-2xl border border-cyan-500/20 bg-slate-900/50 backdrop-blur-md max-w-xl text-center shadow-2xl">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          {project_name}
        </h1>
        <p className="mt-4 text-slate-400">
          Scaffolded by Daedalus AI. FastAPI backend & mock APIs ready.
        </p>
        <div className="mt-6 p-4 rounded-lg bg-black/40 text-left font-mono text-xs text-cyan-300">
          Status: {{data ? JSON.stringify(data) : 'Connecting to API...'}}
        </div>
      </div>
    </div>
  )
}}

export default App
"""

    files["frontend/src/main.tsx"] = """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
"""

    files["frontend/src/index.css"] = """@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  background-color: #0B0F19;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
"""

    files["frontend/Dockerfile"] = """FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
"""

    return files


def generate_scaffold_zip(project_name: str, tasks: List[Dict[str, Any]]) -> io.BytesIO:
    """
    Generates an in-memory ZIP package containing a production-ready repository
    with FastAPI backend, dynamic mock endpoints based on the roadmap tasks,
    React frontend shell, Docker Compose, and GitHub Actions CI.
    """
    files = generate_scaffold_files(project_name, tasks)
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for file_path, content in files.items():
            zf.writestr(file_path, content)

    zip_buffer.seek(0)
    return zip_buffer
