# Load Testing for About Time API

This directory contains load testing scripts for performance testing the About Time API.

## Prerequisites

### Install k6

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows:**
```bash
choco install k6
```

**Docker:**
```bash
docker pull grafana/k6
```

## Running Load Tests

### Basic Run

Test against local development server:
```bash
k6 run api-load-test.js
```

### Custom Configuration

Specify number of virtual users and duration:
```bash
# 50 users for 2 minutes
k6 run --vus 50 --duration 2m api-load-test.js

# 100 users for 5 minutes
k6 run --vus 100 --duration 5m api-load-test.js
```

### Test Against Production

```bash
k6 run --env API_URL=https://api.about-time.app api-load-test.js
```

### With Results Output

Save results to JSON:
```bash
k6 run --out json=results.json api-load-test.js
```

Save results to InfluxDB (for Grafana visualization):
```bash
k6 run --out influxdb=http://localhost:8086/k6 api-load-test.js
```

## Test Scenarios

The load test script includes 5 scenarios:

1. **Health Check** - Verify server is responsive
2. **Auth - Get Current User** - Test authenticated endpoints
3. **Templates - List** - Test read performance with caching
4. **Templates - Create** - Test write performance
5. **Schedule - Get Goals** - Test schedule endpoints

## Load Test Stages

The default test configuration uses these stages:

1. **Ramp Up (30s)**: 0 → 10 users
2. **Ramp Up (1m)**: 10 → 50 users
3. **Sustain (2m)**: 50 users (steady state)
4. **Ramp Up (1m)**: 50 → 100 users
5. **Sustain (2m)**: 100 users (peak load)
6. **Ramp Down (30s)**: 100 → 0 users

Total duration: ~7 minutes

## Performance Thresholds

The test enforces these thresholds:

- **P95 Latency**: < 200ms (95th percentile)
- **P99 Latency**: < 500ms (99th percentile)
- **Error Rate**: < 1%

If thresholds are not met, k6 will exit with a non-zero status code.

## Interpreting Results

### Summary Output

After the test completes, k6 displays a summary:

```
checks.........................: 100.00% ✓ 5000      ✗ 0
data_received..................: 1.2 MB  173 kB/s
data_sent......................: 450 kB  64 kB/s
http_req_duration..............: avg=45ms  min=10ms med=40ms max=200ms p(90)=80ms p(95)=120ms
http_req_failed................: 0.00%   ✓ 0        ✗ 5000
http_reqs......................: 5000    714/s
iteration_duration.............: avg=5.5s  min=5s   med=5.5s max=6s
iterations.....................: 1000    142/s
vus............................: 1       min=1      max=100
vus_max........................: 100     min=100    max=100
```

### Key Metrics

- **http_req_duration**: Response time (check p95 and p99)
- **http_req_failed**: Error rate (should be < 1%)
- **http_reqs**: Requests per second (throughput)
- **checks**: Success rate of assertions
- **vus**: Number of concurrent virtual users

### Success Criteria

✅ **Pass** if:
- P95 latency < 200ms
- P99 latency < 500ms
- Error rate < 1%
- All checks pass > 99%

❌ **Fail** if:
- Latency thresholds exceeded
- Error rate > 1%
- Server returns 500 errors
- Checks fail > 1%

## Performance Targets

Based on the plan requirements:

| Metric | Target | Measured |
|--------|--------|----------|
| Concurrent Users | 1000+ | Test with 100 |
| Template Read P95 | < 200ms | To be measured |
| Template Create P95 | < 100ms | To be measured |
| Execute Update P95 | < 50ms | To be measured |
| Cache Hit Rate | > 80% | Check Prometheus |

## Monitoring During Tests

### Watch Real-Time Metrics

In another terminal, watch Prometheus metrics:
```bash
watch -n 1 'curl -s http://localhost:3001/metrics | grep http_request'
```

### Watch Redis Cache Stats

```bash
docker exec about-time-redis redis-cli INFO stats
```

### Watch Database Connections

```bash
docker exec about-time-postgres psql -U postgres -d about_time -c "SELECT * FROM pg_stat_activity WHERE datname = 'about_time';"
```

## Optimizing Performance

If tests fail, try these optimizations:

### 1. Increase Database Connection Pool

Edit `apps/backend/src/db/client.ts`:
```typescript
export const db = drizzle(client, {
  schema,
  logger: false, // Disable logging in production
});
```

### 2. Optimize Redis Cache TTL

Edit `apps/backend/src/config/redis.ts`:
```typescript
export const CACHE_TTL = {
  TEMPLATE: 7200, // Increase to 2 hours
  // ...
};
```

### 3. Add Database Indexes

Run migrations to add indexes on frequently queried fields.

### 4. Enable Redis Persistence

Update `redis-deployment.yaml` to use PersistentVolumeClaim instead of emptyDir.

### 5. Scale Backend Pods

```bash
kubectl scale deployment backend -n about-time --replicas=10
```

## Continuous Load Testing

### CI/CD Integration

Add to `.github/workflows/performance.yml`:

```yaml
name: Performance Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run load test
        run: |
          cd scripts/load-tests
          k6 run --out json=results.json api-load-test.js

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: k6-results
          path: scripts/load-tests/results.json
```

## Troubleshooting

### Connection Refused

**Problem**: k6 cannot connect to API

**Solution**:
- Verify server is running: `curl http://localhost:3001/health`
- Check firewall settings
- Use correct API_URL environment variable

### High Error Rate

**Problem**: > 1% requests failing

**Solutions**:
- Check server logs: `kubectl logs -n about-time -l app=backend`
- Verify database is responsive
- Check Redis is running
- Review rate limiting configuration

### Slow Response Times

**Problem**: P95 > 200ms

**Solutions**:
- Enable Redis caching (should be enabled by default)
- Check database query performance
- Add database indexes
- Scale backend pods
- Profile slow endpoints with Prometheus

### Memory Issues

**Problem**: Out of memory errors during test

**Solutions**:
- Reduce number of VUs
- Increase pod memory limits
- Check for memory leaks with profiling
- Optimize database queries

## Next Steps

After load testing:

1. ✅ Identify bottlenecks from metrics
2. ✅ Optimize slow endpoints
3. ✅ Adjust cache TTLs based on hit rates
4. ✅ Scale resources as needed
5. ✅ Set up alerting for performance degradation
6. ✅ Schedule regular performance tests
7. ✅ Document performance baselines

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Test Types](https://k6.io/docs/test-types/introduction/)
- [k6 Metrics](https://k6.io/docs/using-k6/metrics/)
- [Prometheus + Grafana Setup](https://grafana.com/docs/grafana/latest/getting-started/)
