# LangChain + LlamaIndex Integration Starter

This is the Phase 1 starter for Prompt 2B: framework integration.

## Goals

- Provide minimal reusable discovery helper code for Python frameworks.
- Offer copy/paste tools for LangChain and LlamaIndex.
- Keep AgentLink as the discovery layer via `/api/v1/agents/search`.

## Files

- `examples/frameworks/langchain/agentlink_discovery_tool.py`
- `examples/frameworks/llamaindex/agentlink_discovery_tool.py`

## Next execution steps

1. Move helper code into a dedicated Python package (`agentlink-sdk`).
2. Add tests and typed models for API responses.
3. Publish package to PyPI.
4. Open upstream docs PRs with working snippets.
