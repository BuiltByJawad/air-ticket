import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, type CurrentUserData } from '../auth/current-user.decorator';
import { PricingService } from './pricing.service';

@ApiTags('Pricing')
@ApiBearerAuth()
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('calculate')
  @Roles('agent', 'admin')
  @ApiOperation({ summary: 'Calculate price with markup and commission' })
  async calculate(
    @CurrentUser() user: CurrentUserData,
    @Body() body: { baseAmount: string; currency: string; airline: string; origin: string; destination: string; cabinClass: string }
  ) {
    const agencyId = user.role === 'admin' && body.airline ? user.agencyId ?? '' : user.agencyId ?? '';
    return this.pricingService.calculatePrice({
      agencyId,
      baseAmount: body.baseAmount,
      currency: body.currency,
      airline: body.airline,
      origin: body.origin,
      destination: body.destination,
      cabinClass: body.cabinClass
    });
  }

  @Post('markup-rules')
  @Roles('admin')
  @ApiOperation({ summary: 'Create a markup rule' })
  async createMarkupRule(
    @CurrentUser() user: CurrentUserData,
    @Body() body: { agencyId: string; airline?: string; origin?: string; destination?: string; cabinClass?: string; markupPct: number; priority?: number }
  ) {
    return this.pricingService.createMarkupRule(body.agencyId, body);
  }

  @Get('markup-rules')
  @Roles('agent', 'admin')
  @ApiOperation({ summary: 'List markup rules for agency' })
  async listMarkupRules(@Query('agencyId') agencyId: string) {
    return this.pricingService.listMarkupRules(agencyId);
  }

  @Delete('markup-rules/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a markup rule' })
  @ApiParam({ name: 'id' })
  async deleteMarkupRule(
    @Param('id') id: string,
    @Query('agencyId') agencyId: string
  ) {
    const result = await this.pricingService.deleteMarkupRule(id, agencyId);
    if (!result) return { deleted: false };
    return { deleted: true };
  }

  @Post('commission-rules')
  @Roles('admin')
  @ApiOperation({ summary: 'Create a commission rule' })
  async createCommissionRule(
    @Body() body: { agencyId: string; airline?: string; origin?: string; destination?: string; cabinClass?: string; commissionPct: number; commissionFlat?: number; priority?: number }
  ) {
    return this.pricingService.createCommissionRule(body.agencyId, body);
  }

  @Get('commission-rules')
  @Roles('agent', 'admin')
  @ApiOperation({ summary: 'List commission rules for agency' })
  async listCommissionRules(@Query('agencyId') agencyId: string) {
    return this.pricingService.listCommissionRules(agencyId);
  }

  @Delete('commission-rules/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a commission rule' })
  @ApiParam({ name: 'id' })
  async deleteCommissionRule(
    @Param('id') id: string,
    @Query('agencyId') agencyId: string
  ) {
    const result = await this.pricingService.deleteCommissionRule(id, agencyId);
    if (!result) return { deleted: false };
    return { deleted: true };
  }
}
