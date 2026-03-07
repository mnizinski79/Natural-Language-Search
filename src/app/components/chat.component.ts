import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../models/message.model';
import { Hotel } from '../models/hotel.model';
import { Room } from '../models/room.model';
import { DateSelection } from '../models/date-selection.model';
import { ThinkingAnimationComponent } from './thinking-animation.component';
import { HotelCardComponent } from './hotel-card.component';
import { RoomCardComponent } from './room-card.component';
import { DatePickerComponent } from './date-picker.component';
import { MapComponent } from './map.component';
import { RateCalendarComponent, DateRange } from './rate-calendar.component';
import { BRAND_COLORS, BRAND_LOGOS } from '../models/brand-config';
import { MarkdownPipe } from '../pipes/markdown.pipe';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ThinkingAnimationComponent, HotelCardComponent, RoomCardComponent, DatePickerComponent, MapComponent, RateCalendarComponent, MarkdownPipe],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
/**
 * ChatComponent - Conversation message display
 *
 * Displays the conversation history between user and AI, including:
 * - User and AI messages with different styling
 * - Thinking animation during AI processing
 * - Inline hotel cards (mobile: max 3 cards)
 * - Date picker inline display
 * - Auto-scroll to latest message
 *
 * Handles both desktop and mobile layouts with different card display strategies.
 *
 * @example
 * <app-chat
 *   [messages]="conversationMessages"
 *   [isThinking]="aiProcessing"
 *   [isMobile]="isMobileView"
 *   (dateSelected)="handleDateSelection($event)"
 *   (hotelCardClicked)="openHotelDetails($event)"
 *   (viewAllClicked)="showMapOverlay()">
 * </app-chat>
 */
export class ChatComponent implements AfterViewChecked {
  /** Array of conversation messages to display */
  @Input() messages: Message[] = [];

  /** Whether AI is currently processing (shows thinking animation) */
  @Input() isThinking: boolean = false;

  /** Whether in mobile layout mode */
  @Input() isMobile: boolean = false;

  /** Map center coordinates for inline map preview */
  @Input() mapCenter: [number, number] = [40.7580, -73.9855];

  /** Map zoom level for inline map preview */
  @Input() mapZoom: number = 13;

  /** Emitted when user selects dates from date picker */
  @Output() dateSelected = new EventEmitter<DateSelection>();

  /** Emitted when user clicks a hotel card */
  @Output() hotelCardClicked = new EventEmitter<Hotel>();

  /** Emitted when user clicks "View All" button (mobile) */
  @Output() viewAllClicked = new EventEmitter<void>();

  /** Emitted when user clicks expand map button */
  @Output() expandMapClicked = new EventEmitter<void>();

  /** Emitted when user clicks "View All" rooms button */
  @Output() viewAllRoomsClicked = new EventEmitter<Hotel>();

  /** Emitted when user clicks a room card */
  @Output() roomCardClicked = new EventEmitter<Room>();

  /** Emitted when user clicks a map marker in inline preview */
  @Output() mapMarkerClicked = new EventEmitter<Hotel>();

  /** Emitted when user clicks an AI response chip */
  @Output() chipClicked = new EventEmitter<string>();

  /** Reference to messages list container for scrolling */
  @ViewChild('messagesList') messagesList?: ElementRef;

  /** ID of message currently showing date picker */
  showDatePickerForMessage: string | null = null;

  /** Set of message IDs with minimized rate calendars */
  minimizedRateCalendars: Set<string> = new Set();

  /** Set of message IDs with minimized date pickers */
  minimizedDatePickers: Set<string> = new Set();

  /** Map to store selected dates for each message */
  selectedDatesMap: Map<string, { checkIn: Date; checkOut: Date }> = new Map();

  /** Whether chat panel is collapsed to header-only state */
  isCollapsed: boolean = false;

  /** Track if we should scroll to bottom on next view check */
  private shouldScrollToBottom: boolean = false;

  /** Previous message count for detecting new messages */
  private previousMessageCount: number = 0;

  ngAfterViewChecked(): void {
    // Auto-scroll when new messages are added
    if (this.shouldScrollToBottom && this.messagesList) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }

    // Detect new messages
    if (this.messages.length > this.previousMessageCount) {
      this.shouldScrollToBottom = true;
      this.previousMessageCount = this.messages.length;
    }
  }

  /**
   * Get hotels to display inline (mobile only, max 3)
   * @param message - Message containing hotels
   * @returns Array of up to 3 hotels for inline display
   */
  getInlineHotels(message: Message): Hotel[] {
    if (!message.hotels || !this.isMobile) {
      return [];
    }
    return message.hotels.slice(0, 3);
  }

  /**
   * Check if message has more than 3 hotels (show "View All" button)
   * @param message - Message to check
   * @returns True if more than 3 hotels available
   */
  hasMoreHotels(message: Message): boolean {
    return !!(message.hotels && message.hotels.length > 3);
  }

  /**
   * Handle "View All" button click
   */
  onViewAllClick(): void {
    this.viewAllClicked.emit();
  }

  /**
   * Handle hotel card click
   * @param hotel - Clicked hotel object
   */
  onCardClick(hotel: Hotel): void {
    this.hotelCardClicked.emit(hotel);
  }

  /**
   * Get date prompt message based on result count
   * @param message - Message with hotel results
   * @returns Contextual prompt message
   */
  getDatePromptMessage(message: Message): string {
    const resultCount = message.hotels?.length || 0;
    const optionText = resultCount === 1 ? 'option' : 'options';
    return `You're down to ${resultCount} great ${optionText}. Prices vary by date — want to check availability?`;
  }

  /**
   * Show date picker for a specific message
   * @param messageId - ID of message to show picker for
   */
  onSelectDatesClick(messageId: string): void {
    this.showDatePickerForMessage = messageId;
  }

  /**
   * Check if date picker should be shown for a message
   * @param messageId - Message ID to check
   * @returns True if picker is visible for this message
   */
  isDatePickerVisible(messageId: string): boolean {
    return this.showDatePickerForMessage === messageId;
  }

  /**
   * Collapse chat panel to header-only state
   * @returns Promise that resolves after animation completes
   */
  collapse(): Promise<void> {
    return new Promise((resolve) => {
      this.isCollapsed = true;
      // CSS transition handles animation (350ms)
      setTimeout(resolve, 350);
    });
  }

  /**
   * Expand chat panel to full state
   * @returns Promise that resolves after animation completes
   */
  expand(): Promise<void> {
    return new Promise((resolve) => {
      this.isCollapsed = false;
      // CSS transition handles animation (350ms)
      setTimeout(resolve, 350);
    });
  }

  /**
   * Toggle collapsed state (for chevron click)
   */
  toggleCollapse(): void {
    if (this.isCollapsed) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  /**
   * Handle expand map button click
   */
  onExpandMapClick(): void {
    this.expandMapClicked.emit();
  }

  /**
   * Handle map marker click in inline preview
   */
  onMapMarkerClick(hotel: Hotel): void {
    this.mapMarkerClicked.emit(hotel);
  }

  /**
   * Handle rate calendar date selection
   */
  onRateCalendarDatesSelected(dateRange: DateRange, messageId: string): void {
    // Store the selected dates
    this.selectedDatesMap.set(messageId, {
      checkIn: dateRange.checkIn,
      checkOut: dateRange.checkOut
    });
    
    // Minimize the rate calendar after selection
    this.minimizedRateCalendars.add(messageId);
    
    this.dateSelected.emit({
      checkIn: dateRange.checkIn,
      checkOut: dateRange.checkOut
    });
  }

  /**
   * Handle rate calendar close
   */
  onRateCalendarClosed(messageId: string): void {
    // Minimize the rate calendar when closed
    this.minimizedRateCalendars.add(messageId);
  }

  /**
   * Check if rate calendar should be shown (not minimized)
   */
  isRateCalendarVisible(messageId: string): boolean {
    return !this.minimizedRateCalendars.has(messageId);
  }

  /**
   * Expand a minimized rate calendar
   */
  expandRateCalendar(messageId: string): void {
    this.minimizedRateCalendars.delete(messageId);
  }

  /**
   * Handle date picker date selection
   */
  onDatesSelected(selection: DateSelection, messageId: string): void {
    // Store the selected dates
    this.selectedDatesMap.set(messageId, {
      checkIn: selection.checkIn,
      checkOut: selection.checkOut
    });
    
    // Minimize the date picker after selection
    this.minimizedDatePickers.add(messageId);
    
    this.dateSelected.emit(selection);
  }

  /**
   * Handle date picker cancellation
   */
  onDatePickerCancelled(messageId: string): void {
    // Minimize the date picker when cancelled
    this.minimizedDatePickers.add(messageId);
  }

  /**
   * Check if date picker is minimized
   */
  isDatePickerMinimized(messageId: string): boolean {
    return this.minimizedDatePickers.has(messageId);
  }

  /**
   * Expand a minimized date picker
   */
  expandDatePicker(messageId: string): void {
    this.minimizedDatePickers.delete(messageId);
  }

  /**
   * Get formatted dates text for minimized view
   */
  getMinimizedDatesText(messageId: string): string {
    const dates = this.selectedDatesMap.get(messageId);
    if (!dates) {
      return 'Select dates';
    }

    const checkInStr = dates.checkIn.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const checkOutStr = dates.checkOut.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });

    return `Selected dates: ${checkInStr} - ${checkOutStr}`;
  }

  /**
   * Get brand color for hotel
   */
  getBrandColor(hotel: Hotel): string {
    return BRAND_COLORS[hotel.brand] || '#111827';
  }

  /**
   * Handle AI chip click
   * @param chip - Clicked chip text
   */
  onChipClick(chip: string): void {
    this.chipClicked.emit(chip);
  }

  /**
   * Scroll to the bottom of the chat (latest message)
   * Used when chip is clicked to show the new message
   */
  scrollToBottom(): void {
    if (this.messagesList) {
      const element = this.messagesList.nativeElement;
      setTimeout(() => {
        element.scrollTop = element.scrollHeight;
      }, 100);
    }
  }

  /**
   * Request scroll to bottom on next view check
   * Called externally when a chip message is sent
   */
  requestScrollToBottom(): void {
    this.shouldScrollToBottom = true;
  }

  /**
   * Get inline rooms to display (mobile: max 2)
   */
  getInlineRooms(message: Message): Room[] {
    if (!message.rooms || !this.isMobile) {
      return [];
    }
    return message.rooms.slice(0, 2);
  }

  /**
   * Handle room card click
   */
  onRoomCardClick(room: Room): void {
    this.roomCardClicked.emit(room);
  }

  /**
   * Handle "View All" rooms button click
   */
  onViewAllRoomsClick(hotel: Hotel): void {
    this.viewAllRoomsClicked.emit(hotel);
  }

  /**
   * Get brand logo URL
   */
  getBrandLogo(hotel: Hotel): string {
    return BRAND_LOGOS[hotel.brand] || 'assets/logos/independent-logo.png';
  }
}
