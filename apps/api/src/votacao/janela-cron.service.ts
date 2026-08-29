/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JanelaService } from './janela.service';

/**
 * Serviço de CRON que processa a abertura/fechamento automático das janelas
 * de votação. Roda a cada minuto.
 *
 * A janela em si abre/fecha dinamicamente pelo cálculo em JanelaService.status()
 * com base nas datas. Este CRON garante:
 *  - registro em auditoria da transição (quem abriu/fechou = 'sistema')
 *  - fechamento definitivo (fechadaManual=true) ao passar de dataFim,
 *    cumprindo a regra do PRD: após fechar, a votação não reabre.
 */
@Injectable()
export class JanelaCronService {
  private readonly logger = new Logger(JanelaCronService.name);

  constructor(private readonly janelaService: JanelaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron(): Promise<void> {
    try {
      const resultado = await this.janelaService.processarTransicoesAutomaticas();
      if (resultado.aberturas.length > 0) {
        this.logger.log(`Janelas abertas automaticamente: ${resultado.aberturas.join(', ')}`);
      }
      if (resultado.fechamentos.length > 0) {
        this.logger.log(`Janelas fechadas automaticamente: ${resultado.fechamentos.join(', ')}`);
      }
    } catch (error) {
      this.logger.error(
        `Erro ao processar transições automáticas: ${error instanceof Error ? error.message : error}`
      );
    }
  }
}
