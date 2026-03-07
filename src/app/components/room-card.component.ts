import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room } from '../models/room.model';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-room-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-card.component.html',
  styleUrls: ['./room-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoomCardComponent {
  @Input() room!: Room;
  @Input() variant: 'desktop' | 'mobile' | 'compact' = 'desktop';
  @Input() showPricing: boolean = true; // Show pricing or amenities
  @Output() roomSelected = new EventEmitter<Room>();

  onSelect(): void {
    if (this.room.availability !== 'unavailable') {
      this.roomSelected.emit(this.room);
    }
  }

  /**
   * Extract bed count from bedType string
   * Examples: "1 King Bed" -> "2", "2 Queen Beds" -> "2"
   */
  getBedCount(): string {
    const match = this.room.bedType.match(/^(\d+)/);
    return match ? match[1] : '1';
  }

  /**
   * Calculate strikethrough price (add ~20% to total rate)
   */
  getStrikethroughPrice(): string {
    const strikethrough = Math.round(this.room.pricing.totalRate * 1.2);
    return strikethrough.toString();
  }

  /**
   * Get highlighted amenities (first 2 for compact view)
   */
  getHighlightedAmenities(): string[] {
    return this.room.amenities.slice(0, 2);
  }
}
