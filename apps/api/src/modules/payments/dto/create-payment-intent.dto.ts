import { IsString, IsNumberString } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsString()
  bookingId: string;

  @IsString()
  currency: string;

  @IsNumberString()
  amount: string;
}
