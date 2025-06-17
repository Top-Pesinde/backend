import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metricsService';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Extract route pattern (remove query params and IDs)
    const route = req.route ? req.route.path : req.path;
    const cleanRoute = route.replace(/\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '/:id');

    // Track active requests
    metricsService.httpRequestsActive.inc({ method: req.method, route: cleanRoute });

    // Hook into response finish event
    res.on('finish', () => {
        const duration = (Date.now() - startTime) / 1000; // Convert to seconds

        // Record metrics
        metricsService.recordHttpRequest(req.method, cleanRoute, res.statusCode, duration);

        // Decrease active requests counter
        metricsService.httpRequestsActive.dec({ method: req.method, route: cleanRoute });
    });

    next();
}; 