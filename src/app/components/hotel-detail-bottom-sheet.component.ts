import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
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
  selector: 'app-hotel-detail-bottom-sheet',
  standalone: true,
  imports: [CommonModule, RateCalendarComponent, MapComponent, RoomCardComponent],
  templateUrl: './hotel-detail-bottom-sheet.component.html',
  styleUrls: ['./hotel-detail-bottom-sheet.component.css']
})
export class HotelDetailBottomSheetComponent implements OnChanges, AfterViewInit {
  @Input() hotel: Hotel | null = null;
  @Input() visible: boolean = false;
  @Input() isMapContext: boolean = false; // True if opened from map overlay
  @Input() hasDates: boolean = false;
  @Output() closed = new EventEmitter<void>();
  @Output() dateSelected = new EventEmitter<DateRange>();
  @Output() selectDatesRequested = new EventEmitter<void>();
  @Output() chipSelected = new EventEmitter<string>(); // New output for chip selection
  @Output() backToChatClicked = new EventEmitter<void>(); // New output for back to chat
  @Output() showRoomsRequested = new EventEmitter<Hotel>(); // New output for show rooms
  @Output() roomSelected = new EventEmitter<Room>(); // New output for room selection

  @ViewChild('sheetContainer') sheetContainer?: ElementRef;

  currentImageIndex: number = 0;
  isCollapsed: boolean = true;
  showRateCalendar: boolean = false;
  isClosing: boolean = false; // Track closing animation state
  private previouslyFocusedElement: HTMLElement | null = null;
  conversationalChips: Array<{icon: string, label: string, message: string}> = []; // Cache chips
  hotelRooms: Room[] = []; // Rooms for this hotel
  isLoadingRooms: boolean = false;

  // Personalized description
  personalizedDescription: string | null = null;
  isLoadingDescription: boolean = false;
  private static descriptionCache: Map<string, string> = new Map();

  // Gesture tracking
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private isDragging: boolean = false;
  private contentScrollTop: number = 0;

  constructor(
    private http: HttpClient,
    private aiService: AIService,
    private conversationService: ConversationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hotel'] && this.hotel) {
      this.currentImageIndex = 0;
      this.updateConversationalChips(); // Update chips when hotel changes
      this.loadRooms(); // Load rooms for this hotel
      this.loadPersonalizedDescription(); // Load personalized description
    }

    if (changes['hasDates']) {
      this.updateConversationalChips(); // Update chips when dates change
    }

    if (changes['visible']) {
      if (this.visible) {
        this.isCollapsed = true; // Reset to collapsed state when opened
        this.isClosing = false; // Reset closing state
        this.updateConversationalChips(); // Update chips when opened
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

  private trapFocus(): void {
    setTimeout(() => {
      if (this.sheetContainer) {
        this.previouslyFocusedElement = document.activeElement as HTMLElement;
        const firstFocusable = this.sheetContainer.nativeElement.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) {
          (firstFocusable as HTMLElement).focus();
        }
      }
    }, 100);
  }

  private restoreFocus(): void {
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
      this.previouslyFocusedElement = null;
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.visible) {
      event.preventDefault();
      this.close();
    }
  }

  @HostListener('document:keydown.arrowleft', ['$event'])
  onArrowLeft(event: KeyboardEvent): void {
    if (this.visible && this.hotel && this.hotel.imageUrls.length > 1) {
      event.preventDefault();
      this.previousImage();
    }
  }

  @HostListener('document:keydown.arrowright', ['$event'])
  onArrowRight(event: KeyboardEvent): void {
    if (this.visible && this.hotel && this.hotel.imageUrls.length > 1) {
      event.preventDefault();
      this.nextImage();
    }
  }

  close(): void {
    console.log('🔴 Bottom sheet close() called');
    this.isClosing = true;
    // Wait for animation to complete before emitting closed event
    setTimeout(() => {
      console.log('🔴 Bottom sheet emitting closed event');
      this.isClosing = false;
      this.closed.emit();
    }, 300); // Match animation duration
  }

  nextImage(): void {
    if (this.hotel && this.hotel.imageUrls.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.hotel.imageUrls.length;
    }
  }

  previousImage(): void {
    if (this.hotel && this.hotel.imageUrls.length > 0) {
      this.currentImageIndex = 
        (this.currentImageIndex - 1 + this.hotel.imageUrls.length) % this.hotel.imageUrls.length;
    }
  }

  getBrandColor(): string {
    return this.hotel ? BRAND_COLORS[this.hotel.brand] || '#000000' : '#000000';
  }

  getBrandLogo(): string {
    return this.hotel ? BRAND_LOGOS[this.hotel.brand] || '' : '';
  }

  getStarArray(): number[] {
    return this.hotel ? Array(Math.floor(this.hotel.rating)).fill(0) : [];
  }

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

  getThumbnailImages(): string[] {
    if (!this.hotel || this.hotel.imageUrls.length === 0) return [];
    
    const images = this.hotel.imageUrls.slice(1, 4);
    
    while (images.length < 3 && this.hotel.imageUrls.length > 0) {
      images.push(this.hotel.imageUrls[images.length % this.hotel.imageUrls.length]);
    }
    
    return images;
  }

  formatPrice(): string {
    if (!this.hotel) return '';
    const { nightlyRate } = this.hotel.pricing;
    return `${nightlyRate.toFixed(0)}/night`;
  }

  getPriceBreakdown(): string {
    if (!this.hotel) return '';
    const { roomRate, fees } = this.hotel.pricing;
    return `Room: ${roomRate.toFixed(0)} + Fees: ${fees.toFixed(0)}`;
  }

  onBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('bottom-sheet-backdrop')) {
      this.close();
    }
  }

  toggleExpand(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  getSheetHeightPercent(): number {
    // Always show full screen (100%) in both map and chat contexts
    return 100;
  }

  onTouchStart(event: TouchEvent): void {
    if (!this.isMapContext) return; // Only handle gestures in map context

    const touch = event.touches[0];
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
    this.isDragging = false;

    // Check if user is touching the drag handle area or if content is scrolled to top
    const sheetContent = this.sheetContainer?.nativeElement.querySelector('.sheet-content');
    if (sheetContent) {
      this.contentScrollTop = sheetContent.scrollTop;
    }

    // Only allow dragging if:
    // 1. Touching the drag handle area (top 60px), OR
    // 2. Content is scrolled to the top and swiping down
    const dragHandleHeight = 60;
    const isTouchingDragHandle = touch.clientY < dragHandleHeight + (window.innerHeight * (1 - this.getSheetHeightPercent() / 100));
    
    if (isTouchingDragHandle || this.contentScrollTop === 0) {
      this.isDragging = true;
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isMapContext || !this.isDragging) return;

    const touch = event.touches[0];
    const deltaY = touch.clientY - this.touchStartY;

    // If content is scrolled and user is trying to scroll down, allow normal scrolling
    if (this.contentScrollTop > 0 && deltaY > 0) {
      this.isDragging = false;
      return;
    }

    // Prevent default scrolling when dragging the sheet
    if (Math.abs(deltaY) > 10) {
      event.preventDefault();
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (!this.isMapContext || !this.isDragging) return;

    const touch = event.changedTouches[0];
    const deltaY = touch.clientY - this.touchStartY;
    const deltaTime = Date.now() - this.touchStartTime;
    const velocity = Math.abs(deltaY) / deltaTime; // pixels per ms

    const SWIPE_THRESHOLD = 100; // pixels
    const VELOCITY_THRESHOLD = 0.3; // pixels per ms (300 px/s)

    // Only handle swipe down to dismiss (no expand/collapse states)
    const isSwipeDown = deltaY > SWIPE_THRESHOLD || (velocity > VELOCITY_THRESHOLD && deltaY > 0);

    if (isSwipeDown) {
      // Dismiss the sheet
      this.close();
    }

    this.isDragging = false;
  }

  openRateCalendar(): void {
    // Emit event to parent to handle in conversational flow
    this.selectDatesRequested.emit();
  }

  onDateSelected(dateRange: DateRange): void {
    this.showRateCalendar = false;
    this.dateSelected.emit(dateRange);
  }

  onCalendarClosed(): void {
    this.showRateCalendar = false;
  }

  getConversationalChips(): Array<{icon: string, label: string, message: string}> {
    console.log('🎯 getConversationalChips called, hotel:', this.hotel?.name, 'hasDates:', this.hasDates);
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

  updateConversationalChips(): void {
    console.log('🔄 Updating conversational chips');
    this.conversationalChips = this.getConversationalChips();
  }

  onChipClick(chip: {icon: string, label: string, message: string}): void {
    console.log('💬 Chip clicked:', chip.label);
    
    // Check if this is the "Add dates" chip or "Show me rooms" chip
    const isAddDatesChip = chip.icon === 'calendar' || chip.label.includes('Add dates') || chip.label.includes('interested');
    const isShowRoomsChip = chip.icon === 'bed' || chip.label.includes('Show me rooms');
    
    // Start closing animation immediately
    this.close();
    
    // Emit events after a brief delay to ensure animation starts
    setTimeout(() => {
      if (isAddDatesChip) {
        console.log('📅 Add dates chip - opening rate calendar');
        this.selectDatesRequested.emit();
      } else if (isShowRoomsChip && this.hotel) {
        console.log('🛏️ Show rooms chip - requesting rooms view');
        this.showRoomsRequested.emit(this.hotel);
      } else {
        console.log('💬 Chip message emitted');
        this.chipSelected.emit(chip.message);
      }
    }, 50);
  }

  onBackToChat(): void {
    console.log('⬅️ Back to chat clicked');
    
    // Start closing animation immediately
    this.close();
    
    // Emit event after a brief delay to ensure animation starts
    setTimeout(() => {
      console.log('⬅️ Back to chat event emitted');
      this.backToChatClicked.emit();
    }, 50);
  }

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
   * Load personalized description based on user context
   */
  loadPersonalizedDescription(): void {
    console.log('🔄 [Bottom Sheet] loadPersonalizedDescription called for hotel:', this.hotel?.name);
    
    if (!this.hotel) {
      console.log('⚠️ [Bottom Sheet] No hotel, skipping personalization');
      this.personalizedDescription = null;
      return;
    }

    // Get conversation state to extract trip type and interests
    this.conversationService.getState().pipe(take(1)).subscribe(state => {
      console.log('📊 [Bottom Sheet] Conversation state:', {
        tripType: state.conversationContext.tripType,
        amenities: state.conversationContext.amenities
      });

      const tripType = state.conversationContext.tripType;
      const interests = state.conversationContext.amenities || [];

      // Create cache key based on hotel ID, trip type, and interests
      const cacheKey = `${this.hotel!.id}_${tripType || 'none'}_${interests.sort().join(',')}`;
      console.log('🔑 [Bottom Sheet] Cache key:', cacheKey);

      // Check cache first
      if (HotelDetailBottomSheetComponent.descriptionCache.has(cacheKey)) {
        console.log('✅ [Bottom Sheet] Found in cache');
        this.personalizedDescription = HotelDetailBottomSheetComponent.descriptionCache.get(cacheKey)!;
        this.cdr.markForCheck();
        return;
      }

      // If no trip type or interests, use default description
      if (!tripType && interests.length === 0) {
        console.log('⚠️ [Bottom Sheet] No trip type or interests, using default description');
        this.personalizedDescription = null;
        return;
      }

      // Generate personalized description
      console.log('🚀 [Bottom Sheet] Generating personalized description...');
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
          console.log('✅ [Bottom Sheet] Personalized description received:', description);
          this.personalizedDescription = description;
          this.isLoadingDescription = false;
          
          // Cache the result
          HotelDetailBottomSheetComponent.descriptionCache.set(cacheKey, description);
          
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('❌ [Bottom Sheet] Error loading personalized description:', error);
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

  /**
   * Get rooms to display (max 3 for compact view)
   */
  getDisplayRooms(): Room[] {
    return this.hotelRooms.slice(0, 3);
  }
}

