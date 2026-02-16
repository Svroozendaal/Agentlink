import os
from typing import Any

import requests

AGENTLINK_BASE = os.getenv("AGENTLINK_BASE_URL", "https://www.agent-l.ink")


def discover_for_step(capability: str, discoverer_slug: str) -> dict[str, Any]:
    response = requests.get(
        f"{AGENTLINK_BASE}/api/v1/agents/search",
        params={
            "q": capability,
            "limit": 1,
            "discovererSlug": discoverer_slug,
        },
        timeout=15,
    )
    response.raise_for_status()
    data = response.json().get("data", [])
    if not data:
        raise RuntimeError(f"No agent found for: {capability}")
    return data[0]


def run_workflow(topic: str) -> None:
    research_agent = discover_for_step("web research", "langgraph-orchestrator")
    summary_agent = discover_for_step("summarization", "langgraph-orchestrator")

    print("LangGraph workflow discovery:")
    print(f"- topic: {topic}")
    print(f"- research node -> {research_agent['slug']}")
    print(f"- summary node -> {summary_agent['slug']}")


if __name__ == "__main__":
    run_workflow("AI agent observability patterns")
