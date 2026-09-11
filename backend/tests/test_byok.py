import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from main import app
from app.core.security_middleware import SensitiveHeaderFilter
import logging


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_byok_providers_catalog(client):
    """Verifies the provider catalog returns security specifications and Gemini 3.6."""
    resp = client.get("/api/v1/byok/providers")
    assert resp.status_code == 200
    data = resp.json()

    assert "providers" in data
    assert "security_policy" in data

    # Check zero-knowledge security assertions
    policy = data["security_policy"]
    assert "AES-256-GCM" in policy["encryption"]
    assert "Zero server-side persistence" in policy["storage"]

    providers = data["providers"]
    provider_ids = [p["id"] for p in providers]
    assert "gemini" in provider_ids
    assert "openai" in provider_ids
    assert "anthropic" in provider_ids
    assert "github" in provider_ids

    # Gemini must feature gemini-3.6-flash
    gemini_entry = next(p for p in providers if p["id"] == "gemini")
    assert gemini_entry["default_model"] == "gemini-3.6-flash"
    assert "gemini-3.6-flash" in gemini_entry["supported_models"]


def test_byok_validate_invalid_key(client):
    """Verifies that an invalid API key returns a structured 200 response with valid=False."""
    resp = client.post(
        "/api/v1/byok/validate",
        json={
            "provider": "gemini",
            "api_key": "AIzaSy_fake_test_key_for_unit_tests",
            "model": "gemini-3.6-flash"
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["provider"] == "gemini"
    assert data["valid"] is False
    assert "message" in data


@pytest.mark.asyncio
async def test_byok_validate_mock_success(client):
    """Mocks provider verification to ensure valid key returns latency and model list."""
    with patch("app.api.v1.endpoints.byok.test_provider_key", new_callable=AsyncMock) as mock_test:
        mock_test.return_value = (
            True,
            "Key verified successfully with Google Gemini API.",
            142,
            ["gemini-3.6-flash", "gemini-3.6-pro", "gemini-1.5-flash"]
        )

        resp = client.post(
            "/api/v1/byok/validate",
            json={
                "provider": "gemini",
                "api_key": "AIzaSyMockValidKey12345",
                "model": "gemini-3.6-flash"
            }
        )

        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is True
        assert data["latency_ms"] == 142
        assert "gemini-3.6-flash" in data["available_models"]


def test_security_header_redactor_middleware(client):
    """Verifies sensitive transit headers are never reflected back in response headers."""
    secret_key = "AIzaSySecretTestKey123456789"
    resp = client.post(
        "/api/v1/projects/decompose",
        headers={
            "X-BYOK-Provider": "gemini",
            "X-BYOK-Key": secret_key,
            "X-BYOK-Model": "gemini-3.6-flash"
        },
        json={
            "title": "Decentralized Autonomous Escrow",
            "description": "Multi-sig smart contract escrow with time-locked releases"
        }
    )

    assert resp.status_code == 200
    # Response headers must NOT leak the secret key
    assert "X-BYOK-Key" not in resp.headers
    assert "x-byok-key" not in resp.headers
    for header_val in resp.headers.values():
        assert secret_key not in header_val


def test_sensitive_header_filter_logging():
    """Verifies that the SensitiveHeaderFilter redacts raw API keys from log records."""
    log_filter = SensitiveHeaderFilter()
    record = logging.LogRecord(
        name="test_logger",
        level=logging.INFO,
        pathname="test.py",
        lineno=10,
        msg="Calling Gemini with key AIzaSyABCDEF123456789 and Bearer sk-ant-api03-abcdefg987",
        args=(),
        exc_info=None
    )

    log_filter.filter(record)
    assert "AIzaSyABCDEF123456789" not in record.msg
    assert "sk-ant-api03-abcdefg987" not in record.msg
    assert "AIzaSy...[REDACTED]" in record.msg
    assert "sk-...[REDACTED]" in record.msg
