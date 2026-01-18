import Fastify from 'fastify';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

const app = Fastify({ logger: true });

const mcpServer = new Server(
  { name: 'sg-air-temp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

mcpServer.setRequestHandler('tools/list', async () => ({
  tools: [{
    name: 'get_air_temperature',
    description: 'Get real-time air temperature from Singapore',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }]
}));

mcpServer.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'get_air_temperature') {
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

app.get('/sse', async (request, reply) => {
  const transport = new SSEServerTransport('/sse', reply.raw);
  await mcpServer.connect(transport);
});

const PORT = process.env.PORT || 3000;
app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`MCP Server running on port ${PORT}`);
});
