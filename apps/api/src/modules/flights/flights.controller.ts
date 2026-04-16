import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, type CurrentUserData } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FlightsService } from './flights.service';

const SearchBodySchema = z.object({
  origin: z.string().min(3).max(3),
  destination: z.string().min(3).max(3),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().int().min(1).max(9)
});

const QuoteBodySchema = z.object({
  offerId: z.string().min(1)
});

@Controller('flights')
@UseGuards(JwtAuthGuard)
export class FlightsController {
  constructor(private readonly flightsService: FlightsService) {}

  @Post('search')
  async search(@CurrentUser() user: CurrentUserData, @Body() body: unknown) {
    const parsed = SearchBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('Invalid search input');
    }

    return this.flightsService.search(user, parsed.data);
  }

  @Post('quote')
  async quote(@CurrentUser() user: CurrentUserData, @Body() body: unknown) {
    const parsed = QuoteBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('Invalid quote input');
    }

    try {
      return await this.flightsService.quote(user, parsed.data);
    } catch {
      throw new BadRequestException('Invalid offerId');
    }
  }
}
