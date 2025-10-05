/**
 * API Route to fetch available token addresses
 * Reads from trade-data topic to get unique tokens
 */

import { Kafka } from 'kafkajs';
import { NextResponse } from 'next/server';

const kafka = new Kafka({
  clientId: 'trading-dashboard-tokens',
  brokers: ['localhost:19092'],
});

/**
 * GET handler to retrieve list of all unique tokens
 */
export async function GET() {
  const consumer = kafka.consumer({ groupId: 'token-fetcher' });

  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'trade-data', fromBeginning: true });

    const tokens = new Set<string>();
    const maxMessages = 100; // Limit how many messages to read
    let messageCount = 0;

    // Read messages to extract unique tokens
    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;

        try {
          const trade = JSON.parse(message.value.toString());
          if (trade.token_address) {
            tokens.add(trade.token_address);
          }

          messageCount++;
          
          // Stop after reading enough messages
          if (messageCount >= maxMessages) {
            await consumer.disconnect();
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      },
    });

    // Convert Set to Array
    const tokenList = Array.from(tokens);

    return NextResponse.json({ tokens: tokenList });

  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  } finally {
    await consumer.disconnect().catch(console.error);
  }
}