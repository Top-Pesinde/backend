import { Router, Request, Response } from 'express';
import { metricsService } from '../services/metricsService';

const router = Router();

// GET /metrics - Prometheus metrics endpoint
router.get('/metrics', async (req: Request, res: Response) => {
    try {
        const metrics = await metricsService.getMetrics();
        res.set('Content-Type', metricsService.getRegistry().contentType);
        res.end(metrics);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch metrics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// GET /health - Health check endpoint for monitoring
router.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Service is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

export { router as metricsRoutes }; 