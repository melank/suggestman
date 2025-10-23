import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
  return c.json({
    message: 'Hello, Suggestman!',
    timestamp: new Date().toISOString(),
  });
});

export default app;
