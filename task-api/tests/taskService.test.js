const taskService = require('../src/services/taskService');

describe('taskService', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('create creates a task with defaults', () => {
    const task = taskService.create({ title: 'Learn Jest' });

    expect(task).toMatchObject({
      title: 'Learn Jest',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      completedAt: null,
    });
    expect(task.id).toEqual(expect.any(String));
    expect(task.createdAt).toEqual(expect.any(String));
  });

  test('create stores supplied fields', () => {
    const task = taskService.create({
      title: 'Deploy app',
      description: 'Deploy to Render',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2030-01-01T00:00:00.000Z',
    });

    expect(task).toMatchObject({
      title: 'Deploy app',
      description: 'Deploy to Render',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2030-01-01T00:00:00.000Z',
    });
  });

  test('getAll returns created tasks', () => {
    taskService.create({ title: 'A' });
    taskService.create({ title: 'B' });

    expect(taskService.getAll()).toHaveLength(2);
  });

  test('findById returns the task or undefined', () => {
    const task = taskService.create({ title: 'Find me' });

    expect(taskService.findById(task.id)).toEqual(task);
    expect(taskService.findById('missing-id')).toBeUndefined();
  });

  test('getByStatus performs exact matching', () => {
    const todo = taskService.create({ title: 'Todo', status: 'todo' });
    taskService.create({ title: 'In progress', status: 'in_progress' });

    expect(taskService.getByStatus('todo')).toEqual([todo]);
  });

  test('getPaginated uses 1-based page numbers', () => {
    ['A', 'B', 'C', 'D', 'E'].forEach((title) => {
      taskService.create({ title });
    });

    expect(taskService.getPaginated(1, 2).map((t) => t.title)).toEqual(['A', 'B']);
    expect(taskService.getPaginated(2, 2).map((t) => t.title)).toEqual(['C', 'D']);
    expect(taskService.getPaginated(3, 2).map((t) => t.title)).toEqual(['E']);
  });

  test('getStats counts statuses and overdue tasks', () => {
    taskService.create({
      title: 'Todo',
      status: 'todo',
      dueDate: '2000-01-01T00:00:00.000Z',
    });
    taskService.create({ title: 'Progress', status: 'in_progress' });
    taskService.create({
      title: 'Done',
      status: 'done',
      dueDate: '2000-01-01T00:00:00.000Z',
    });
    taskService.create({ title: 'Future', dueDate: '2099-01-01T00:00:00.000Z' });

    expect(taskService.getStats()).toEqual({
      todo: 2,
      in_progress: 1,
      done: 1,
      overdue: 1,
    });
  });

  test('update changes an existing task', () => {
    const task = taskService.create({ title: 'Old title' });

    const updated = taskService.update(task.id, {
      title: 'New title',
      priority: 'high',
    });

    expect(updated).toMatchObject({
      id: task.id,
      title: 'New title',
      priority: 'high',
    });
    expect(taskService.findById(task.id)).toEqual(updated);
  });

  test('update returns null for an unknown task', () => {
    expect(taskService.update('missing-id', { title: 'New' })).toBeNull();
  });

  test('remove deletes an existing task', () => {
    const task = taskService.create({ title: 'Delete me' });

    expect(taskService.remove(task.id)).toBe(true);
    expect(taskService.findById(task.id)).toBeUndefined();
  });

  test('remove returns false for an unknown task', () => {
    expect(taskService.remove('missing-id')).toBe(false);
  });

  test('completeTask marks a task done and preserves priority', () => {
    const task = taskService.create({
      title: 'Complete me',
      priority: 'high',
    });

    const completed = taskService.completeTask(task.id);

    expect(completed.status).toBe('done');
    expect(completed.priority).toBe('high');
    expect(completed.completedAt).toEqual(expect.any(String));
  });

  test('completeTask returns null for an unknown task', () => {
    expect(taskService.completeTask('missing-id')).toBeNull();
  });

  test('assignTask assigns an unassigned task', () => {
    const task = taskService.create({ title: 'Assign me' });

    const result = taskService.assignTask(task.id, 'Yashwanth');

    expect(result.error).toBeNull();
    expect(result.task).toMatchObject({
      id: task.id,
      assignee: 'Yashwanth',
    });
  });

  test('assignTask rejects a task that is already assigned', () => {
    const task = taskService.create({ title: 'Already assigned' });
    taskService.assignTask(task.id, 'Alice');

    const result = taskService.assignTask(task.id, 'Bob');

    expect(result).toEqual({
      task: null,
      error: 'already_assigned',
    });
    expect(taskService.findById(task.id).assignee).toBe('Alice');
  });

  test('assignTask reports an unknown task', () => {
    expect(taskService.assignTask('missing-id', 'Alice')).toEqual({
      task: null,
      error: 'not_found',
    });
  });
});
