import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
@Injectable()
export class CacheService implements OnModuleDestroy {
  private client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { lazyConnect: true, maxRetriesPerRequest: 1 });
  async get(key: string) { try { if (this.client.status === 'wait') await this.client.connect(); return await this.client.get(key); } catch { return null; } }
  async set(key: string, value: string, seconds = 60) { try { if (this.client.status === 'wait') await this.client.connect(); await this.client.set(key, value, 'EX', seconds); } catch {} }
  async del(key: string) { try { await this.client.del(key); } catch {} }
  async onModuleDestroy() { try { await this.client.quit(); } catch {} }
}
