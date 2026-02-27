# About Time - Monitoring & Performance

This directory contains monitoring and performance optimization configurations for the About Time application.

## Components

### 1. Prometheus
- **Metrics Collection**: Scrapes metrics from backend pods every 15s
- **Data Retention**: 30 days of metrics
- **Storage**: 30GB recommended for production

### 2. Grafana
- **Visualization**: Pre-built dashboard for API performance
- **Alerting**: Configured alerts for high latency and error rates

### 3. Redis Cache
- **Template Caching**: 1 hour TTL
- **Schedule Caching**: 5 minutes TTL
- **Target Hit Rate**: > 80%

## Quick Start

### Deploy Prometheus

```bash
kubectl apply -f prometheus-config.yaml
```

Verify deployment:
```bash
kubectl get pods -n about-time -l app=prometheus
kubectl logs -n about-time -l app=prometheus
```

Access Prometheus UI:
```bash
kubectl port-forward -n about-time svc/prometheus-service 9090:9090
# Open http://localhost:9090
```

### Deploy Grafana

```bash
# Add Grafana Helm repository
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install Grafana
helm install grafana grafana/grafana \
  --namespace about-time \
  --set persistence.enabled=true \
  --set persistence.size=10Gi \
  --set adminPassword='admin123' # Change this!

# Get admin password
kubectl get secret --namespace about-time grafana -o jsonpath="{.data.admin-password}" | base64 --decode

# Port forward
kubectl port-forward -n about-time svc/grafana 3000:80
# Open http://localhost:3000
```

### Import Dashboard

1. Login to Grafana (http://localhost:3000)
2. Navigate to **Dashboards → Import**
3. Upload `grafana-dashboard.json`
4. Select Prometheus as data source
5. Click Import

## Metrics Available

### HTTP Metrics

| Metric | Description | Labels |
|--------|-------------|--------|
| `http_requests_total` | Total HTTP requests | method, route, status_code |
| `http_request_duration_seconds` | Request duration histogram | method, route, status_code |
| `http_request_errors_total` | Total request errors | method, route, status_code |
| `active_connections` | Current active connections | - |

### Cache Metrics

| Metric | Description | Labels |
|--------|-------------|--------|
| `cache_hits_total` | Total cache hits | cache_key |
| `cache_misses_total` | Total cache misses | cache_key |

### Database Metrics

| Metric | Description | Labels |
|--------|-------------|--------|
| `database_query_duration_seconds` | Query duration histogram | operation |

### System Metrics

| Metric | Description |
|--------|-------------|
| `process_resident_memory_bytes` | Process memory usage |
| `nodejs_heap_size_used_bytes` | Node.js heap used |
| `nodejs_heap_size_total_bytes` | Node.js heap total |
| `nodejs_eventloop_lag_seconds` | Event loop lag |

## Querying Metrics

### Prometheus Queries

**Request rate (requests per second):**
```promql
rate(http_requests_total[5m])
```

**P95 latency:**
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) * 1000
```

**Error rate percentage:**
```promql
sum(rate(http_request_errors_total[5m])) / sum(rate(http_requests_total[5m])) * 100
```

**Cache hit rate:**
```promql
sum(rate(cache_hits_total[5m])) / (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m]))) * 100
```

**Top slowest endpoints:**
```promql
topk(10, histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) * 1000)
```

## Alerting

### Configured Alerts

**High Latency Alert:**
- Condition: P95 > 200ms for 5 minutes
- Severity: Warning
- Action: Check slow endpoints, review cache hit rate

**High Error Rate Alert:**
- Condition: Error rate > 1% for 5 minutes
- Severity: Critical
- Action: Check logs, verify database/Redis connectivity

**Low Cache Hit Rate:**
- Condition: Hit rate < 80% for 10 minutes
- Severity: Warning
- Action: Review cache TTLs, check Redis memory

### Configure Alert Notifications

**Slack:**
```bash
kubectl edit configmap -n about-time alertmanager-config
```

Add webhook:
```yaml
receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#alerts'
        text: '{{ .CommonAnnotations.description }}'
```

**Email:**
```yaml
receivers:
  - name: 'email'
    email_configs:
      - to: 'alerts@about-time.app'
        from: 'prometheus@about-time.app'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'your-email@gmail.com'
        auth_password: 'app-password'
```

## Performance Optimization

### 1. Cache Tuning

Monitor cache hit rate in Grafana. If < 80%:

```typescript
// Increase TTL in apps/backend/src/config/redis.ts
export const CACHE_TTL = {
  TEMPLATE: 7200, // 2 hours instead of 1
  TEMPLATES: 7200,
  // ...
};
```

### 2. Database Query Optimization

Identify slow queries:
```promql
histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m]))
```

Add indexes:
```sql
CREATE INDEX idx_templates_user_updated ON templates(user_id, updated_at DESC);
CREATE INDEX idx_templates_intent_search ON templates USING gin(to_tsvector('english', intent));
```

### 3. Connection Pool Tuning

Monitor active connections. If frequently at limit:

```typescript
// apps/backend/src/db/client.ts
const client = postgres(env.DATABASE_URL, {
  max: 30, // Increase from 20
});
```

### 4. Rate Limit Adjustment

If you implement rate limiting and legitimate users hit rate limits, adjust the configuration:

```typescript
// Example rate limit configuration (if implemented)
export const generalRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 200, // Increase from 100
});
```

**Note**: Rate limiting is not currently implemented in the application.

## Monitoring Best Practices

### 1. Set Baselines

After initial deployment, run load tests and record:
- Average P95 latency per endpoint
- Typical request rate
- Normal error rate
- Cache hit rate
- Memory usage patterns

### 2. Regular Reviews

Weekly:
- Review P95 latency trends
- Check error rate spikes
- Verify cache hit rates
- Review top slowest endpoints

Monthly:
- Review resource utilization trends
- Optimize underperforming queries
- Adjust cache TTLs based on patterns
- Update alerting thresholds

### 3. Incident Response

When alerts fire:

1. **Check Grafana dashboard** for recent changes
2. **Review logs**: `kubectl logs -n about-time -l app=backend --tail=100`
3. **Check resource usage**: `kubectl top pods -n about-time`
4. **Verify dependencies**: Database and Redis health
5. **Review recent deployments**: `kubectl rollout history -n about-time deployment/backend`

## Troubleshooting

### Prometheus Not Scraping

**Problem**: No metrics in Grafana

**Solution**:
```bash
# Check Prometheus targets
kubectl port-forward -n about-time svc/prometheus-service 9090:9090
# Visit http://localhost:9090/targets

# Verify backend pods expose metrics
kubectl exec -n about-time deploy/backend -- curl localhost:3001/metrics
```

### High Memory Usage

**Problem**: Node.js memory increasing over time

**Solution**:
```bash
# Check for memory leaks
kubectl exec -n about-time deploy/backend -- node --heap-snapshot

# Increase memory limits
kubectl edit deployment backend -n about-time
# Update: resources.limits.memory: "1Gi"
```

### Cache Not Working

**Problem**: Low cache hit rate

**Solution**:
```bash
# Verify Redis is accessible
kubectl exec -n about-time deploy/backend -- node -e "const Redis = require('ioredis'); const redis = new Redis(process.env.REDIS_URL); redis.ping().then(console.log)"

# Check Redis memory
kubectl exec -n about-time redis-0 -- redis-cli INFO memory

# Monitor cache operations
kubectl logs -n about-time -l app=backend | grep -i cache
```

## Production Checklist

- [ ] Prometheus deployed and scraping metrics
- [ ] Grafana dashboard imported and functional
- [ ] Alerting configured with notifications
- [ ] Baseline metrics recorded
- [ ] Cache hit rate > 80%
- [ ] P95 latency < 200ms
- [ ] Error rate < 1%
- [ ] Load tests passing
- [ ] Resource limits set appropriately
- [ ] Log aggregation configured

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Redis Best Practices](https://redis.io/docs/manual/performance/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
