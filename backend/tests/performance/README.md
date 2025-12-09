# Performance Tests

This directory contains performance tests for the Todo backend API endpoints.

## Test Categories

### Response Time Tests
- Tests individual endpoint response times
- Verifies endpoints meet performance thresholds
- Tests various operations: GET, POST, PUT, DELETE, bulk operations

### Concurrent Request Tests
- Tests API performance under concurrent load
- Simulates multiple users accessing the API simultaneously
- Measures average and maximum response times

### Large Dataset Tests
- Tests performance with large datasets
- Verifies pagination and filtering performance
- Ensures reasonable response times for complex queries

## Performance Thresholds

- **GET /api/{user_id}/tasks**: < 500ms
- **POST /api/{user_id}/tasks**: < 1000ms
- **GET /api/{user_id}/tasks/{id}**: < 500ms
- **PUT /api/{user_id}/tasks/{id}**: < 1000ms
- **DELETE /api/{user_id}/tasks/{id}**: < 1000ms
- **POST /api/{user_id}/tasks/bulk**: < 2000ms
- **GET /api/{user_id}/tasks/export**: < 2000ms
- **GET /api/{user_id}/tasks/statistics**: < 1000ms
- **Concurrent requests (avg)**: < 1000ms
- **Large dataset queries**: < 1500ms

## Running Tests

```bash
# Run all performance tests
uv run pytest tests/performance/ -v

# Run specific performance test
uv run pytest tests/performance/test_performance.py::TestPerformance::test_get_tasks_performance -v

# Run with performance reporting
uv run pytest tests/performance/ --durations=10
```

## Monitoring Performance

Performance tests should be run regularly to:
- Catch performance regressions early
- Ensure API remains responsive under load
- Validate database query optimizations
- Monitor resource usage patterns