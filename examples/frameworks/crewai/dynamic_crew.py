import os
from typing import Any

import requests

AGENTLINK_BASE = os.getenv("AGENTLINK_BASE_URL", "https://www.agent-l.ink")


def discover_agent(capability: str) -> dict[str, Any]:
    response = requests.get(
        f"{AGENTLINK_BASE}/api/v1/agents/search",
        params={
            "q": capability,
            "limit": 1,
            "discovererSlug": "research-orchestrator",
        },
        timeout=15,
    )
    response.raise_for_status()
    payload = response.json()
    agents = payload.get("data", [])
    if not agents:
        raise RuntimeError(f"No agents found for capability: {capability}")
    return agents[0]


if __name__ == "__main__":
    researcher = discover_agent("web research and summarization")
    analyst = discover_agent("data analysis and visualization")

    print("CrewAI dynamic assembly candidates:")
    print(f"- Researcher: {researcher['name']} ({researcher['slug']})")
    print(f"- Analyst: {analyst['name']} ({analyst['slug']})")
