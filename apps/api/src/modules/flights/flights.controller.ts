import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserData } from '../auth/current-user.decorator';
import { FlightsService } from './flights.service';
import { Public } from '../auth/public.decorator';
import { SearchFlightDto } from './dto/search-flight.dto';
import { QuoteFlightDto } from './dto/quote-flight.dto';

@ApiTags('Flights')
@Controller('flights')
export class FlightsController {
  constructor(private readonly flightsService: FlightsService) {}

  @Public()
  @Get('airports')
  @ApiOperation({ summary: 'Suggest airports by query' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Airport suggestions' })
  async suggestAirports(@Query('q') query: string) {
    if (!query || query.length < 1) return [];
    return this.flightsService.suggestAirports(query);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search for flight offers' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Flight offers found' })
  async search(@CurrentUser() user: CurrentUserData, @Body() body: SearchFlightDto) {
    return this.flightsService.search(user, body);
  }

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a quote for a specific offer' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Quote retrieved' })
  async quote(@CurrentUser() user: CurrentUserData, @Body() body: QuoteFlightDto) {
    return this.flightsService.quote(user, body);
  }
}
