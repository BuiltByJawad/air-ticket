import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateAgencyDto {
  @ApiProperty({ example: 'Sky Travel Agency' })
  @IsString()
  @MinLength(1)
  name: string;
}
