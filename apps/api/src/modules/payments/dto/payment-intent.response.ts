import { IsString } from 'class-validator';

export class PaymentIntentResponseDto {
  @IsString()
  clientSecret: string;

  @IsString()
  paymentIntentId: string;
}
