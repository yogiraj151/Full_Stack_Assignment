/**
 * Unit tests for taskService.js
 * Tests all service functions directly (no HTTP layer).
 */
const taskService = require('../src/services/taskService');

beforeEach(() => {
  taskService._reset();
});

// ─── getAll ───────────────────────────────────────────────────────────────────

describe('getAll', () => {
  it('returns an empty array when no tasks exist', () => {
    expect(taskService.getAll()).toEqual([]);
  });

  it('returns all created tasks', () => {
    taskService.create({ title: 'Task A' });
    taskService.create({ title: 'Task B' });
    expect(taskService.getAll()).toHaveLength(2);
  });

  it('returns a copy – mutations do not affect the store', () => {
    taskService.create({ title: 'Task A' });
    const all = taskService.getAll();
    all.push({ id: 'fake' });
    expect(taskService.getAll()).toHaveLength(1);
  });
});

// ─── create ──────────────────────────────────────────────────────────────────

describe('create', () => {
  it('creates a task with required title and sensible defaults', () => {
    const task = taskService.create({ title: 'Buy milk' });
    expect(task).toMatchObject({
      title: 'Buy milk',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      completedAt: null,
    });
    expect(task.id).toBeDefined();
    expect(task.createdAt).toBeDefined();
  });

  it('accepts optional fields', () => {
    const task = taskService.create({
      title: 'Deploy',
      description: 'Deploy to prod',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2025-12-31T00:00:00.000Z',
    });
    expect(task.description).toBe('Deploy to prod');
    expect(task.status).toBe('in_progress');
    expect(task.priority).toBe('high');
    expect(task.dueDate).toBe('2025-12-31T00:00:00.000Z');
  });

  it('assigns a unique id to each task', () => {
    const t1 = taskService.create({ title: 'A' });
    const t2 = taskService.create({ title: 'B' });
    expect(t1.id).not.toBe(t2.id);
  });
});

// ─── findById ─────────────────────────────────────────────────────────────────

describe('findById', () => {
  it('returns the task when found', () => {
    const task = taskService.create({ title: 'Foo' });
    expect(taskService.findById(task.id)).toMatchObject({ title: 'Foo' });
  });

  it('returns undefined for a non-existent id', () => {
    expect(taskService.findById('does-not-exist')).toBeUndefined();
  });
});

// ─── getByStatus ──────────────────────────────────────────────────────────────

describe('getByStatus', () => {
  beforeEach(() => {
    taskService.create({ title: 'A', status: 'todo' });
    taskService.create({ title: 'B', status: 'in_progress' });
    taskService.create({ title: 'C', status: 'done' });
  });

  it('returns only tasks matching the exact status', () => {
    const todos = taskService.getByStatus('todo');
    expect(todos).toHaveLength(1);
    expect(todos[0].title).toBe('A');
  });

  it('does not return partial substring matches (BUG: uses .includes)', () => {
    // Searching "do" must NOT return "todo" tasks
    const results = taskService.getByStatus('do');
    // With the bug this returns both "todo" and "done"; correct behaviour = 0
    // This test documents the bug – it will FAIL until fixed.
    expect(results).toHaveLength(0);
  });

  it('returns empty array for unknown status', () => {
    expect(taskService.getByStatus('archived')).toHaveLength(0);
  });
});

// ─── getPaginated ─────────────────────────────────────────────────────────────

describe('getPaginated', () => {
  beforeEach(() => {
    for (let i = 1; i <= 15; i++) {
      taskService.create({ title: `Task ${i}` });
    }
  });

  it('page 1 with limit 10 returns first 10 tasks', () => {
    const page = taskService.getPaginated(1, 10);
    // BUG: offset = page * limit = 10, skips first page entirely
    // Correct: offset = (page - 1) * limit = 0
    expect(page).toHaveLength(10);
    expect(page[0].title).toBe('Task 1');
  });

  it('page 2 with limit 10 returns tasks 11-15', () => {
    const page = taskService.getPaginated(2, 10);
    expect(page).toHaveLength(5);
    expect(page[0].title).toBe('Task 11');
  });

  it('returns empty array when page is beyond range', () => {
    expect(taskService.getPaginated(99, 10)).toHaveLength(0);
  });
});

// ─── getStats ─────────────────────────────────────────────────────────────────

describe('getStats', () => {
  it('returns zero counts with empty store', () => {
    expect(taskService.getStats()).toEqual({
      todo: 0,
      in_progress: 0,
      done: 0,
      overdue: 0,
    });
  });

  it('counts tasks by status', () => {
    taskService.create({ title: 'A' }); // todo
    taskService.create({ title: 'B', status: 'in_progress' });
    taskService.create({ title: 'C', status: 'done' });
    const stats = taskService.getStats();
    expect(stats.todo).toBe(1);
    expect(stats.in_progress).toBe(1);
    expect(stats.done).toBe(1);
  });

  it('counts overdue non-done tasks', () => {
    const past = new Date(Date.now() - 86400000).toISOString(); // yesterday
    const future = new Date(Date.now() + 86400000).toISOString(); // tomorrow
    taskService.create({ title: 'Overdue', dueDate: past });
    taskService.create({ title: 'Not due yet', dueDate: future });
    taskService.create({ title: 'Done overdue', status: 'done', dueDate: past });
    expect(taskService.getStats().overdue).toBe(1);
  });
});

// ─── update ───────────────────────────────────────────────────────────────────

describe('update', () => {
  it('updates specified fields and returns the updated task', () => {
    const task = taskService.create({ title: 'Old title' });
    const updated = taskService.update(task.id, { title: 'New title' });
    expect(updated.title).toBe('New title');
    expect(updated.status).toBe('todo'); // unchanged
  });

  it('returns null for a non-existent id', () => {
    expect(taskService.update('no-such-id', { title: 'X' })).toBeNull();
  });

  it('persists the update in the store', () => {
    const task = taskService.create({ title: 'Old' });
    taskService.update(task.id, { title: 'Updated' });
    expect(taskService.findById(task.id).title).toBe('Updated');
  });
});

// ─── remove ───────────────────────────────────────────────────────────────────

describe('remove', () => {
  it('removes an existing task and returns true', () => {
    const task = taskService.create({ title: 'Temporary' });
    expect(taskService.remove(task.id)).toBe(true);
    expect(taskService.getAll()).toHaveLength(0);
  });

  it('returns false for a non-existent id', () => {
    expect(taskService.remove('ghost-id')).toBe(false);
  });
});

// ─── completeTask ─────────────────────────────────────────────────────────────

describe('completeTask', () => {
  it('sets status to done and sets completedAt', () => {
    const task = taskService.create({ title: 'Finish me' });
    const completed = taskService.completeTask(task.id);
    expect(completed.status).toBe('done');
    expect(completed.completedAt).not.toBeNull();
  });

  it('returns null for a non-existent id', () => {
    expect(taskService.completeTask('no-id')).toBeNull();
  });

  it('BUG: does not silently reset priority to medium', () => {
    // A high-priority task should stay high after being marked complete.
    const task = taskService.create({ title: 'Urgent', priority: 'high' });
    const completed = taskService.completeTask(task.id);
    // This FAILS with current code because completeTask hardcodes priority:'medium'
    expect(completed.priority).toBe('high');
  });
});
