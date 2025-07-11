import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

export class MetricsService {
    private static instance: MetricsService;

    // HTTP Request Metrics
    public httpRequestDuration: Histogram<string>;
    public httpRequestsTotal: Counter<string>;
    public httpRequestsActive: Gauge<string>;

    // Auth Metrics
    public authAttemptsTotal: Counter<string>;
    public authSuccessTotal: Counter<string>;
    public authFailuresTotal: Counter<string>;

    // User Metrics
    public usersTotal: Gauge<string>;
    public usersActiveTotal: Gauge<string>;
    public userRegistrationsTotal: Counter<string>;

    // File Upload Metrics
    public fileUploadsTotal: Counter<string>;
    public fileUploadSize: Histogram<string>;

    // Database Metrics
    public databaseConnectionsActive: Gauge<string>;
    public databaseQueriesTotal: Counter<string>;
    public databaseQueryDuration: Histogram<string>;

    private constructor() {
        // Collect default metrics (CPU, memory, etc.)
        collectDefaultMetrics({ register });

        // HTTP Request Duration
        this.httpRequestDuration = new Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            registers: [register],
            buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
        });

        // HTTP Requests Total
        this.httpRequestsTotal = new Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code']
        });

        // HTTP Requests Active
        this.httpRequestsActive = new Gauge({
            name: 'http_requests_active',
            help: 'Number of active HTTP requests',
            labelNames: ['method', 'route']
        });

        // Auth Attempts Total
        this.authAttemptsTotal = new Counter({
            name: 'auth_attempts_total',
            help: 'Total number of authentication attempts',
            labelNames: ['type'] // login, register, refresh
        });

        // Auth Success Total
        this.authSuccessTotal = new Counter({
            name: 'auth_success_total',
            help: 'Total number of successful authentications',
            labelNames: ['type']
        });

        // Auth Failures Total
        this.authFailuresTotal = new Counter({
            name: 'auth_failures_total',
            help: 'Total number of failed authentications',
            labelNames: ['type', 'reason']
        });

        // Users Total
        this.usersTotal = new Gauge({
            name: 'users_total',
            help: 'Total number of users',
            labelNames: ['role', 'status']
        });

        // Users Active Total
        this.usersActiveTotal = new Gauge({
            name: 'users_active_total',
            help: 'Number of active users',
            labelNames: ['role']
        });

        // User Registrations Total
        this.userRegistrationsTotal = new Counter({
            name: 'user_registrations_total',
            help: 'Total number of user registrations',
            labelNames: ['role']
        });

        // File Uploads Total
        this.fileUploadsTotal = new Counter({
            name: 'file_uploads_total',
            help: 'Total number of file uploads',
            labelNames: ['type', 'status'] // profile_photo, document
        });

        // File Upload Size
        this.fileUploadSize = new Histogram({
            name: 'file_upload_size_bytes',
            help: 'Size of uploaded files in bytes',
            labelNames: ['type'],
            buckets: [1024, 10240, 102400, 1048576, 5242880, 10485760] // 1KB to 10MB
        });

        // Database Connections Active
        this.databaseConnectionsActive = new Gauge({
            name: 'database_connections_active',
            help: 'Number of active database connections'
        });

        // Database Queries Total
        this.databaseQueriesTotal = new Counter({
            name: 'database_queries_total',
            help: 'Total number of database queries',
            labelNames: ['operation'] // select, insert, update, delete
        });

        // Database Query Duration
        this.databaseQueryDuration = new Histogram({
            name: 'database_query_duration_seconds',
            help: 'Duration of database queries in seconds',
            labelNames: ['operation'],
            buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
        });

        // Register all metrics
        register.registerMetric(this.httpRequestDuration);
        register.registerMetric(this.httpRequestsTotal);
        register.registerMetric(this.httpRequestsActive);
        register.registerMetric(this.authAttemptsTotal);
        register.registerMetric(this.authSuccessTotal);
        register.registerMetric(this.authFailuresTotal);
        register.registerMetric(this.usersTotal);
        register.registerMetric(this.usersActiveTotal);
        register.registerMetric(this.userRegistrationsTotal);
        register.registerMetric(this.fileUploadsTotal);
        register.registerMetric(this.fileUploadSize);
        register.registerMetric(this.databaseConnectionsActive);
        register.registerMetric(this.databaseQueriesTotal);
        register.registerMetric(this.databaseQueryDuration);
    }

    public static getInstance(): MetricsService {
        if (!MetricsService.instance) {
            MetricsService.instance = new MetricsService();
        }
        return MetricsService.instance;
    }

    public getRegistry() {
        return register;
    }

    public async getMetrics(): Promise<string> {
        return await register.metrics();
    }

    // Helper methods for common operations
    public recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
        this.httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
        this.httpRequestsTotal.inc({ method, route, status_code: statusCode.toString() });
    }

    public recordAuthAttempt(type: 'login' | 'register' | 'refresh' | 'google_login' | 'apple_login') {
        this.authAttemptsTotal.inc({ type });
    }

    public recordAuthSuccess(type: 'login' | 'register' | 'refresh' | 'google_login' | 'apple_login') {
        this.authSuccessTotal.inc({ type });
    }

    public recordAuthFailure(type: 'login' | 'register' | 'refresh' | 'google_login' | 'apple_login', reason: string) {
        this.authFailuresTotal.inc({ type, reason });
    }

    public recordUserRegistration(role: string) {
        this.userRegistrationsTotal.inc({ role });
    }

    public recordFileUpload(type: 'profile_photo' | 'document', size: number, success: boolean) {
        this.fileUploadsTotal.inc({ type, status: success ? 'success' : 'failure' });
        if (success) {
            this.fileUploadSize.observe({ type }, size);
        }
    }

    public recordDatabaseQuery(operation: 'select' | 'insert' | 'update' | 'delete', duration: number) {
        this.databaseQueriesTotal.inc({ operation });
        this.databaseQueryDuration.observe({ operation }, duration);
    }
}

export const metricsService = MetricsService.getInstance(); 