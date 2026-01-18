import Fastify from 'fastify';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamable-http.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const app = Fastify({ logger: true });

app.all('/mcp', async (request, reply) => {
  const mcpServer = new Server(
    { name: 'sg-air-temp', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{
      name: 'get_air_temperature',
      description: 'Get real-time air temperature from Singapore',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    }]
  }));

  mcpServer.setRequestHandler(CallToolRequestSchema, async (req) => {
    if (req.params.name === 'get_air_temperature') {
      const response = await fetch('https://api-open.data.gov.sg/v2/real-time/api/air-temperature');
      const data = await response.json();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }]
      };
    }
    throw new Error('Unknown tool');
  });

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true
  });

  reply.raw.on('close', () => {
    transport.close();
    mcpServer.close();
  });

  await mcpServer.connect(transport);
  await transport.handleRequest(request.raw, reply.raw);
});

const PORT = process.env.PORT || 3000;
app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`MCP Server running on port ${PORT}`);
});
