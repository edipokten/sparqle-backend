import { Injectable, Logger } from '@nestjs/common';
import { CsvManagerService } from 'src/csv-manager/csv-manager.service';
import { DeliveryData } from 'src/shared/dto/csv';
import { AddressData } from 'src/shared/dto/routing';
import { Coordinates } from 'src/shared/interfaces/routing';

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);

  constructor(private csvManager: CsvManagerService) {}

  /**
   * Calculates the geographical midpoint based on delivery locations.
   * @returns A Promise resolving to a tuple [latitude, longitude] of the midpoint.
   */
  async getMidPoint(): Promise<[number, number]> {
    try {
      const deliveries = await this.csvManager.getDeliveries();
      const groupDeliveries = this.groupByAddress(deliveries);
      this.logger.log('Deliveries grouped by address', { groupDeliveries });

      const coordinates = groupDeliveries.map(this.extractCoordinates);
      return this.findMidpoint(coordinates);
    } catch (error) {
      this.logger.error('Failed to get midpoint', error);
      throw error;
    }
  }

  /**
   * Retrieves routing data grouped by address.
   * @returns A Promise resolving to an array of AddressData objects.
   */
  async getRoutingData(): Promise<AddressData[]> {
    try {
      const deliveries = await this.csvManager.getDeliveries();
      const groupDeliveries = this.groupByAddress(deliveries);
      this.logger.log('Grouped deliveries retrieved', { groupDeliveries });

      return groupDeliveries;
    } catch (error) {
      this.logger.error('Failed to get routing data', error);
      throw error;
    }
  }

  // Groups delivery data by address.
  private groupByAddress(data: DeliveryData[]): AddressData[] {
    const groupedData: { [key: string]: AddressData } = {};

    data.forEach((item) => {
      const key = item.address;
      if (!groupedData[key]) {
        groupedData[key] = { ...this.createAddressData(item) };
      }
      groupedData[key].order.push(item.order);
    });

    return Object.values(groupedData);
  }

  // Creates AddressData from a DeliveryData object.
  private createAddressData(item: DeliveryData): AddressData {
    return {
      address: item.address,
      lat: item.lat,
      lng: item.lng,
      order: [],
    };
  }

  // Extracts coordinates from AddressData.
  private extractCoordinates(data: AddressData): Coordinates {
    return { lat: data.lat, lng: data.lng };
  }

  // Finds the midpoint from a list of coordinates.
  private findMidpoint(coordinates: Coordinates[]): [number, number] {
    const midpointLat = this.calculateAverage(coordinates.map((c) => c.lat));
    const midpointLng = this.calculateAverage(coordinates.map((c) => c.lng));

    this.logger.log('Midpoint calculated', {
      lat: midpointLat,
      lng: midpointLng,
    });
    return [midpointLat, midpointLng];
  }

  // Calculates the average of a list of numbers.
  private calculateAverage(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
}
