import { FastifyRequest, FastifyReply } from 'fastify';
import { QuizzesService } from './quizzes.service';
import { handleControllerError, sendSuccess } from '../../utils/response';

export class QuizzesController {
  static async getAllQuizzes(request: FastifyRequest, reply: FastifyReply) {
    const requestedLocale = (request.headers['accept-language'] || 'en')
      .split(',')[0]
      .trim()
      .substring(0, 2);

    try {
      const quizzes = await QuizzesService.getAllQuizzes(requestedLocale);
      return sendSuccess(reply, quizzes);
    } catch (error) {
      return handleControllerError(reply, error, 'Could not fetch quizzes');
    }
  }

  static async getQuizQuestions(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User context is missing' });
    }

    const { id } = request.params as { id: string };
    const requestedLocale = (request.headers['accept-language'] || 'en')
      .split(',')[0]
      .trim()
      .substring(0, 2);

    try {
      const quiz = await QuizzesService.getQuizQuestions(id, requestedLocale);
      return sendSuccess(reply, quiz);
    } catch (error) {
      return handleControllerError(reply, error, 'Could not fetch quiz questions');
    }
  }

  static async submitQuizAnswers(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User context is missing' });
    }

    const { id } = request.params as { id: string };
    const { answers } = (request.body as { answers?: Array<{ questionId: string; selectedOption: string }> }) || {};

    if (!answers || !Array.isArray(answers)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Submissions answers list is required',
      });
    }

    try {
      const result = await QuizzesService.submitQuizAnswers({
        quizId: id,
        userId: request.user.userId,
        answers,
        ip: request.ip,
        impersonatedBy: request.user.impersonatedBy,
      });

      return sendSuccess(reply, result);
    } catch (error) {
      return handleControllerError(reply, error, 'Quiz submission failed');
    }
  }
}
