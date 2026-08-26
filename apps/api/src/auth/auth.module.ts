/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RateLimitService } from './rate-limit.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
      signOptions: { expiresIn: '30m' },
    }),
  ],
  providers: [AuthService, RateLimitService],
  controllers: [AuthController],
  exports: [AuthService, RateLimitService],
})
export class AuthModule {}
