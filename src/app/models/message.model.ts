import { Hotel } from './hotel.model';
import { Room } from './room.model';

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  chips?: string[]; // Optional chips for user to select
  hotels?: Hotel[]; // For AI messages with results
  rooms?: Room[]; // For AI messages with room results
  roomsHotel?: Hotel; // Hotel context for room results
  showDatePicker?: boolean; // Trigger date picker display
  showRateCalendar?: boolean; // Trigger rate calendar display
  rateCalendarHotel?: Hotel; // Hotel for rate calendar
}
