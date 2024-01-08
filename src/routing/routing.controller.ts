import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { RoutingService } from './routing.service';
import { AddressData } from 'src/shared/dto/routing';

@Controller('route')
export class RoutingController {
  constructor(private routingService: RoutingService) {}

  /**
   * GET endpoint to retrieve routing data.
   * Returns an array of AddressData with routing information.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async routingData(): Promise<AddressData[]> {
    try {
      return await this.routingService.getRoutingData();
    } catch (error) {
      // Handle errors appropriately here
      throw error; // re-throw or handle differently based on your application's needs
    }
  }

  /**
   * GET endpoint to retrieve the geographic midpoint of routes.
   * Returns a tuple of [latitude, longitude].
   */
  @Get('/mid')
  @HttpCode(HttpStatus.OK)
  async middlePoint(): Promise<[number, number]> {
    try {
      return await this.routingService.getMidPoint();
    } catch (error) {
      // Handle errors appropriately here
      throw error; // re-throw or handle differently based on your application's needs
    }
  }
}
