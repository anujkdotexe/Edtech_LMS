import { FastifyInstance } from 'fastify';
import { DevController } from './dev.controller';
import { verifyJWT, checkRole } from '../auth/auth.middleware';
import * as schemas from '../../schemas';

export async function devRoutes(fastify: FastifyInstance) {
  // Impersonation
  fastify.post('/impersonate', {
    schema: schemas.devImpersonateSchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
  }, DevController.impersonate);

  fastify.post('/unimpersonate', {
    schema: schemas.devUnimpersonateSchema,
    preHandler: [verifyJWT],
  }, DevController.unimpersonate);

  // Monitoring
  fastify.get('/monitoring/logs', {
    schema: schemas.devLogsSchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
  }, DevController.getAuditLogs);

  fastify.get('/monitoring/health', {
    schema: schemas.devHealthSchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
  }, DevController.getSystemHealth);

  fastify.post('/monitoring/override', {
    schema: schemas.devOverrideSchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
  }, DevController.adminOverride);

  fastify.get('/monitoring/advanced-logs', {
    schema: schemas.devAdvancedLogsSchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
  }, DevController.getAdvancedLogs);

  // Feature Flags
  fastify.get('/feature-flags', {
    schema: schemas.getFeatureFlagsSchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
  }, DevController.getFeatureFlags);

  fastify.post('/feature-flags/toggle', {
    schema: schemas.toggleFeatureFlagSchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
  }, DevController.toggleFeatureFlag);

  // Cache Inspector
  fastify.get('/cache', {
    schema: schemas.getCacheKeysSchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
  }, DevController.getCacheKeys);

  fastify.delete('/cache/:key', {
    schema: schemas.deleteCacheKeySchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
  }, DevController.deleteCacheKey);

  // Reconciliation & Queue
  fastify.get('/reconciliation', {
    schema: schemas.getReconciliationSchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
  }, DevController.getReconciliationReport);

  fastify.get('/queue', {
    schema: schemas.getQueueMonitorSchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
  }, DevController.getQueueMonitor);
}
