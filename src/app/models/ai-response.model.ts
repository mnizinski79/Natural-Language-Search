import { IntentType } from './conversation-state.model';
import { SearchCriteria } from './search-criteria.model';

export interface AIResponse {
  intent: IntentType;
  message: string;
  chips?: string[];  // Optional array of chip labels for user to select
  searchCriteria?: SearchCriteria;
  shouldSearch: boolean;
  shouldRefine: boolean;
  specificHotelId?: string;
  showDatePicker?: boolean;
  checkIn?: string;  // SO date format (YYYY-MM-DD)
  checkOut?: string; // ISO date format (YYYY-MM-DD)
}
