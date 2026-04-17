import { forwardRef, Module } from '@nestjs/common';
import { AgenciesService } from './agencies.service';
import { AdminAgenciesController } from './controllers/admin-agencies.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [forwardRef(() => UsersModule)],
  providers: [AgenciesService],
  exports: [AgenciesService],
  controllers: [AdminAgenciesController, AdminUsersController]
})
export class AgenciesModule {}
