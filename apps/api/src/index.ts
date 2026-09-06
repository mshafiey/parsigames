import { Hono } from 'hono';
import type { Env } from './types';
import authGithub from './routes/auth-github';

const app = new Hono<{ Bindings: Env }>();

app.get('/health', (c) => c.json({ status: 'ok' }));
app.route('/auth', authGithub);

export default app;
