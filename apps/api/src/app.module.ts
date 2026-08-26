import { Module } from '@nestjs/common';
import { ImportacaoModule } from './importacao/importacao.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, ImportacaoModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
