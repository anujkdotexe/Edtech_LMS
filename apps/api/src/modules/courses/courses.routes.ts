import { FastifyInstance } from 'fastify';
import { CoursesController } from './courses.controller';
import { verifyJWT, checkRole } from '../auth/auth.middleware';
import * as schemas from '../../schemas';

export async function coursesRoutes(fastify: FastifyInstance) {
  // Public / student catalog
  fastify.get('/', { schema: schemas.coursesSchema }, CoursesController.getAllCourses);
  fastify.get('/:id', { schema: schemas.courseByIdSchema }, CoursesController.getCourseById);
  
  // Student interactions
  fastify.post('/:id/purchase', { schema: schemas.purchaseCourseSchema, preHandler: [verifyJWT] }, CoursesController.purchaseCourse);
  fastify.post('/lessons/:id/complete', { schema: schemas.completeLessonSchema, preHandler: [verifyJWT] }, CoursesController.completeLesson);

  // Admin management
  fastify.post('/', { schema: schemas.createCourseSchema, preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])] }, CoursesController.createCourse);
  fastify.put('/:id', { schema: schemas.updateCourseSchema, preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])] }, CoursesController.updateCourse);
  fastify.delete('/:id', { schema: schemas.deleteCourseSchema, preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])] }, CoursesController.deleteCourse);
}
