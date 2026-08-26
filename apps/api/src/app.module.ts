import { Module } from '@nestjs/common';
import { ImportacaoModule } from './importacao/importacao.module';

@Module({
  imports: [ImportacaoModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
