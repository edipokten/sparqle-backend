export class DeliveryData {
  address: string;
  lat: number;
  lng: number;
  order: number;
  constructor(rawDeliveryData: RawDeliveryData) {
    this.address = rawDeliveryData.address;
    this.lat = parseFloat(rawDeliveryData.lat.replace(',', '.'));
    this.lng = parseFloat(rawDeliveryData.lng.replace(',', '.'));
    this.order = rawDeliveryData.order;
  }
}

export class RawDeliveryData {
  driverName: string;
  orderRef: number;
  address: string;
  lat: string;
  lng: string;
  status: string;
  type: string;
  startTime: string | null;
  endTime: string | null;
  driverNotes: string | null;
  completedAt: string | null;
  skipNotes: string | null;
  routePlanType: string;
  load: string | null;
  arrivalTime: string;
  finishTime: string;
  order: number;
}
