/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RateLimitService } from './rate-limit.service';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminAuthGuard } from './admin-auth.guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
      signOptions: { expiresIn: '30m' },
    }),
  ],
  providers: [AuthService, RateLimitService, AdminService, AdminAuthGuard],
  controllers: [AuthController, AdminController],
  exports: [AuthService, RateLimitService, AdminService, AdminAuthGuard, JwtModule],
})
export class AuthModule {}
