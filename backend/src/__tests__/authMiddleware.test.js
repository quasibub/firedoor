const http = require('http');
const app = require('../../dist/index.js').default;

describe('Auth Middleware', () => {
  let server;
  let baseUrl;

  beforeAll(done => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      done();
    });
  });

  afterAll(done => {
    server.close(done);
  });

  const fetchJson = path => fetch(baseUrl + path).then(res => ({status: res.status}));

  test('returns 401 for accessing tasks without token', async () => {
    const res = await fetchJson('/api/tasks');
    expect(res.status).toBe(401);
  });

  test('returns 401 for accessing homes without token', async () => {
    const res = await fetchJson('/api/homes');
    expect(res.status).toBe(401);
  });

  test('returns 401 for accessing reports without token', async () => {
    const res = await fetchJson('/api/reports');
    expect(res.status).toBe(401);
  });
});
