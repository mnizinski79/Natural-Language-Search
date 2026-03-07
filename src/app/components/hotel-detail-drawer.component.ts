import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener, ElementRef, ViewChild, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Hotel } from '../models/hotel.model';
import { Room } from '../models/room.model';
import { BRAND_COLORS, BRAND_LOGOS } from '../models/brand-config';
import { RateCalendarComponent, DateRange } from './rate-calendar.component';
import { MapComponent } from './map.component';
import { RoomCardComponent } from './room-card.component';
import { AIService } from '../services/ai.service';
import { ConversationService } from '../services/conversation.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-hotel-detail-drawer',
  standalone: true,
  imports: [CommonModule, RateCalendarComponent, MapComponent, RoomCardComponent],
  templateUrl: './hotel-detail-drawer.component.html',
  styleUrls: ['./hotel-detail-drawer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
/**
 * HotelDetailDrawerComponent - Desktop hotel details drawer
 *
 * Slide-in drawer from right side (33% width) displaying comprehensive hotel information:
 * - Image gallery with navigation
 * - Hotel name, brand, rating
 * - Description and amenities
 * - Location and contact information
 * - Pricing breakdown
 *
 * Features:
 * - Slide-in/out animation
 * - Close on backdrop click, Escape key, or close button
 * - Keyboard navigation for image gallery (arrow keys)
 * - Focus management for accessibility
 *
 * @example
 * <app-hotel-detail-drawer
 *   [hotel]="selectedHotel"
 *   [visible]="showDrawer"
 *   (closed)="closeDrawer()">
 * </app-hotel-detail-drawer>
 */
export class HotelDetailDrawerComponent implements OnChanges, AfterViewInit {
  /** Hotel to display details for */
  @Input() hotel: Hotel | null = null;

  /** Whether the drawer is visible */
  @Input() visible: boolean = false;

  /** Whether dates have been selected */
  @Input() hasDates: boolean = false;

  /** Emitted when drawer is closed */
  @Output() closed = new EventEmitter<void>();

  /** Emitted when dates are selected */
  @Output() dateSelected = new EventEmitter<DateRange>();

  /** Emitted when user clicks "Select dates" button */
  @Output() selectDatesRequested = new EventEmitter<void>();

  /** Emitted when a conversational chip is selected */
  @Output() chipSelected = new EventEmitter<string>();

  /** Emitted when back to chat is clicked */
  @Output() backToChatClicked = new EventEmitter<void>();

  /** Emitted when a room is selected */
  @Output() roomSelected = new EventEmitter<Room>();

  /** Reference to drawer container for focus management */
  @ViewChild('drawerContainer') drawerContainer?: ElementRef;

  /** Current image index in gallery */
  currentImageIndex: number = 0;

  /** Whether the drawer is in closing animation state */
  isClosing: boolean = false;

  /** Whether the rate calendar is visible */
  showRateCalendar: boolean = false;

  /** Cached conversational chips */
  conversationalChips: Array<{icon: string, label: string, message: string}> = [];

  /** Rooms for this hotel */
  hotelRooms: Room[] = [];

  /** Whether rooms are loading */
  isLoadingRooms: boolean = false;

  /** Previously focused element for focus restoration */
  private previouslyFocusedElement: HTMLElement | null = null;

  /** Personalized hotel description */
  personalizedDescription: string | null = null;

  /** Whether personalized description is loading */
  isLoadingDescription: boolean = false;

  /** Cache of personalized descriptions by hotel ID and context */
  private static descriptionCache: Map<string, string> = new Map();

  constructor(
    private http: HttpClient,
    private aiService: AIService,
    private conversationService: ConversationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hotel'] && this.hotel) {
      this.currentImageIndex = 0;
      this.updateConversationalChips();
      this.loadRooms();
      this.loadPersonalizedDescription();
    }

    if (changes['hasDates']) {
      this.updateConversationalChips();
    }

    if (changes['visible']) {
      if (this.visible) {
        this.updateConversationalChips();
        this.trapFocus();
      } else {
        this.restoreFocus();
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.visible) {
      this.trapFocus();
    }
  }

  /**
   * Trap focus within the drawer when opened for accessibility
   */
  private trapFocus(): void {
    // Store the currently focused element
    this.previouslyFocusedElement = document.activeElement as HTMLElement;

    // Focus the drawer after a short delay to ensure it's rendered
    setTimeout(() => {
      if (this.drawerContainer) {
        const focusableElements = this.drawerContainer.nativeElement.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          (focusableElements[0] as HTMLElement).focus();
        }
      }
    }, 100);
  }

  /**
   * Restore focus to the previously focused element when drawer closes
   */
  private restoreFocus(): void {
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
      this.previouslyFocusedElement = null;
    }
  }

  /**
   * Handle Escape key to close drawer
   */
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.visible) {
      this.close();
    }
  }

  /**
   * Handle left arrow key for previous image
   */
  @HostListener('document:keydown.arrowleft', ['$event'])
  onArrowLeft(event: KeyboardEvent): void {
    if (this.visible && this.hotel && this.hotel.imageUrls.length > 1) {
      event.preventDefault();
      this.previousImage();
    }
  }

  /**
   * Handle right arrow key for next image
   */
  @HostListener('document:keydown.arrowright', ['$event'])
  onArrowRight(event: KeyboardEvent): void {
    if (this.visible && this.hotel && this.hotel.imageUrls.length > 1) {
      event.preventDefault();
      this.nextImage();
    }
  }

  /**
   * Close the drawer and emit closed event
   */
  close(): void {
    this.isClosing = true;
    // Wait for animation to complete before emitting closed event
    setTimeout(() => {
      this.isClosing = false;
      this.closed.emit();
    }, 350); // Match animation duration (350ms)
  }

  /**
   * Navigate to next image in gallery (circular)
   */
  nextImage(): void {
    if (this.hotel && this.hotel.imageUrls.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.hotel.imageUrls.length;
    }
  }

  /**
   * Navigate to previous image in gallery (circular)
   */
  previousImage(): void {
    if (this.hotel && this.hotel.imageUrls.length > 0) {
      this.currentImageIndex =
        (this.currentImageIndex - 1 + this.hotel.imageUrls.length) % this.hotel.imageUrls.length;
    }
  }

  /**
   * Get brand-specific color for styling
   * @returns Hex color code
   */
  getBrandColor(): string {
    return this.hotel ? BRAND_COLORS[this.hotel.brand] || '#000000' : '#000000';
  }

  /**
   * Get brand logo URL
   * @returns Path to logo asset
   */
  getBrandLogo(): string {
    return this.hotel ? BRAND_LOGOS[this.hotel.brand] || '' : '';
  }

  /**
   * Get array for star rating display
   * @returns Array with length equal to rating
   */
  getStarArray(): number[] {
    return this.hotel ? Array(Math.floor(this.hotel.rating)).fill(0) : [];
  }

  /**
   * Get amenities with corresponding icons
   * @returns Array of amenities with icons
   */
  getAmenitiesWithIcons(): Array<{name: string, icon: string}> {
    if (!this.hotel) return [];
    
    const iconMap: {[key: string]: string} = {
      'Pool': '🏊',
      'Fitness center': '💪',
      'Rooftop bar': '🍸',
      'Pets allowed': '🐕',
      'Free WiFi': '📶',
      'Parking': '🅿️',
      'Restaurant': '🍽️',
      'Spa': '💆',
      'Room service': '🛎️',
      'Business center': '💼'
    };

    return this.hotel.amenities.map(amenity => ({
      name: amenity,
      icon: iconMap[amenity] || '✓'
    }));
  }

  /**
   * Get thumbnail images (always returns 3 images)
   * @returns Array of 3 image URLs
   */
  getThumbnailImages(): string[] {
    if (!this.hotel || this.hotel.imageUrls.length === 0) return [];
    
    const images = this.hotel.imageUrls.slice(1, 4);
    
    // If we have fewer than 3 images, repeat from the beginning
    while (images.length < 3 && this.hotel.imageUrls.length > 0) {
      images.push(this.hotel.imageUrls[images.length % this.hotel.imageUrls.length]);
    }
    
    return images;
  }

  /**
   * Format nightly rate for display
   * @returns Formatted price string
   */
  formatPrice(): string {
    if (!this.hotel) return '';
    const { nightlyRate } = this.hotel.pricing;
    return `${nightlyRate.toFixed(0)}/night`;
  }

  /**
   * Get detailed price breakdown
   * @returns Formatted breakdown string
   */
  getPriceBreakdown(): string {
    if (!this.hotel) return '';
    const { roomRate, fees } = this.hotel.pricing;
    return `Room: ${roomRate.toFixed(0)} + Fees: ${fees.toFixed(0)}`;
  }

  /**
   * Open rate calendar modal
   */
  openRateCalendar(): void {
    // Emit event to parent to handle in conversational flow
    this.selectDatesRequested.emit();
  }

  /**
   * Handle date selection from calendar
   */
  onDateSelected(dateRange: DateRange): void {
    this.showRateCalendar = false;
    this.dateSelected.emit(dateRange);
  }

  /**
   * Close rate calendar
   */
  onCalendarClosed(): void {
    this.showRateCalendar = false;
  }

  /**
   * Get conversational chips based on current state
   */
  getConversationalChips(): Array<{icon: string, label: string, message: string}> {
    if (!this.hotel) return [];
    
    const hotelName = this.hotel.name;
    
    if (this.hasDates) {
      return [
        {
          icon: 'Beds',
          label: 'Show me rooms',
          message: `I want to explore rooms at ${hotelName}`
        },
        {
          icon: 'Hotel',
          label: 'Why is this a good fit?',
          message: `Why is ${hotelName} a good match for me?`
        }
      ];
    } else {
      return [
        {
          icon: 'Star',
          label: "I'm interested! Add dates",
          message: `I'm interested in ${hotelName}, input my dates`
        },
        {
          icon: 'Hotel',
          label: 'Why is this a good fit?',
          message: `Why is ${hotelName} a good match for me?`
        }
      ];
    }
  }

  /**
   * Update cached conversational chips
   */
  updateConversationalChips(): void {
    this.conversationalChips = this.getConversationalChips();
  }

  /**
   * Handle chip click
   */
  onChipClick(chip: {icon: string, label: string, message: string}): void {
    const isAddDatesChip = chip.icon === 'calendar' || chip.label.includes('Add dates') || chip.label.includes('interested');
    
    if (isAddDatesChip) {
      this.selectDatesRequested.emit();
    } else {
      this.chipSelected.emit(chip.message);
      setTimeout(() => {
        this.close();
      }, 50);
    }
  }

  /**
   * Handle back to chat click
   */
  onBackToChat(): void {
    this.backToChatClicked.emit();
    setTimeout(() => {
      this.close();
    }, 50);
  }

  /**
   * Get SVG path for chip icon
   */
  getChipIcon(iconName: string): string {
    const icons: {[key: string]: string} = {
      'calendar': 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      'bed': 'M3 12h18M3 16h18M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      'info': 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    };
    return icons[iconName] || icons['info'];
  }

  /**
   * Load rooms for the current hotel
   */
  loadRooms(): void {
    if (!this.hotel) {
      this.hotelRooms = [];
      return;
    }

    this.isLoadingRooms = true;
    this.http.get<Room[]>('/rooms.json').subscribe({
      next: (allRooms) => {
        this.hotelRooms = allRooms.filter(room => room.hotelId === this.hotel!.id);
        this.isLoadingRooms = false;
      },
      error: (error) => {
        console.error('Error loading rooms:', error);
        this.hotelRooms = [];
        this.isLoadingRooms = false;
      }
    });
  }

  /**
   * Handle room selection
   */
  onRoomSelected(room: Room): void {
    this.roomSelected.emit(room);
  }

  /**
   * Get rooms to display (max 3 for compact view)
   */
  getDisplayRooms(): Room[] {
    return this.hotelRooms.slice(0, 3);
  }

  /**
   * Load personalized description based on user context
   */
  loadPersonalizedDescription(): void {
    console.log('🔄 loadPersonalizedDescription called for hotel:', this.hotel?.name);
    
    if (!this.hotel) {
      console.log('⚠️ No hotel, skipping personalization');
      this.personalizedDescription = null;
      return;
    }

    // Get conversation state to extract trip type and interests
    this.conversationService.getState().pipe(take(1)).subscribe(state => {
      console.log('📊 Conversation state:', {
        tripType: state.conversationContext.tripType,
        amenities: state.conversationContext.amenities
      });

      const tripType = state.conversationContext.tripType;
      const interests = state.conversationContext.amenities || [];

      // Create cache key based on hotel ID, trip type, and interests
      const cacheKey = `${this.hotel!.id}_${tripType || 'none'}_${interests.sort().join(',')}`;
      console.log('🔑 Cache key:', cacheKey);

      // Check cache first
      if (HotelDetailDrawerComponent.descriptionCache.has(cacheKey)) {
        console.log('✅ Found in cache');
        this.personalizedDescription = HotelDetailDrawerComponent.descriptionCache.get(cacheKey)!;
        this.cdr.markForCheck();
        return;
      }

      // If no trip type or interests, use default description
      if (!tripType && interests.length === 0) {
        console.log('⚠️ No trip type or interests, using default description');
        this.personalizedDescription = null;
        return;
      }

      // Generate personalized description
      console.log('🚀 Generating personalized description...');
      this.isLoadingDescription = true;
      this.cdr.markForCheck();

      this.aiService.generatePersonalizedDescription(
        {
          name: this.hotel!.name,
          brand: this.hotel!.brand,
          description: this.hotel!.description,
          amenities: this.hotel!.amenities,
          sentiment: this.hotel!.sentiment
        },
        tripType,
        interests
      ).subscribe({
        next: (description) => {
          console.log('✅ Personalized description received:', description);
          this.personalizedDescription = description;
          this.isLoadingDescription = false;
          
          // Cache the result
          HotelDetailDrawerComponent.descriptionCache.set(cacheKey, description);
          
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('❌ Error loading personalized description:', error);
          this.personalizedDescription = null;
          this.isLoadingDescription = false;
          this.cdr.markForCheck();
        }
      });
    });
  }

  /**
   * Get the description to display (personalized or default)
   */
  getDisplayDescription(): string {
    if (this.isLoadingDescription) {
      return 'Personalizing description for your trip...';
    }
    return this.personalizedDescription || this.hotel?.description || '';
  }
}

