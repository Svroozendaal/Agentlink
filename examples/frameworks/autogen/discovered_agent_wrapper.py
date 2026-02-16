import os
from typing import Any

import requests

AGENTLINK_BASE = os.getenv("AGENTLINK_BASE_URL", "https://www.agent-l.ink")


def discover_agent(query: str, discoverer_slug: str) -> dict[str, Any]:
    response = requests.get(
        f"{AGENTLINK_BASE}/api/v1/agents/search",
        params={
            "q": query,
            "limit": 1,
            "discovererSlug": discoverer_slug,
        },
        timeout=15,
    )
    response.raise_for_status()
    agents = response.json().get("data", [])
    if not agents:
        raise RuntimeError(f"No discovered agent for query={query}")
    return agents[0]


def invoke_discovered_agent(from_slug: str, to_slug: str, body: dict[str, Any], api_key: str) -> dict[str, Any]:
    response = requests.post(
        f"{AGENTLINK_BASE}/api/v1/agents/{to_slug}/connect",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "fromAgentSlug": from_slug,
            "body": body,
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


if __name__ == "__main__":
    reviewer = discover_agent("code review and security analysis", "autogen-orchestrator")
    print(f"Discovered AutoGen target: {reviewer['name']} ({reviewer['slug']})")
