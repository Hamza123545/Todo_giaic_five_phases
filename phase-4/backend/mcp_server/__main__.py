"""
MCP Server entry point for task management tools.

This module enables running the MCP server as a Python module:
    python -m mcp_server

The server uses stdio transport to communicate with the agent via
the Model Context Protocol (MCP).
"""

from mcp_server.tools import mcp

if __name__ == "__main__":
    # Run the FastMCP server
    # FastMCP handles stdio transport automatically
    mcp.run()
