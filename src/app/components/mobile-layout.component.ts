import { Component, Input, Output, EventEmitter, ViewChild, OnChanges, SimpleChanges, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './chat.component';
import { HelperTagsComponent } from './helper-tags.component';
import { InputComponent } from './input.component';
import { MapComponent } from './map.component';
import { HotelCardComponent } from './hotel-card.component';
import { HotelDetailBottomSheetComponent } from './hotel-detail-bottom-sheet.component';
import { Hotel } from '../models/hotel.model';
import { Message } from '../models/message.model';
import { DateSelection } from '../models/date-selection.model';
import { BRAND_COLORS } from '../models/brand-config';

@Component({
  selector: 'app-mobile-layout',
  standalone: true,
  imports: [
    CommonModule,
    ChatComponent,
    HelperTagsComponent,
    InputComponent,
    MapComponent,
    HotelCardComponent,
    HotelDetailBottomSheetComponent
  ],
  templateUrl: './mobile-layout.component.html',
  styleUrls: ['./mobile-layout.component.css']
})
export class MobileLayoutComponent implements OnChanges {
  @Input() messages: Message[] = [];
  @Input() isThinking: boolean = false;
  @Input() hotels: Hotel[] = [];
  @Input() selectedHotel: Hotel | null = null;
  @Input() showBottomSheet: boolean = false;
  @Input() isMapContext: boolean = false; // Passed from parent
  @Input() inputDisabled: boolean = false;
  @Input() mapCenter: [number, number] = [40.7580, -73.9855];
  @Input() mapZoom: number = 13;
  @Input() hasDates: boolean = false;
  @Input() placeholder: string = "Ask me about hotels in NYC...";

  @Output() messageSent = new EventEmitter<string>();
  @Output() tagClicked = new EventEmitter<string>();
  @Output() hotelCardClicked = new EventEmitter<Hotel>();
  @Output() markerClicked = new EventEmitter<Hotel>();
  @Output() bottomSheetClosed = new EventEmitter<void>();
  @Output() viewAllClicked = new EventEmitter<void>();
  @Output() dateSelected = new EventEmitter<DateSelection>();
  @Output() selectDatesRequested = new EventEmitter<Hotel>();
  @Output() chipSelected = new EventEmitter<string>(); // New output for chip messages

  @ViewChild(MapComponent) mapComponent?: MapComponent;
  @ViewChild(InputComponent) inputComponent?: InputComponent;
  @ViewChild(ChatComponent) chatComponent?: ChatComponent;
  @ViewChild('chatContainer') chatContainer?: ElementRef;

  showMapOverlay: boolean = false;
  private originalViewport: { center: { lat: number; lng: number }; zoom: number } | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    // When a hotel is selected in map context, center the map on it
    if (changes['selectedHotel']) {
      if (this.selectedHotel && this.isMapContext && this.showMapOverlay) {
        // Store original viewport before centering
        this.storeOriginalViewport();
        this.centerMapOnSelectedHotel();
      } else if (!this.selectedHotel && this.originalViewport) {
        // Restore viewport when selection is cleared
        this.restoreOriginalViewport();
      }
    }
  }

  /**
   * Center the map on the selected hotel with offset for bottom sheet
   * Positions the pin at approximately 20% from the top of the screen
   */
  private centerMapOnSelectedHotel(): void {
    if (!this.mapComponent || !this.selectedHotel) {
      console.log('❌ Cannot center map - mapComponent or selectedHotel missing');
      return;
    }

    // Wait for the map to be ready
    setTimeout(() => {
      if (this.mapComponent && this.selectedHotel) {
        // Position the pin at 20% from the top of the screen
        // This keeps it visible above the bottom sheet (which is at 66.67% height)
        const screenHeight = window.innerHeight;
        const targetPositionFromTop = screenHeight * 0.20; // 20% from top
        
        // Calculate offset: how much to shift the map center
        // Positive offset moves the pin UP on screen (shifts map center DOWN)
        const offsetPixels = targetPositionFromTop;
        
        console.log('📍 Map centering calculation:', {
          screenHeight,
          targetPositionFromTop,
          offsetPixels,
          hotelId: this.selectedHotel.id,
          hotelName: this.selectedHotel.name
        });
        
        // Center on the hotel with offset
        this.mapComponent.centerOnHotel(this.selectedHotel.id, offsetPixels);
      }
    }, 100);
  }

  onMessageSent(message: string): void {
    this.messageSent.emit(message);
  }

  onTagClicked(query: string): void {
    this.tagClicked.emit(query);
  }

  onHotelCardClicked(hotel: Hotel): void {
    // If map overlay is showing, treat card click same as marker click (map context)
    if (this.showMapOverlay) {
      this.onMarkerClicked(hotel);
    } else {
      // Otherwise, it's from chat view (not map context)
      this.hotelCardClicked.emit(hotel);
    }
  }

  onMarkerClicked(hotel: Hotel): void {
    this.markerClicked.emit(hotel);
  }

  onBottomSheetClosed(): void {
    console.log('📱 Mobile layout: bottom sheet closed event received');
    // Don't close map overlay here - let it stay open
    // Map overlay should only close when user explicitly closes it or selects dates
    this.bottomSheetClosed.emit();
  }

  onViewAllClicked(): void {
    this.showMapOverlay = true;
    this.viewAllClicked.emit();
  }

  closeMapOverlay(): void {
    this.showMapOverlay = false;
  }

  onDateSelected(selection: DateSelection): void {
    this.dateSelected.emit(selection);
  }


  /**
   * Store the current map viewport before centering on a hotel
   * This allows restoration when the bottom sheet is closed
   */
  private storeOriginalViewport(): void {
    if (!this.mapComponent) {
      return;
    }

    try {
      const viewport = this.mapComponent.getCurrentViewport();
      if (viewport) {
        this.originalViewport = viewport;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error storing original viewport:', errorMessage);
      // Continue without storing viewport
    }
  }

  /**
   * Restore the original map viewport or show all hotels if no viewport stored
   * Called when the bottom sheet is closed
   */
  private restoreOriginalViewport(): void {
    if (!this.mapComponent) {
      return;
    }

    try {
      if (this.originalViewport) {
        // Restore to the stored viewport
        this.mapComponent.restoreViewport(this.originalViewport);
        this.originalViewport = null;
      } else if (this.hotels.length > 0) {
        // No stored viewport - restore to default view showing all hotels
        console.warn('No original viewport stored, restoring to default view');
        // The map component will automatically center on all hotels
        // when updateMarkers is called, so we just need to trigger a refresh
        // This is handled by the map component's internal logic
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error restoring viewport:', errorMessage);
      // Continue without restoring viewport
    }
  }

  onSelectDatesRequested(): void {
    // Close map overlay to ensure user sees chat with rate calendar
    if (this.showMapOverlay) {
      this.showMapOverlay = false;
    }
    
    if (this.selectedHotel) {
      this.selectDatesRequested.emit(this.selectedHotel);
      
      // Scroll to bottom to show the rate calendar after it's added
      setTimeout(() => {
        this.scrollChatToBottom();
      }, 400);
    }
  }

  onChipSelected(message: string): void {
    console.log('📱 Mobile layout: chip selected:', message);
    // Close map overlay when chip is selected
    if (this.showMapOverlay) {
      this.showMapOverlay = false;
    }
    
    // Emit the chip message to be sent as a user message
    this.chipSelected.emit(message);
    
    // Scroll to bottom to show the new message after it's added
    setTimeout(() => {
      this.scrollChatToBottom();
    }, 300);
  }

  /**
   * Scroll the chat container to show the latest user message at the top
   */
  private scrollChatToBottom(): void {
    if (this.chatContainer) {
      const container = this.chatContainer.nativeElement;
      
      // Find all message wrappers
      const messageWrappers = container.querySelectorAll('.message-wrapper');
      
      if (messageWrappers.length > 1) {
        // Get the second-to-last message (the user's chip message)
        // The last message is the AI response with the calendar
        const userMessage = messageWrappers[messageWrappers.length - 2] as HTMLElement;
        
        // Scroll to position the user message at the top of the viewport
        // Account for header and add padding
        const messageTop = userMessage.offsetTop;
        
        container.scrollTo({
          top: messageTop - 80, // Increased offset to account for header + padding
          behavior: 'smooth'
        });
      } else if (messageWrappers.length === 1) {
        // If there's only one message, scroll to it
        const lastMessage = messageWrappers[0] as HTMLElement;
        const messageTop = lastMessage.offsetTop;
        
        container.scrollTo({
          top: messageTop - 80,
          behavior: 'smooth'
        });
      }
    }
  }

  onBackToChatClicked(): void {
    console.log('📱 Mobile layout: back to chat clicked');
    // Close map overlay and bottom sheet, return to chat
    if (this.showMapOverlay) {
      this.showMapOverlay = false;
    }
    
    // Set context tag with hotel name and brand color, then focus input
    if (this.selectedHotel && this.inputComponent) {
      const brandColor = BRAND_COLORS[this.selectedHotel.brand] || '#1F4456';
      this.inputComponent.setContextTag(this.selectedHotel.name, brandColor);
      this.inputComponent.focusInput();
    }
    
    // Close the bottom sheet
    this.bottomSheetClosed.emit();
  }

  onChipClicked(message: string): void {
    console.log('📱 Mobile layout: chip clicked:', message);
    // Close map overlay when chip is clicked
    if (this.showMapOverlay) {
      this.showMapOverlay = false;
    }
    
    // Emit the chip message to be sent as a user message
    this.messageSent.emit(message);
    
    // Scroll to bottom to show the new message after it's added
    setTimeout(() => {
      this.scrollChatToBottom();
    }, 300);
  }

  onShowRoomsRequested(hotel: Hotel): void {
    console.log('🛏️ Mobile layout: show rooms requested for:', hotel.name);
    // Close map overlay to ensure user sees chat
    if (this.showMapOverlay) {
      this.showMapOverlay = false;
    }
    
    // Add user message to chat
    const userMessage = `Show rooms for ${hotel.name}`;
    this.messageSent.emit(userMessage);
    
    // Scroll to bottom to show the new message
    setTimeout(() => {
      this.scrollChatToBottom();
    }, 300);
  }
}
