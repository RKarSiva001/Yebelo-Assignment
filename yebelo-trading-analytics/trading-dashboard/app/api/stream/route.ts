/**
 * API Route for Server-Sent Events (SSE) streaming from Redpanda
 * This endpoint streams real-time RSI data to the frontend
 */

import { Kafka } from 'kafkajs';
import { NextRequest } from 'next/server';

// Kafka client configuration
const kafka = new Kafka({
  clientId: 'trading-dashboard',
  brokers: ['localhost:19092'],
});

/**
 * GET handler for SSE streaming
 * Creates a real-time connection that pushes RSI data to clients
 */
export async function GET(request: NextRequest) {
  // Get token filter from query params
  const searchParams = request.nextUrl.searchParams;
  const selectedToken = searchParams.get('token') || 'all';

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      // Create Kafka consumer
      const consumer = kafka.consumer({ groupId: 'dashboard-consumer' });

      try {
        // Connect to Kafka/Redpanda
        await consumer.connect();
        
        // Subscribe to rsi-data topic
        await consumer.subscribe({ 
          topic: 'rsi-data', 
          fromBeginning: false // Only get new messages
        });

        console.log('✅ Dashboard connected to Redpanda');

        // Process messages
        await consumer.run({
          eachMessage: async ({ topic, partition, message }) => {
            try {
              if (!message.value) return;

              // Parse RSI message
              const rsiData = JSON.parse(message.value.toString());

              // Filter by token if specified
              if (selectedToken !== 'all' && rsiData.token_address !== selectedToken) {
                return;
              }

              // Send data to client via SSE
              const sseData = `data: ${JSON.stringify(rsiData)}\n\n`;
              controller.enqueue(new TextEncoder().encode(sseData));

            } catch (err) {
              console.error('Error processing message:', err);
            }
          },
        });

      } catch (error) {
        console.error('Kafka error:', error);
        controller.error(error);
      }

      // Cleanup on connection close
      request.signal.addEventListener('abort', async () => {
        console.log('🔌 Client disconnected');
        await consumer.disconnect();
        controller.close();
      });
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}