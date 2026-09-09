import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import authGithub from './routes/auth-github';
import authMagic from './routes/auth-magic';
import users from './routes/users';

const app = new Hono<{ Bindings: Env }>();

app.use(
  '*',
  cors({
    origin: 'https://parsigames.org',
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  })
);

app.get('/health', (c) => c.json({ status: 'ok' }));
app.route('/auth', authGithub);
app.route('/auth', authMagic);
app.route('/', users);

export default app;
