# Submission Notes

## What I would test next

With more time, I would add tests for malformed JSON requests, unusual pagination values such as zero/negative numbers, very large limits, invalid date edge cases, repeated completion, concurrent updates, and persistence behavior if the application moves to a database.

I would also add an end-to-end smoke test against the deployed service and automate the test suite in CI.

## What surprised me

The API was small and easy to trace, but the lack of tests allowed several simple behavioral issues to remain unnoticed, especially the 1-based pagination bug.

I also found that the README contains status names that differ from the implementation, which is a useful example of why API documentation should be validated alongside code.

## Questions I would ask before production

1. Should pagination metadata be returned along with the task list, such as total count and total pages?
2. Should a task be allowed to change status or priority after completion?
3. Should assignees be represented by user IDs rather than display names?
4. Should an already-assigned task be rejected, reassigned, or require an explicit unassign operation?
5. What persistence, authentication, authorization, logging, rate limiting, and error-monitoring requirements are expected for production?
6. What is the expected contract for invalid pagination parameters and unknown query-string parameters?
