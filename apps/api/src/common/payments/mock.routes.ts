import crypto from 'crypto';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface MockOrderStore {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: 'created' | 'attempted' | 'paid';
  createdAt: number;
}

// In-memory ledger of mock orders and payments for zero-dependency local simulation
const mockOrders = new Map<string, MockOrderStore>();

export async function mockGatewayRoutes(fastify: FastifyInstance) {
  // 1. Order Creation Endpoint (Mimics POST https://api.razorpay.com/v1/orders)
  fastify.post('/v1/orders', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = (request.body as any) || {};
    const amount = Number(body.amount) || 1000;
    const currency = body.currency || 'INR';
    const receipt = body.receipt || `rcpt_${Date.now()}`;

    const orderId = 'order_' + crypto.randomBytes(8).toString('hex');
    const newOrder: MockOrderStore = {
      id: orderId,
      amount,
      currency,
      receipt,
      status: 'created',
      createdAt: Math.floor(Date.now() / 1000),
    };

    mockOrders.set(orderId, newOrder);

    return reply.status(200).send({
      id: newOrder.id,
      entity: 'order',
      amount: newOrder.amount,
      amount_paid: 0,
      amount_due: newOrder.amount,
      currency: newOrder.currency,
      receipt: newOrder.receipt,
      status: newOrder.status,
      attempts: 0,
      notes: body.notes || {},
      created_at: newOrder.createdAt,
    });
  });

  // 2. Order Inspection Endpoint (Mimics GET https://api.razorpay.com/v1/orders/:id)
  fastify.get('/v1/orders/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const order = mockOrders.get(request.params.id);
    if (!order) {
      return reply.status(404).send({ error: { code: 'BAD_REQUEST_ERROR', description: 'Order not found' } });
    }
    return reply.status(200).send(order);
  });

  // 3. Payment Capture / Simulation Endpoint (Mimics POST https://api.razorpay.com/v1/payments/:id/capture)
  fastify.post('/v1/payments/:id/capture', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const paymentId = request.params.id;
    return reply.status(200).send({
      id: paymentId,
      entity: 'payment',
      status: 'captured',
      captured: true,
    });
  });
}
