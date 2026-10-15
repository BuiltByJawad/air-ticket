import { Body, Controller, Headers, HttpCode, HttpStatus, Post, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../auth/public.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a Stripe PaymentIntent for a booking' })
  async createIntent(@Body() body: CreatePaymentIntentDto) {
    return this.paymentsService.createPaymentIntent({
      bookingId: body.bookingId,
      currency: body.currency,
      amount: body.amount
    });
  }

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async webhook(@Headers('stripe-signature') signature: string, @Req() req: RawBodyRequest<Request>) {
    const rawBody = req.rawBody ?? Buffer.from('');
    const result = await this.paymentsService.handleWebhook(signature, rawBody);
    return { received: true, result };
  }
}
