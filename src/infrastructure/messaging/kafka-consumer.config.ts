import { Kafka, KafkaConfig, Consumer, ConsumerConfig } from 'kafkajs';
import { Logger } from '../../shared/logging/logger';

export class KafkaConsumerConfig {
  private static instance: KafkaConsumerConfig;
  private kafka: Kafka;
  private consumer: Consumer;

  private constructor() {
    const kafkaConfig: KafkaConfig = {
      clientId: process.env.KAFKA_CLIENT_ID || 'notification-service',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      retry: {
        retries: 8,
        initialRetryTime: 100,
        multiplier: 2,
        maxRetryTime: 30000,
      },
    };

    const consumerConfig: ConsumerConfig = {
      groupId: process.env.KAFKA_GROUP_ID || 'notification-service-group',
      allowAutoTopicCreation: true,
    };

    this.kafka = new Kafka(kafkaConfig);
    this.consumer = this.kafka.consumer(consumerConfig);
  }

  public static getInstance(): KafkaConsumerConfig {
    if (!KafkaConsumerConfig.instance) {
      KafkaConsumerConfig.instance = new KafkaConsumerConfig();
    }
    return KafkaConsumerConfig.instance;
  }

  public getConsumer(): Consumer {
    return this.consumer;
  }

  public async connect(): Promise<void> {
    try {
      await this.consumer.connect();
      Logger.info('Kafka Consumer connected successfully');
    } catch (error) {
      Logger.error('Failed to connect Kafka Consumer', undefined, { error: String(error) });
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.consumer.disconnect();
      Logger.info('Kafka Consumer disconnected successfully');
    } catch (error) {
      Logger.error('Failed to disconnect Kafka Consumer', undefined, { error: String(error) });
      throw error;
    }
  }

  public async subscribe(topics: string[]): Promise<void> {
    await this.consumer.subscribe({ topics, fromBeginning: false });
  }

  public async run(handler: (message: any) => Promise<void>): Promise<void> {
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const value = message.value?.toString();
          if (!value) return;
          const data = JSON.parse(value);
          await handler({ topic, partition, data });
        } catch (error) {
          Logger.error('Error processing Kafka message', undefined, {
            topic,
            partition,
            error: String(error),
          });
        }
      },
    });
  }
}

