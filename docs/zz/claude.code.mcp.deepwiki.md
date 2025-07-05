## Installing deepwiki mcp server

1. Check if DeepWiki MCP is available

    First, check if DeepWiki MCP server is already installed:
    ```bash
    claude mcp list
    ```

2. Install DeepWiki MCP Server

    If not installed, you'll need to add it. The exact command depends on how DeepWiki MCP is distributed:

    If it's a Node.js package:
    ```bash
    claude mcp add deepwiki npx @deepwiki/mcp-server
    ```

    If it's a Python package:
    ```bash
    claude mcp add deepwiki python -m deepwiki_mcp
    ```

    If it's a binary:
    ```bash
    claude mcp add deepwiki /path/to/deepwiki-mcp-server
    ```

  3. Configuration Scopes

      Choose your scope based on needs:
      - Local (default): `claude mcp add deepwiki ...`
      - Project: `claude mcp add --scope project deepwiki ...`
      - User: `claude mcp add --scope user deepwiki ...`

  4. Environment Variables

      If DeepWiki requires API keys or configuration:
      ```bash
      claude mcp add deepwiki npx @deepwiki/mcp-server -e DEEPWIKI_API_KEY=your_key
      ```

  5. Verify Installation

      ```bash
      claude mcp get deepwiki
      ```

## Combination

```bash
claude mcp add deepwiki -s user -- npx -y deepwiki-mcp-server
```

Breaking it down:
  - `claude mcp add deepwiki` - Add server named "deepwiki"
  - `-s user` - Set scope to "user" (available across all projects)
  - `--` - Separator for the command
  - `npx -y deepwiki-mcp-server` - Run the MCP server via npx with auto-yes

This is more concise than doing it in separate steps. The `-s user` flag is equivalent to `--scope user`, making the server available
  globally rather than just in the current project.


## Usage

In Claude Code CLI, the DeepWiki MCP server translates to these usage patterns:

  1. `@-mentions` (Reference Resources)

      `@deepwiki/shadcn-ui/ui`
      `@deepwiki/vercel/ai`
      `@deepwiki/facebook/react`

  2. Slash Commands (Execute Actions)

      `/deepwiki fetch shadcn-ui/ui`
      `/deepwiki ask "how to create custom components in shadcn?"`
      `/deepwiki analyze vercel/ai`

  3. Natural Language Requests

      "Use deepwiki to show me how to implement authentication in Next.js"
      "Get documentation from deepwiki about React hooks"
      "Ask deepwiki about best practices for TypeScript"

  4. MCP Tool Integration

      The server's deepwiki_fetch tool gets automatically available as:
      - Tool calls within conversations
      - Background resource fetching
      - Contextual documentation retrieval

      Example Claude Code Session:

      `user: @deepwiki/shadcn-ui/ui How do I create a custom button component?`

      `assistant: [Claude automatically fetches from DeepWiki and provides context-aware answer]`

      `user: /deepwiki fetch next.js authentication patterns`

      `assistant: [Executes deepwiki fetch and returns formatted results]`

      Verification Commands:
      ```bash
      # Check if server is working
      claude mcp list
      claude mcp get deepwiki
    
      # Test the connection
      claude mcp test deepwiki
      ```

      The key difference is that instead of manual API calls, you get integrated AI assistance with automatic context fetching from
      DeepWiki repositories.

## Analyzing `crpto-streaming`

In claude code cli:

`@deepwiki/theavicaster/crypto-streaming`

