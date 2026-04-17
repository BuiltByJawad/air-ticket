import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { AgenciesModule } from '../agencies/agencies.module';

@Module({
  imports: [forwardRef(() => AgenciesModule)],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
