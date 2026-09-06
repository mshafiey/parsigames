import { Hono } from 'hono';
import type { Env } from './types';
import authGithub from './routes/auth-github';
import authMagic from './routes/auth-magic';
import users from './routes/users';

const app = new Hono<{ Bindings: Env }>();

app.get('/health', (c) => c.json({ status: 'ok' }));
app.route('/auth', authGithub);
app.route('/auth', authMagic);
app.route('/', users);

export default app;
