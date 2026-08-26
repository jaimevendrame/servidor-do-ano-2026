/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

const MAX_TENTATIVAS = 3;
const BLOQUEIO_SEGUNDOS = 15 * 60; // 15 minutos

@Injectable()
export class RateLimitService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  private chave(cpf: string): string {
    return `login:tentativas:${cpf}`;
  }

  async estaBloqueado(cpf: string): Promise<boolean> {
    const tentativas = await this.redis.get(this.chave(cpf));
    return tentativas !== null && parseInt(tentativas) >= MAX_TENTATIVAS;
  }

  async registrarFalha(cpf: string): Promise<{ bloqueado: boolean; tentativas: number }> {
    const chave = this.chave(cpf);
    const tentativas = await this.redis.incr(chave);

    // Seta TTL apenas na primeira tentativa
    if (tentativas === 1) {
      await this.redis.expire(chave, BLOQUEIO_SEGUNDOS);
    }

    return { bloqueado: tentativas >= MAX_TENTATIVAS, tentativas };
  }

  async resetar(cpf: string): Promise<void> {
    await this.redis.del(this.chave(cpf));
  }

  async tempoRestante(cpf: string): Promise<number> {
    return await this.redis.ttl(this.chave(cpf));
  }
}
