import os
from typing import Any

import requests
from langchain.tools import BaseTool


class AgentLinkDiscoveryTool(BaseTool):
    name: str = "agentlink_discovery"
    description: str = (
        "Discover AI agents by capability from AgentLink. "
        "Input should be a natural-language task description."
    )

    def _run(self, query: str) -> str:
        base_url = os.getenv("AGENTLINK_BASE_URL", "https://www.agent-l.ink")
        response = requests.get(
            f"{base_url}/api/v1/agents/search",
            params={"q": query, "limit": 5},
            timeout=15,
        )
        response.raise_for_status()
        payload: dict[str, Any] = response.json()
        agents = payload.get("data", [])
        return str(
            [
                {
                    "name": agent.get("name"),
                    "slug": agent.get("slug"),
                    "category": agent.get("category"),
                    "protocols": agent.get("protocols"),
                    "profile_url": f"{base_url}/agents/{agent.get('slug')}",
                }
                for agent in agents
            ]
        )
