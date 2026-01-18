import http from 'http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

const server = new McpServer({
  name: 'sg-air-temp',
  version: '1.0.0'
});

server.tool(
  'get_air_temperature',
  'Get real-time air temperature from Singapore',
  {},
  async () => {
    const response = await fetch('https://api-open.data.gov.sg/v2/real-time/api/air-temperature');
    const data = await response.json();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(data, null, 2)
      }]
    };
  }
);

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined // stateless
});

await server.connect(transport);

const httpServer = http.createServer(async (req, res) => {
  if (req.url === '/mcp' && req.method === 'POST') {
    await transport.handleRequest(req, res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`MCP Server running on port ${PORT}`);
});
