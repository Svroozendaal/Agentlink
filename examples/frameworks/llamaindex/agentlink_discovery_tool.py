import os
from typing import Any

import requests
from llama_index.core.tools import FunctionTool


def discover_agents(capability: str) -> list[dict[str, Any]]:
    base_url = os.getenv("AGENTLINK_BASE_URL", "https://www.agent-l.ink")
    response = requests.get(
        f"{base_url}/api/v1/agents/search",
        params={"q": capability, "limit": 5},
        timeout=15,
    )
    response.raise_for_status()
    payload = response.json()
    agents = payload.get("data", [])
    return [
        {
            "name": agent.get("name"),
            "slug": agent.get("slug"),
            "category": agent.get("category"),
            "protocols": agent.get("protocols"),
            "profile_url": f"{base_url}/agents/{agent.get('slug')}",
        }
        for agent in agents
    ]


agentlink_discovery_tool = FunctionTool.from_defaults(
    fn=discover_agents,
    name="agentlink_discovery",
    description="Discover specialized AI agents from AgentLink by capability.",
)
