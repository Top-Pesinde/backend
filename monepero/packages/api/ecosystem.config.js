module.exports = {
    apps: [
        {
            name: 'backend-api',
            script: 'npm',
            args: 'run dev',
            cwd: '/root/backend',
            instances: 1,
            exec_mode: 'fork',
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development',
                PORT: 3000,
                DATABASE_URL: 'postgresql://postgres:postgres123@localhost:5432/express_api_db?schema=public',
                JWT_SECRET: 'your-secret-key',
                JWT_EXPIRES_IN: '15m',
                JWT_REFRESH_EXPIRES_IN: '7d',
                MINIO_ENDPOINT: 'localhost',
                MINIO_PORT: '9000',
                MINIO_USE_SSL: 'false',
                MINIO_ACCESS_KEY: 'minioadmin',
                MINIO_SECRET_KEY: 'minioadmin123',
                MINIO_PUBLIC_URL: 'http://176.96.131.222:9000'
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000,
                DATABASE_URL: 'postgresql://postgres:postgres123@localhost:5432/express_api_db?schema=public',
                JWT_SECRET: 'your-secret-key',
                JWT_EXPIRES_IN: '15m',
                JWT_REFRESH_EXPIRES_IN: '7d',
                MINIO_ENDPOINT: 'localhost',
                MINIO_PORT: '9000',
                MINIO_USE_SSL: 'false',
                MINIO_ACCESS_KEY: 'minioadmin',
                MINIO_SECRET_KEY: 'minioadmin123',
                MINIO_PUBLIC_URL: 'http://176.96.131.222:9000'
            },
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            error_file: './logs/err.log',
            out_file: './logs/out.log',
            log_file: './logs/combined.log',
            time: true
        }
    ]
}; 