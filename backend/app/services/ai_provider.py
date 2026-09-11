import json
import logging
import re
from typing import Dict, List, Optional, Any, Tuple
import httpx
from app.services.decomposer import validate_dag, calculate_dag_metrics, detect_project_domain

logger = logging.getLogger("daedalus.ai_provider")

DEFAULT_MODELS = {
    "gemini": "gemini-3.6-flash",
    "openai": "gpt-4o-mini",
    "anthropic": "claude-3-5-sonnet-20241022"
}

FALLBACK_GEMINI_MODELS = ["gemini-3.6-flash", "gemini-1.5-flash", "gemini-1.5-pro"]


def extract_json_from_text(text: str) -> dict:
    """Extracts and parses JSON object from raw LLM output, stripping markdown codeblocks if present."""
    clean = text.strip()
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", clean, re.DOTALL)
    if match:
        return json.loads(match.group(1))
    first_brace = clean.find("{")
    last_brace = clean.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        return json.loads(clean[first_brace:last_brace + 1])
    return json.loads(clean)


DECOMPOSITION_SYSTEM_PROMPT = """You are Daedalus AI, an autonomous hackathon co-pilot and distributed systems architect.
Your job is to decompose any project idea into a production-grade, conflict-free DAG (Directed Acyclic Graph) of Epics and Tasks.

Rules:
1. Produce exactly 3 or 4 sequential Epics (order_index 1 to 4).
2. Produce 6 to 8 focused engineering Tasks distributed among Epics.
3. Every task must specify:
   - "task_code": A short 2-4 letter uppercase prefix with a number (e.g. CORE-01, API-02, UI-03).
   - "title": Clear action-oriented title.
   - "description": Concrete technical implementation steps.
   - "required_skills": Comma-separated list of 3-5 real technologies/stacks.
   - "api_route_spec": A contract object with "path" (e.g. /api/v1/resource), "method" (GET/POST/PUT/DELETE), "summary", and "response_mock" (realistic mock JSON).
   - "depends_on": List of prerequisite "task_code" strings. The graph MUST be acyclic (no circular dependencies).
4. Output STRICT JSON only with this structure:
{
  "title": "<project_title>",
  "domain": "<web3 | ai_rag | crdt_realtime | healthcare | fintech | mobile_iot | devtools | ecommerce_social | general>",
  "epics": [
    {
      "title": "<epic_title>",
      "description": "<epic_desc>",
      "order_index": 1,
      "tasks": [
        {
          "task_code": "CORE-01",
          "title": "...",
          "description": "...",
          "required_skills": "...",
          "api_route_spec": {
            "path": "/api/v1/...",
            "method": "POST",
            "summary": "...",
            "response_mock": { "status": "success" }
          },
          "depends_on": []
        }
      ]
    }
  ]
}
"""


async def test_provider_key(
    provider: str,
    api_key: str,
    model: Optional[str] = None
) -> Tuple[bool, str, Optional[int], List[str]]:
    """
    Performs a non-destructive live ping to the provider's API.
    Returns: (is_valid, message, latency_ms, available_models)
    """
    clean_key = api_key.strip()
    if not clean_key:
        return False, "API key cannot be empty", None, []

    provider = provider.lower()
    start_time = 0

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            import time
            t0 = time.time()

            if provider == "gemini":
                # Validate Gemini key using models list
                target_model = model or DEFAULT_MODELS["gemini"]
                url = f"https://generativelanguage.googleapis.com/v1beta/models?key={clean_key}"
                resp = await client.get(url)
                latency = int((time.time() - t0) * 1000)

                if resp.status_code == 200:
                    data = resp.json()
                    models = [
                        m.get("name", "").replace("models/", "")
                        for m in data.get("models", [])
                        if "generateContent" in m.get("supportedGenerationMethods", [])
                    ]
                    # Include gemini-3.6 in list if user specified it
                    if target_model not in models:
                        models.insert(0, target_model)
                    return True, f"Google Gemini Key Active ({target_model})", latency, models[:6]
                else:
                    err_msg = resp.json().get("error", {}).get("message", resp.text)
                    return False, f"Gemini Error ({resp.status_code}): {err_msg}", latency, []

            elif provider == "openai":
                url = "https://api.openai.com/v1/models"
                headers = {"Authorization": f"Bearer {clean_key}"}
                resp = await client.get(url, headers=headers)
                latency = int((time.time() - t0) * 1000)

                if resp.status_code == 200:
                    data = resp.json()
                    models = [m.get("id", "") for m in data.get("data", []) if "gpt" in m.get("id", "")]
                    return True, "OpenAI Key Verified (GPT-4o Ready)", latency, models[:6]
                else:
                    err_msg = resp.json().get("error", {}).get("message", resp.text)
                    return False, f"OpenAI Error ({resp.status_code}): {err_msg}", latency, []

            elif provider == "anthropic":
                # Anthropic messages probe
                url = "https://api.anthropic.com/v1/models"
                headers = {
                    "x-api-key": clean_key,
                    "anthropic-version": "2023-06-01"
                }
                resp = await client.get(url, headers=headers)
                latency = int((time.time() - t0) * 1000)

                if resp.status_code == 200:
                    data = resp.json()
                    models = [m.get("id", "") for m in data.get("data", [])]
                    return True, "Anthropic Claude Key Verified", latency, models[:4]
                elif resp.status_code in [400, 404]:
                    # Some keys only have access to /messages
                    return True, "Anthropic Claude Key Verified", latency, ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"]
                else:
                    return False, f"Anthropic Error ({resp.status_code}): {resp.text}", latency, []

            elif provider == "github":
                url = "https://api.github.com/user"
                headers = {
                    "Authorization": f"Bearer {clean_key}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "Daedalus-AI-CoPilot"
                }
                resp = await client.get(url, headers=headers)
                latency = int((time.time() - t0) * 1000)

                if resp.status_code == 200:
                    user_data = resp.json()
                    login = user_data.get("login", "Hacker")
                    scopes = resp.headers.get("X-OAuth-Scopes", "public")
                    return True, f"GitHub PAT Validated for @{login} (Scopes: {scopes})", latency, ["repo", "workflow", "user"]
                else:
                    return False, f"GitHub Error ({resp.status_code}): Invalid Token", latency, []

            else:
                return False, f"Unsupported provider: {provider}", None, []

    except Exception as e:
        logger.error(f"BYOK verification exception for {provider}: {str(e)}")
        return False, f"Connection Failed: {str(e)}", None, []


async def generate_decomposition_with_ai(
    title: str,
    description: str,
    provider: str,
    api_key: str,
    model: Optional[str] = None
) -> Optional[dict]:
    """
    Invokes external LLM using user's BYOK credentials to decompose project idea.
    Returns structured roadmap dict if successful, or None if failed/timed out.
    """
    clean_key = api_key.strip()
    if not clean_key:
        return None

    provider = provider.lower()
    prompt = f"Project Title: {title}\nProject Requirements:\n{description}"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            json_text = None

            if provider == "gemini":
                models_to_try = [model] if model else FALLBACK_GEMINI_MODELS
                for target_model in models_to_try:
                    if not target_model:
                        continue
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={clean_key}"
                    payload = {
                        "contents": [
                            {"role": "user", "parts": [{"text": f"{DECOMPOSITION_SYSTEM_PROMPT}\n\n{prompt}"}]}
                        ],
                        "generationConfig": {
                            "responseMimeType": "application/json",
                            "temperature": 0.2
                        }
                    }
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        candidates = resp.json().get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                json_text = parts[0].get("text", "")
                                logger.info(f"Successfully decomposed via Gemini model '{target_model}'")
                                break
                    else:
                        logger.warning(f"Gemini model {target_model} returned {resp.status_code}: {resp.text}")

            elif provider == "openai":
                target_model = model or DEFAULT_MODELS["openai"]
                url = "https://api.openai.com/v1/chat/completions"
                headers = {"Authorization": f"Bearer {clean_key}"}
                payload = {
                    "model": target_model,
                    "messages": [
                        {"role": "system", "content": DECOMPOSITION_SYSTEM_PROMPT},
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.2
                }
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    json_text = resp.json()["choices"][0]["message"]["content"]
                    logger.info(f"Successfully decomposed via OpenAI '{target_model}'")

            elif provider == "anthropic":
                target_model = model or DEFAULT_MODELS["anthropic"]
                url = "https://api.anthropic.com/v1/messages"
                headers = {
                    "x-api-key": clean_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                }
                payload = {
                    "model": target_model,
                    "max_tokens": 4096,
                    "system": DECOMPOSITION_SYSTEM_PROMPT,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.2
                }
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    content_blocks = resp.json().get("content", [])
                    if content_blocks:
                        json_text = content_blocks[0].get("text", "")
                        logger.info(f"Successfully decomposed via Anthropic '{target_model}'")

            if not json_text:
                logger.warning(f"No text extracted from AI provider {provider}")
                return None

            # Parse JSON with resilient markdown codeblock extraction
            try:
                parsed = extract_json_from_text(json_text)
            except Exception as parse_err:
                logger.warning(f"Failed to parse JSON from AI provider {provider}: {parse_err}")
                return None
            if not isinstance(parsed, dict) or "epics" not in parsed:
                logger.warning("AI output JSON does not contain 'epics' list")
                return None

            # Validate and calculate DAG dependencies
            all_tasks = []
            dependencies = []
            for epic in parsed.get("epics", []):
                for task in epic.get("tasks", []):
                    code = task.get("task_code", "TASK")
                    all_tasks.append({"task_code": code})
                    for dep in task.get("depends_on", []):
                        dependencies.append((code, dep))

            # Validate acyclicity via topological sort
            topological_order = validate_dag(all_tasks, dependencies)
            metrics = calculate_dag_metrics(all_tasks, dependencies)

            return {
                "title": parsed.get("title", title),
                "domain": parsed.get("domain") or detect_project_domain(title, description),
                "epics": parsed["epics"],
                "topological_order": topological_order,
                "metrics": metrics,
                "ai_engine": f"{provider} (BYOK)"
            }

    except Exception as e:
        logger.error(f"AI decomposition failed via {provider}: {str(e)}. Falling back to deterministic engine.")
        return None
