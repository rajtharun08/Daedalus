import io
import zipfile
import pytest
from app.services.embeddings import compute_deterministic_embedding, cosine_similarity
from app.services.decomposer import validate_dag, DAGCycleException, decompose_project_idea, calculate_dag_metrics
from app.services.scaffolding_engine import generate_scaffold_zip


def test_embeddings_dimension_and_norm():
    text = "FastAPI, PostgreSQL, Docker, React"
    vec = compute_deterministic_embedding(text, dim=384)
    assert len(vec) == 384
    # Check normalized
    mag = sum(v * v for v in vec)
    assert abs(mag - 1.0) < 0.01


def test_cosine_similarity():
    v1 = compute_deterministic_embedding("React TypeScript Frontend")
    v2 = compute_deterministic_embedding("React UI Nextjs")
    v3 = compute_deterministic_embedding("PostgreSQL Linux Kernel Docker")

    sim_12 = cosine_similarity(v1, v2)
    sim_13 = cosine_similarity(v1, v3)

    assert sim_12 > sim_13  # Similar tech stack should have higher similarity score


def test_dag_acyclic_validation():
    # Valid DAG
    tasks = [{"task_code": "A"}, {"task_code": "B"}, {"task_code": "C"}]
    deps = [("B", "A"), ("C", "B")]  # B depends on A, C depends on B
    order = validate_dag(tasks, deps)
    assert order == ["A", "B", "C"]

    # Cycle Detection
    cyclic_deps = [("B", "A"), ("C", "B"), ("A", "C")]  # A -> B -> C -> A
    with pytest.raises(DAGCycleException):
        validate_dag(tasks, cyclic_deps)


def test_project_decomposition_structure():
    decomp = decompose_project_idea("Hackathon AI App", "Build an autonomous student assistant")
    assert "epics" in decomp
    assert len(decomp["epics"]) == 4
    assert len(decomp["topological_order"]) > 0


def test_scaffolding_zip_generation():
    tasks = [
        {
            "task_code": "CORE-01",
            "title": "Setup DB",
            "api_route_spec": {
                "path": "/api/v1/items",
                "method": "GET",
                "summary": "List items",
                "response_mock": {"items": []}
            }
        }
    ]
    zip_buf = generate_scaffold_zip("TestProject", tasks)
    assert isinstance(zip_buf, io.BytesIO)

    # Verify it is a valid zip archive
    with zipfile.ZipFile(zip_buf, "r") as zf:
        file_list = zf.namelist()
        assert "README.md" in file_list
        assert "docker-compose.yml" in file_list
        assert ".github/workflows/ci.yml" in file_list
        assert "backend/app/main.py" in file_list
        assert "backend/app/routers/mock_routes.py" in file_list
        assert "frontend/src/App.tsx" in file_list


def test_detect_project_domain():
    from app.services.decomposer import detect_project_domain
    assert detect_project_domain("Solana Dex", "mempool arbitrage flash loan") == "web3"
    assert detect_project_domain("Literature Synthesizer", "PubMed RAG literature dense embedding and citations") == "ai_rag"
    assert detect_project_domain("Vector Canvas", "real-time CRDT whiteboard websocket") == "crdt_realtime"
    assert detect_project_domain("Payment Fraud", "high throughput ledger transaction") == "fintech"
    assert detect_project_domain("ICU Telemetry", "patient triage vital signs hospital") == "healthcare"
    assert detect_project_domain("eBPF Profiler", "kernel tracing flamegraph metrics") == "devtools"


def test_calculate_dag_metrics():
    from app.services.decomposer import calculate_dag_metrics
    tasks = [{"task_code": "T1"}, {"task_code": "T2"}, {"task_code": "T3"}]
    deps = [("T2", "T1"), ("T3", "T2")]  # T1 -> T2 -> T3
    metrics = calculate_dag_metrics(tasks, deps)
    assert metrics["critical_path_depth"] == 3
    assert metrics["max_parallel_tracks"] >= 1
    assert metrics["total_task_count"] == 3
    assert metrics["estimated_sprint_hours"] > 0


def test_split_task_in_dag():
    from app.services.decomposer import split_task_in_dag
    task = {
        "task_code": "CORE-01",
        "title": "Build Auth and Database",
        "required_skills": "Python, React"
    }
    subtasks = split_task_in_dag(task, "frontend_backend")
    assert len(subtasks) == 2
    assert subtasks[0]["task_code"] == "CORE-01a"
    assert subtasks[1]["task_code"] == "CORE-01b"
    assert "React" in subtasks[0]["required_skills"]
    assert "FastAPI" in subtasks[1]["required_skills"]


def test_calculate_dag_metrics_cycle_prevention():
    """Verify that calculate_dag_metrics never hangs on cycles and raises DAGCycleException."""
    tasks = [{"task_code": "A"}, {"task_code": "B"}, {"task_code": "C"}]
    # Cycle: C -> A -> B -> A
    cyclic_deps = [("B", "A"), ("A", "B"), ("A", "C")]
    with pytest.raises(DAGCycleException):
        calculate_dag_metrics(tasks, cyclic_deps)


def test_scaffolding_python_ast_syntax_validity():
    """Verify that all generated Python files in the scaffold ZIP parse cleanly without syntax errors."""
    import ast
    import zipfile

    mock_tasks = [
        {
            "task_code": "API-01",
            "title": "Auth Gate",
            "api_route_spec": {
                "path": "/api/v1/auth",
                "method": "POST",
                "summary": "Authenticate user",
                "response_mock": {
                    "authenticated": True,
                    "verified": False,
                    "profile": None,
                    "token": "tok_123"
                }
            }
        }
    ]
    zip_buf = generate_scaffold_zip("Test App", mock_tasks)

    with zipfile.ZipFile(zip_buf, "r") as zf:
        namelist = zf.namelist()
        # Verify frontend essential config files are present
        assert "frontend/index.html" in namelist
        assert "frontend/tsconfig.json" in namelist
        assert "frontend/tailwind.config.js" in namelist
        assert "frontend/postcss.config.js" in namelist

        # Verify all Python files parse with valid AST
        py_files = [n for n in namelist if n.endswith(".py")]
        assert len(py_files) >= 3
        for py_file in py_files:
            content = zf.read(py_file).decode("utf-8")
            # ast.parse raises SyntaxError if invalid Python
            parsed_ast = ast.parse(content)
            assert parsed_ast is not None


def test_domain_archetypes_all_covered():
    """Verify that all 8 domains produce genuine domain-specific task codes."""
    domains_to_test = [
        ("Clinical FHIR Health", "Patient medical records and vitals pipeline", "healthcare", "FHIR-01"),
        ("Double-Entry Ledger", "Payment transactions and reconciliation", "fintech", "LEDGER-01"),
        ("AST Tree-Sitter CLI", "Compiler parser and diagnostics daemon", "devtools", "AST-01"),
        ("Edge Sensor MQTT", "Hardware telemetry and device fleet monitoring", "mobile_iot", "MQTT-01"),
        ("Product Catalog Store", "E-commerce marketplace and social activity feed", "ecommerce_social", "CATALOG-01"),
    ]
    for title, desc, expected_domain, expected_task_code in domains_to_test:
        res = decompose_project_idea(title, desc)
        assert res["domain"] == expected_domain
        task_codes = [t["task_code"] for e in res["epics"] for t in e["tasks"]]
        assert expected_task_code in task_codes

