/**
 * Integration tests for the Task API routes.
 * Uses Supertest to exercise the full HTTP stack.
 */
const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

beforeEach(() => {
  taskService._reset();
});

// ─── GET /tasks ───────────────────────────────────────────────────────────────

describe('GET /tasks', () => {
  it('returns 200 and empty array when no tasks exist', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns all tasks', async () => {
    await request(app).post('/tasks').send({ title: 'A' });
    await request(app).post('/tasks').send({ title: 'B' });
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  // Edge: status filter
  it('filters by status=todo', async () => {
    await request(app).post('/tasks').send({ title: 'A' }); // default: todo
    await request(app).post('/tasks').send({ title: 'B', status: 'done' });
    const res = await request(app).get('/tasks?status=todo');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('A');
  });

  it('returns empty array for unrecognised status filter', async () => {
    await request(app).post('/tasks').send({ title: 'A' });
    const res = await request(app).get('/tasks?status=archived');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  // Edge: pagination
  it('paginates results – page 1 returns first batch', async () => {
    for (let i = 1; i <= 12; i++) {
      await request(app).post('/tasks').send({ title: `Task ${i}` });
    }
    const res = await request(app).get('/tasks?page=1&limit=10');
    expect(res.status).toBe(200);
    // After pagination fix: should return 10 items starting from Task 1
    expect(res.body).toHaveLength(10);
    expect(res.body[0].title).toBe('Task 1');
  });

  it('paginates results – page 2 returns remainder', async () => {
    for (let i = 1; i <= 12; i++) {
      await request(app).post('/tasks').send({ title: `Task ${i}` });
    }
    const res = await request(app).get('/tasks?page=2&limit=10');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].title).toBe('Task 11');
  });
});

// ─── GET /tasks/stats ─────────────────────────────────────────────────────────

describe('GET /tasks/stats', () => {
  it('returns zeroed stats when store is empty', async () => {
    const res = await request(app).get('/tasks/stats');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ todo: 0, in_progress: 0, done: 0, overdue: 0 });
  });

  it('reflects created tasks', async () => {
    await request(app).post('/tasks').send({ title: 'A' });
    await request(app).post('/tasks').send({ title: 'B', status: 'done' });
    const res = await request(app).get('/tasks/stats');
    expect(res.body.todo).toBe(1);
    expect(res.body.done).toBe(1);
  });

  it('counts overdue tasks correctly', async () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    await request(app).post('/tasks').send({ title: 'Overdue', dueDate: past });
    const res = await request(app).get('/tasks/stats');
    expect(res.body.overdue).toBe(1);
  });
});

// ─── POST /tasks ──────────────────────────────────────────────────────────────

describe('POST /tasks', () => {
  it('creates a task with only a title and returns 201', async () => {
    const res = await request(app).post('/tasks').send({ title: 'New task' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New task');
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('todo');
    expect(res.body.priority).toBe('medium');
  });

  it('creates a task with all optional fields', async () => {
    const payload = {
      title: 'Full task',
      description: 'Desc',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2025-12-31T00:00:00.000Z',
    };
    const res = await request(app).post('/tasks').send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(payload);
  });

  // Edge: validation errors
  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/tasks').send({ status: 'todo' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });

  it('returns 400 for invalid status', async () => {
    const res = await request(app).post('/tasks').send({ title: 'X', status: 'invalid' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/status/i);
  });

  it('returns 400 for invalid priority', async () => {
    const res = await request(app).post('/tasks').send({ title: 'X', priority: 'urgent' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/priority/i);
  });

  it('returns 400 for invalid dueDate', async () => {
    const res = await request(app).post('/tasks').send({ title: 'X', dueDate: 'not-a-date' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/dueDate/i);
  });

  it('returns 400 when title is empty string', async () => {
    const res = await request(app).post('/tasks').send({ title: '   ' });
    expect(res.status).toBe(400);
  });
});

// ─── PUT /tasks/:id ───────────────────────────────────────────────────────────

describe('PUT /tasks/:id', () => {
  let taskId;

  beforeEach(async () => {
    const res = await request(app).post('/tasks').send({ title: 'Original' });
    taskId = res.body.id;
  });

  it('updates the task and returns 200', async () => {
    const res = await request(app).put(`/tasks/${taskId}`).send({ title: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).put('/tasks/nonexistent-id').send({ title: 'X' });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('returns 400 for invalid update payload', async () => {
    const res = await request(app).put(`/tasks/${taskId}`).send({ title: '' });
    expect(res.status).toBe(400);
  });

  // Edge: updating status and priority
  it('can update status to a valid value', async () => {
    const res = await request(app).put(`/tasks/${taskId}`).send({ status: 'in_progress' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
  });
});

// ─── DELETE /tasks/:id ────────────────────────────────────────────────────────

describe('DELETE /tasks/:id', () => {
  it('deletes an existing task and returns 204', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Delete me' });
    const res = await request(app).delete(`/tasks/${created.body.id}`);
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('returns 404 for non-existent id', async () => {
    const res = await request(app).delete('/tasks/ghost-id');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('deleted task no longer appears in GET /tasks', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Gone' });
    await request(app).delete(`/tasks/${created.body.id}`);
    const all = await request(app).get('/tasks');
    expect(all.body).toHaveLength(0);
  });
});

// ─── PATCH /tasks/:id/complete ────────────────────────────────────────────────

describe('PATCH /tasks/:id/complete', () => {
  it('marks a task as done and sets completedAt', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Finish me' });
    const res = await request(app).patch(`/tasks/${created.body.id}/complete`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
    expect(res.body.completedAt).not.toBeNull();
  });

  it('returns 404 for non-existent id', async () => {
    const res = await request(app).patch('/tasks/fake-id/complete');
    expect(res.status).toBe(404);
  });

  it('BUG: should preserve priority when completing a task', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Urgent', priority: 'high' });
    const res = await request(app).patch(`/tasks/${created.body.id}/complete`);
    // Currently FAILS because completeTask resets priority to 'medium'
    expect(res.body.priority).toBe('high');
  });
});

// ─── PATCH /tasks/:id/assign ──────────────────────────────────────────────────

describe('PATCH /tasks/:id/assign', () => {
  let taskId;

  beforeEach(async () => {
    const res = await request(app).post('/tasks').send({ title: 'Assignable task' });
    taskId = res.body.id;
  });

  it('assigns a name and returns the updated task with 200', async () => {
    const res = await request(app)
      .patch(`/tasks/${taskId}/assign`)
      .send({ assignee: 'Alice' });
    expect(res.status).toBe(200);
    expect(res.body.assignee).toBe('Alice');
  });

  it('returns 404 for a non-existent task id', async () => {
    const res = await request(app)
      .patch('/tasks/no-such-id/assign')
      .send({ assignee: 'Bob' });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('returns 400 when assignee is missing', async () => {
    const res = await request(app).patch(`/tasks/${taskId}/assign`).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/assignee/i);
  });

  it('returns 400 when assignee is an empty string', async () => {
    const res = await request(app)
      .patch(`/tasks/${taskId}/assign`)
      .send({ assignee: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/assignee/i);
  });

  it('returns 400 when assignee is not a string', async () => {
    const res = await request(app)
      .patch(`/tasks/${taskId}/assign`)
      .send({ assignee: 42 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/assignee/i);
  });

  it('allows reassigning (overwriting an existing assignee)', async () => {
    await request(app).patch(`/tasks/${taskId}/assign`).send({ assignee: 'Alice' });
    const res = await request(app)
      .patch(`/tasks/${taskId}/assign`)
      .send({ assignee: 'Bob' });
    expect(res.status).toBe(200);
    expect(res.body.assignee).toBe('Bob');
  });

  it('persists the assignee in subsequent GET responses', async () => {
    await request(app).patch(`/tasks/${taskId}/assign`).send({ assignee: 'Carol' });
    const all = await request(app).get('/tasks');
    const found = all.body.find((t) => t.id === taskId);
    expect(found.assignee).toBe('Carol');
  });
});
