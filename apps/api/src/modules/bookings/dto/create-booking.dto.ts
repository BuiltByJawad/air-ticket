import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PassengerDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  dateOfBirth: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsString()
  @IsNotEmpty()
  passportNumber: string;

  @IsString()
  @IsNotEmpty()
  passportExpiry: string;

  @IsString()
  @IsNotEmpty()
  passportIssuingCountry: string;
}

export class CreateBookingDto {
  @ApiProperty({ example: 'off_0001' })
  @IsString()
  @MinLength(1)
  offerId: string;

  @ApiProperty({ example: { segments: [] } })
  @IsNotEmpty()
  offerData: Record<string, unknown>;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  currency: string;

  @ApiProperty({ example: '500.00' })
  @IsString()
  @MinLength(1)
  amount: string;

  @ApiProperty({ type: [PassengerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PassengerDto)
  passengers: PassengerDto[];
}
