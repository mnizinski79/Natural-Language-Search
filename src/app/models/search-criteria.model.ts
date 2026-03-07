export interface SearchCriteria {
  brands?: string[];
  sentiments?: string[];
  amenities?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  minRating?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'rating_desc';
  tripType?: 'business' | 'leisure' | 'family' | 'romantic' | 'solo'; // Trip purpose for personalized recommendations
}
