use rdkafka::config::ClientConfig;
use rdkafka::consumer::{Consumer, StreamConsumer};
use rdkafka::producer::{FutureProducer, FutureRecord};
use rdkafka::message::Message;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Duration;
use log::{info, warn, error};
use anyhow::{Result, Context};

/// Trade message structure matching the CSV data
#[derive(Debug, Deserialize)]
struct TradeMessage {
    token_address: String,
    price_in_sol: f64,
    block_time: String,
    transaction_signature: String,
    is_buy: bool,
    amount_in_sol: f64,
    
    #[serde(default)]
    processed_timestamp: String,
}

/// RSI calculation result to be published
#[derive(Debug, Serialize)]
struct RsiMessage {
    token_address: String,
    rsi_value: f64,
    current_price: f64,
    timestamp: String,
    period: usize,
    signal: String, // "oversold", "neutral", "overbought"
}

/// Stores price history for RSI calculation per token
#[derive(Debug, Clone)]
struct PriceHistory {
    prices: Vec<f64>,
    max_size: usize,
}

impl PriceHistory {
    fn new(max_size: usize) -> Self {
        Self {
            prices: Vec::with_capacity(max_size + 1),
            max_size,
        }
    }
    
    /// Add new price and maintain maximum size
    fn add_price(&mut self, price: f64) {
        self.prices.push(price);
        
        // Keep only the most recent prices
        if self.prices.len() > self.max_size {
            self.prices.remove(0);
        }
    }
    
    /// Calculate RSI using the standard 14-period formula
    /// RSI = 100 - (100 / (1 + RS))
    /// where RS = Average Gain / Average Loss
    fn calculate_rsi(&self, period: usize) -> Option<f64> {
        // Need at least period + 1 prices to calculate changes
        if self.prices.len() < period + 1 {
            return None;
        }
        
        // Calculate price changes
        let mut gains = Vec::new();
        let mut losses = Vec::new();
        
        // Start from the most recent prices
        let start_idx = self.prices.len().saturating_sub(period + 1);
        
        for i in start_idx + 1..self.prices.len() {
            let change = self.prices[i] - self.prices[i - 1];
            
            if change > 0.0 {
                gains.push(change);
                losses.push(0.0);
            } else {
                gains.push(0.0);
                losses.push(change.abs());
            }
        }
        
        // Calculate average gain and average loss
        let avg_gain: f64 = gains.iter().sum::<f64>() / period as f64;
        let avg_loss: f64 = losses.iter().sum::<f64>() / period as f64;
        
        // Avoid division by zero
        if avg_loss == 0.0 {
            return Some(100.0); // If no losses, RSI is 100
        }
        
        // Calculate RS and RSI
        let rs = avg_gain / avg_loss;
        let rsi = 100.0 - (100.0 / (1.0 + rs));
        
        Some(rsi)
    }
}

/// Main RSI calculator engine
struct RsiCalculator {
    // Store price history for each token
    token_histories: HashMap<String, PriceHistory>,
    rsi_period: usize,
}

impl RsiCalculator {
    fn new(rsi_period: usize) -> Self {
        Self {
            token_histories: HashMap::new(),
            rsi_period,
        }
    }
    
    /// Process incoming trade and calculate RSI
    fn process_trade(&mut self, trade: TradeMessage) -> Option<RsiMessage> {
        // Get or create price history for this token
        let history = self.token_histories
            .entry(trade.token_address.clone())
            .or_insert_with(|| PriceHistory::new(self.rsi_period + 10));
        
        // Add new price to history
        history.add_price(trade.price_in_sol);
        
        // Calculate RSI if we have enough data
        if let Some(rsi) = history.calculate_rsi(self.rsi_period) {
            // Determine signal based on RSI thresholds
            let signal = if rsi < 30.0 {
                "oversold".to_string()
            } else if rsi > 70.0 {
                "overbought".to_string()
            } else {
                "neutral".to_string()
            };
            
            Some(RsiMessage {
                token_address: trade.token_address,
                rsi_value: rsi,
                current_price: trade.price_in_sol,
                timestamp: chrono::Utc::now().to_rfc3339(),
                period: self.rsi_period,
                signal,
            })
        } else {
            // Not enough data yet
            None
        }
    }
}

/// Create Kafka consumer for reading trade data
fn create_consumer(brokers: &str, group_id: &str) -> Result<StreamConsumer> {
    let consumer: StreamConsumer = ClientConfig::new()
        .set("bootstrap.servers", brokers)
        .set("group.id", group_id)
        .set("enable.auto.commit", "true")
        .set("auto.offset.reset", "earliest") // Start from beginning if no offset stored
        .set("session.timeout.ms", "6000")
        .create()
        .context("Failed to create consumer")?;
    
    consumer
        .subscribe(&["trade-data"])
        .context("Failed to subscribe to topic")?;
    
    Ok(consumer)
}

/// Create Kafka producer for publishing RSI data
fn create_producer(brokers: &str) -> Result<FutureProducer> {
    let producer: FutureProducer = ClientConfig::new()
        .set("bootstrap.servers", brokers)
        .set("message.timeout.ms", "5000")
        .set("compression.type", "gzip")
        .create()
        .context("Failed to create producer")?;
    
    Ok(producer)
}

/// Main async function
#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logger
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();
    
    info!("🚀 Starting RSI Calculator Service");
    
    // Configuration
    let brokers = "localhost:19092";
    let consumer_group = "rsi-calculator-group";
    let rsi_period = 14; // Standard RSI period
    
    // Create consumer and producer
    let consumer = create_consumer(brokers, consumer_group)?;
    let producer = create_producer(brokers)?;
    
    // Initialize RSI calculator
    let mut calculator = RsiCalculator::new(rsi_period);
    
    info!("✅ Connected to Redpanda at {}", brokers);
    info!("📊 Calculating {}-period RSI for incoming trades", rsi_period);
    info!("🔄 Listening for messages on 'trade-data' topic...\n");
    
    let mut message_count = 0u64;
    let mut rsi_published_count = 0u64;
    
    // Main message processing loop
    loop {
        match consumer.recv().await {
            Ok(message) => {
                message_count += 1;
                
                // Extract message payload
                if let Some(payload) = message.payload() {
                    // Deserialize JSON message
                    match serde_json::from_slice::<TradeMessage>(payload) {
                        Ok(trade) => {
                            // Process trade and calculate RSI
                            if let Some(rsi_msg) = calculator.process_trade(trade) {
                                let token_short = &rsi_msg.token_address[..8];
                                
                                // Log RSI value
                                info!(
                                    "📈 Token: {}... | Price: {:.8} SOL | RSI: {:.2} | Signal: {}",
                                    token_short,
                                    rsi_msg.current_price,
                                    rsi_msg.rsi_value,
                                    rsi_msg.signal
                                );
                                
                                // Serialize RSI message to JSON
                                let rsi_json = serde_json::to_string(&rsi_msg)
                                    .context("Failed to serialize RSI message")?;
                                
                                // Publish to rsi-data topic
                                let record = FutureRecord::to("rsi-data")
                                    .key(&rsi_msg.token_address)
                                    .payload(&rsi_json);
                                
                                // Send message (non-blocking)
                                match producer.send(record, Duration::from_secs(0)).await {
                                    Ok(_) => {
                                        rsi_published_count += 1;
                                        
                                        // Print statistics every 50 messages
                                        if rsi_published_count % 50 == 0 {
                                            info!(
                                                "📊 Stats: Processed {} trades | Published {} RSI values",
                                                message_count,
                                                rsi_published_count
                                            );
                                        }
                                    }
                                    Err((e, _)) => {
                                        error!("❌ Failed to publish RSI: {}", e);
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            warn!("⚠️  Failed to parse trade message: {}", e);
                        }
                    }
                }
                
                // Commit offset manually (optional, auto-commit is enabled)
                if message_count % 100 == 0 {
                    if let Err(e) = consumer.commit_consumer_state(rdkafka::consumer::CommitMode::Async) {
                        warn!("Failed to commit offset: {}", e);
                    }
                }
            }
            Err(e) => {
                error!("❌ Kafka error: {}", e);
                tokio::time::sleep(Duration::from_secs(1)).await;
            }
        }
    }
}