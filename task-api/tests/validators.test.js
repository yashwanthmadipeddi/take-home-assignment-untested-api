const {
  validateCreateTask,
  validateUpdateTask,
  validateAssignTask,
} = require('../src/utils/validators');

describe('validators', () => {
  describe('validateCreateTask', () => {
    test('accepts a valid payload', () => {
      expect(
        validateCreateTask({
          title: 'Valid task',
          status: 'todo',
          priority: 'high',
          dueDate: '2030-01-01T00:00:00.000Z',
        }),
      ).toBeNull();
    });

    test.each([
      [{}, 'title is required and must be a non-empty string'],
      [{ title: '' }, 'title is required and must be a non-empty string'],
      [{ title: '   ' }, 'title is required and must be a non-empty string'],
      [{ title: 123 }, 'title is required and must be a non-empty string'],
    ])('rejects invalid title: %o', (payload, message) => {
      expect(validateCreateTask(payload)).toBe(message);
    });

    test('rejects invalid status', () => {
      expect(validateCreateTask({ title: 'Task', status: 'pending' })).toMatch(
        /status must be one of/,
      );
    });

    test('rejects invalid priority', () => {
      expect(validateCreateTask({ title: 'Task', priority: 'urgent' })).toMatch(
        /priority must be one of/,
      );
    });

    test('rejects an invalid due date', () => {
      expect(validateCreateTask({ title: 'Task', dueDate: 'not-a-date' })).toBe(
        'dueDate must be a valid ISO date string',
      );
    });
  });

  describe('validateUpdateTask', () => {
    test('accepts an empty update payload', () => {
      expect(validateUpdateTask({})).toBeNull();
    });

    test('rejects an empty title', () => {
      expect(validateUpdateTask({ title: '   ' })).toBe(
        'title must be a non-empty string',
      );
    });

    test('rejects invalid status and priority', () => {
      expect(validateUpdateTask({ status: 'pending' })).toMatch(
        /status must be one of/,
      );
      expect(validateUpdateTask({ priority: 'urgent' })).toMatch(
        /priority must be one of/,
      );
    });

    test('rejects an invalid due date', () => {
      expect(validateUpdateTask({ dueDate: 'bad' })).toBe(
        'dueDate must be a valid ISO date string',
      );
    });
  });

  describe('validateAssignTask', () => {
    test('accepts a non-empty assignee name', () => {
      expect(validateAssignTask({ assignee: 'Alice' })).toBeNull();
    });

    test.each([
      [{}],
      [{ assignee: '' }],
      [{ assignee: '   ' }],
      [{ assignee: 123 }],
      [{ assignee: null }],
    ])('rejects invalid assignee: %o', (payload) => {
      expect(validateAssignTask(payload)).toBe(
        'assignee is required and must be a non-empty string',
      );
    });
  });
});
