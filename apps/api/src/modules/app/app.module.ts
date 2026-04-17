import { MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from './health.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AgenciesModule } from '../agencies/agencies.module';
import { FlightsModule } from '../flights/flights.module';
import { BookingsModule } from '../bookings/bookings.module';
import { AuditModule } from '../audit/audit.module';
import { RequestIdMiddleware } from './request-id.middleware';
import { LoggerMiddleware } from './logger.middleware';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    AgenciesModule,
    FlightsModule,
    BookingsModule,
    AuditModule
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: RolesGuard }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware, LoggerMiddleware).forRoutes('*');
  }
}