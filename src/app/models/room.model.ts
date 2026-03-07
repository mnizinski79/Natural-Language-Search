export interface Room {
  id: string;
  hotelId: string;
  name: string;
  type: 'Standard' | 'Deluxe' | 'Suite' | 'Executive';
  bedType: string; // e.g., "1 King Bed", "2 Queen Beds"
  maxOccupancy: number;
  size: number; // Square feet
  amenities: string[]; // Room-specific amenities
  description: string;
  imageUrls: string[];
  pricing: {
    baseRate: number;
    totalRate: number; // Including taxes and fees
    taxesAndFees: number;
  };
  availability: 'available' | 'limited' | 'unavailable';
  remainingRooms?: number; // Only shown when limited
}
