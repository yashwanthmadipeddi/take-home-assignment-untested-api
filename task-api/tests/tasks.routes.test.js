const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Task API routes', () => {
  beforeEach(() => {
    taskService._reset();
  });

  async function createTask(overrides = {}) {
    const response = await request(app)
      .post('/tasks')
      .send({
        title: 'Sample task',
        ...overrides,
      });

    expect(response.status).toBe(201);
    return response.body;
  }

  test('GET /tasks returns all tasks', async () => {
    await createTask({ title: 'A' });
    await createTask({ title: 'B' });

    const response = await request(app).get('/tasks');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  test('GET /tasks?status=todo filters by exact status', async () => {
    await createTask({ title: 'Todo', status: 'todo' });
    await createTask({ title: 'Progress', status: 'in_progress' });

    const response = await request(app).get('/tasks?status=todo');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('Todo');
  });

  test('GET /tasks?page=1&limit=2 returns the first page', async () => {
    await createTask({ title: 'A' });
    await createTask({ title: 'B' });
    await createTask({ title: 'C' });

    const response = await request(app).get('/tasks?page=1&limit=2');

    expect(response.status).toBe(200);
    expect(response.body.map((task) => task.title)).toEqual(['A', 'B']);
  });

  test('GET /tasks?page=2&limit=2 returns the second page', async () => {
    await createTask({ title: 'A' });
    await createTask({ title: 'B' });
    await createTask({ title: 'C' });

    const response = await request(app).get('/tasks?page=2&limit=2');

    expect(response.status).toBe(200);
    expect(response.body.map((task) => task.title)).toEqual(['C']);
  });

  test('GET /tasks?limit=2 defaults page to 1', async () => {
    await createTask({ title: 'A' });
    await createTask({ title: 'B' });
    await createTask({ title: 'C' });

    const response = await request(app).get('/tasks?limit=2');

    expect(response.body.map((task) => task.title)).toEqual(['A', 'B']);
  });

  test('GET /tasks/stats returns status counts and overdue count', async () => {
    await createTask({
      status: 'todo',
      dueDate: '2000-01-01T00:00:00.000Z',
    });
    await createTask({ status: 'in_progress' });
    await createTask({ status: 'done' });

    const response = await request(app).get('/tasks/stats');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      todo: 1,
      in_progress: 1,
      done: 1,
      overdue: 1,
    });
  });

  test('POST /tasks creates a task', async () => {
    const response = await request(app).post('/tasks').send({
      title: 'Build API',
      description: 'Write tests',
      priority: 'high',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: 'Build API',
      description: 'Write tests',
      priority: 'high',
      status: 'todo',
      completedAt: null,
    });
  });

  test('POST /tasks rejects an invalid payload', async () => {
    const response = await request(app).post('/tasks').send({
      title: '   ',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/title is required/);
  });

  test('PUT /tasks/:id updates an existing task', async () => {
    const task = await createTask({ title: 'Old' });

    const response = await request(app)
      .put(`/tasks/${task.id}`)
      .send({ title: 'New', priority: 'high' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: task.id,
      title: 'New',
      priority: 'high',
    });
  });

  test('PUT /tasks/:id rejects invalid data', async () => {
    const task = await createTask();

    const response = await request(app)
      .put(`/tasks/${task.id}`)
      .send({ priority: 'urgent' });

    expect(response.status).toBe(400);
  });

  test('PUT /tasks/:id returns 404 for an unknown task', async () => {
    const response = await request(app)
      .put('/tasks/missing-id')
      .send({ title: 'New' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Task not found');
  });

  test('DELETE /tasks/:id deletes an existing task', async () => {
    const task = await createTask();

    const response = await request(app).delete(`/tasks/${task.id}`);

    expect(response.status).toBe(204);
    expect(response.text).toBe('');
  });

  test('DELETE /tasks/:id returns 404 for an unknown task', async () => {
    const response = await request(app).delete('/tasks/missing-id');

    expect(response.status).toBe(404);
  });

  test('PATCH /tasks/:id/complete marks a task done and preserves priority', async () => {
    const task = await createTask({ priority: 'high' });

    const response = await request(app).patch(`/tasks/${task.id}/complete`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: task.id,
      status: 'done',
      priority: 'high',
    });
    expect(response.body.completedAt).toEqual(expect.any(String));
  });

  test('PATCH /tasks/:id/complete returns 404 for an unknown task', async () => {
    const response = await request(app).patch('/tasks/missing-id/complete');

    expect(response.status).toBe(404);
  });

  test('PATCH /tasks/:id/assign assigns a task', async () => {
    const task = await createTask();

    const response = await request(app)
      .patch(`/tasks/${task.id}/assign`)
      .send({ assignee: '  Yashwanth  ' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: task.id,
      assignee: 'Yashwanth',
    });
  });

  test('PATCH /tasks/:id/assign rejects an empty assignee', async () => {
    const task = await createTask();

    const response = await request(app)
      .patch(`/tasks/${task.id}/assign`)
      .send({ assignee: '   ' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/assignee is required/);
  });

  test('PATCH /tasks/:id/assign rejects a non-string assignee', async () => {
    const task = await createTask();

    const response = await request(app)
      .patch(`/tasks/${task.id}/assign`)
      .send({ assignee: 123 });

    expect(response.status).toBe(400);
  });

  test('PATCH /tasks/:id/assign returns 404 for an unknown task', async () => {
    const response = await request(app)
      .patch('/tasks/missing-id/assign')
      .send({ assignee: 'Alice' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Task not found');
  });

  test('PATCH /tasks/:id/assign returns 409 when already assigned', async () => {
    const task = await createTask();

    await request(app)
      .patch(`/tasks/${task.id}/assign`)
      .send({ assignee: 'Alice' });

    const response = await request(app)
      .patch(`/tasks/${task.id}/assign`)
      .send({ assignee: 'Bob' });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Task is already assigned');
  });
});
