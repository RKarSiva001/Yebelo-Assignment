#!/usr/bin/env python3
"""
Data Ingestion Script for Pump.fun Trading Data
Reads CSV file and publishes each trade to Redpanda
"""

import csv
import json
import time
from kafka import KafkaProducer
from datetime import datetime
import sys

# Configuration
REDPANDA_BROKER = 'localhost:19092'  # External port for host access
TOPIC_NAME = 'trade-data'
CSV_FILE = 'trades_data.csv'

def create_producer():
    """
    Create and configure Kafka producer for Redpanda
    
    Returns:
        KafkaProducer: Configured producer instance
    """
    try:
        producer = KafkaProducer(
            # Connect to Redpanda broker
            bootstrap_servers=[REDPANDA_BROKER],
            
            # Serialize messages as JSON
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            
            # Wait for acknowledgment from broker (ensures message is written)
            acks='all',
            
            # Retry configuration
            retries=3,
            
            # Compression to reduce network bandwidth
            compression_type='gzip',
            
            # Batch settings for performance
            linger_ms=10,  # Wait 10ms to batch messages
            batch_size=16384  # 16KB batch size
        )
        
        print(f"✅ Successfully connected to Redpanda at {REDPANDA_BROKER}")
        return producer
        
    except Exception as e:
        print(f"❌ Failed to create producer: {e}")
        sys.exit(1)

def parse_csv_row(row):
    """
    Convert CSV row to structured JSON message
    
    Args:
        row (dict): CSV row as dictionary
        
    Returns:
        dict: Structured trade message
    """
    try:
        # Convert numeric fields to appropriate types
        trade_message = {
            'block_time': row['block_time'],
            'transaction_signature': row['transaction_signature'],
            'block_num': int(row['block_num']) if row['block_num'] else None,
            'program_id': row['program_id'],
            'trade_type': row['trade_type'],
            'wallet_address': row['wallet_address'],
            'token_address': row['token_address'],
            'is_buy': row['is_buy'].lower() == 'true',
            
            # Critical fields for RSI calculation
            'amount_in_sol': float(row['amount_in_sol']) if row['amount_in_sol'] else 0.0,
            'amount_in_token': float(row['amount_in_token']) if row['amount_in_token'] else 0.0,
            'price_in_sol': float(row['price_in_sol']) if row['price_in_sol'] else 0.0,
            
            # Price change data
            'change_in_sol': float(row['change_in_sol']) if row['change_in_sol'] else 0.0,
            'change_in_tokens': float(row['change_in_tokens']) if row['change_in_tokens'] else 0.0,
            
            # Reserve data for context
            'virtual_sol_reserves': float(row['virtual_sol_reserves']) if row['virtual_sol_reserves'] else 0.0,
            'virtual_token_reserves': float(row['virtual_token_reserves']) if row['virtual_token_reserves'] else 0.0,
            'real_sol_reserves': float(row['real_sol_reserves']) if row['real_sol_reserves'] else 0.0,
            'real_token_reserves': float(row['real_token_reserves']) if row['real_token_reserves'] else 0.0,
            
            # Fee information
            'fee_recipient': row['fee_recipient'],
            'fee_basis_points': int(row['fee_basis_points']) if row['fee_basis_points'] else 0,
            'fee_amount': float(row['fee_amount']) if row['fee_amount'] else 0.0,
            
            # Creator info
            'creator_address': row['creator_address'],
            'creator_fee_basis_points': int(row['creator_fee_basis_points']) if row['creator_fee_basis_points'] else 0,
            'creator_fee_amount': float(row['creator_fee_amount']) if row['creator_fee_amount'] else 0.0,
            
            # Metadata
            'ingested_at': row['ingested_at'],
            'processed_timestamp': datetime.utcnow().isoformat()
        }
        
        return trade_message
        
    except (ValueError, KeyError) as e:
        print(f"⚠️  Error parsing row: {e}")
        return None

def ingest_csv_to_redpanda(csv_file, producer, simulate_realtime=True):
    """
    Read CSV file and publish each row to Redpanda
    
    Args:
        csv_file (str): Path to CSV file
        producer (KafkaProducer): Kafka producer instance
        simulate_realtime (bool): If True, adds delay between messages
    """
    try:
        with open(csv_file, 'r', encoding='utf-8') as file:
            # Use DictReader to automatically parse headers
            reader = csv.DictReader(file)
            
            # Strip whitespace from headers (common CSV issue)
            reader.fieldnames = [name.strip() for name in reader.fieldnames]
            
            message_count = 0
            error_count = 0
            
            print(f"\n📊 Starting data ingestion from {csv_file}")
            print(f"📤 Publishing to topic: {TOPIC_NAME}\n")
            
            for row_num, row in enumerate(reader, start=1):
                # Parse CSV row to JSON
                trade_message = parse_csv_row(row)
                
                if trade_message is None:
                    error_count += 1
                    continue
                
                try:
                    # Publish message to Redpanda
                    # Use token_address as the key for partitioning (keeps same token data together)
                    future = producer.send(
                        TOPIC_NAME,
                        key=trade_message['token_address'].encode('utf-8'),
                        value=trade_message
                    )
                    
                    # Wait for message to be sent (blocking call)
                    record_metadata = future.get(timeout=10)
                    
                    message_count += 1
                    
                    # Print progress every 50 messages
                    if message_count % 50 == 0:
                        print(f"✓ Sent {message_count} messages... "
                              f"(Latest: {trade_message['token_address'][:8]}... "
                              f"Price: {trade_message['price_in_sol']:.8f} SOL)")
                    
                    # Simulate real-time streaming with small delay
                    if simulate_realtime:
                        time.sleep(0.1)  # 100ms delay between messages
                    
                except Exception as e:
                    print(f"❌ Failed to send message {row_num}: {e}")
                    error_count += 1
            
            # Ensure all messages are sent before closing
            producer.flush()
            
            print(f"\n{'='*60}")
            print(f"📈 Ingestion Complete!")
            print(f"✅ Successfully published: {message_count} messages")
            print(f"❌ Errors: {error_count} messages")
            print(f"{'='*60}\n")
            
    except FileNotFoundError:
        print(f"❌ CSV file not found: {csv_file}")
        print(f"💡 Make sure {csv_file} is in the same directory as this script")
        sys.exit(1)
        
    except Exception as e:
        print(f"❌ Unexpected error during ingestion: {e}")
        sys.exit(1)

def main():
    """Main execution function"""
    print("="*60)
    print("🚀 Pump.fun Trading Data Ingestion Script")
    print("="*60)
    
    # Create producer connection
    producer = create_producer()
    
    try:
        # Ingest CSV data
        ingest_csv_to_redpanda(CSV_FILE, producer, simulate_realtime=True)
        
    except KeyboardInterrupt:
        print("\n⚠️  Interrupted by user. Shutting down gracefully...")
        
    finally:
        # Always close producer connection
        producer.close()
        print("👋 Producer closed. Goodbye!")

if __name__ == "__main__":
    main()