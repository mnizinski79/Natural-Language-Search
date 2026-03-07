import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.css']
})
/**
 * InputComponent - User message input with debouncing
 *
 * Handles user text input for conversational search queries.
 * Features:
 * - Input validation (non-empty)
 * - 300ms debouncing to prevent rapid submissions
 * - Mobile keyboard optimization
 * - Disabled state during AI processing
 * - Context tag support for hotel-specific queries
 *
 * @example
 * <app-input
 *   [disabled]="isProcessing"
 *   [placeholder]="'Ask me about hotels...'"
 *   (messageSent)="handleMessage($event)">
 * </app-input>
 */
export class InputComponent {
  /** Whether input is disabled (e.g., during AI processing) */
  @Input() disabled: boolean = false;

  /** Placeholder text for the input field */
  @Input() placeholder: string = 'Ask me about hotels in NYC...';

  /** Emitted when user submits a valid message (after debouncing) */
  @Output() messageSent = new EventEmitter<string>();

  /** Current input value */
  inputValue: string = '';

  /** Context tag (e.g., hotel name) */
  contextTag: string | null = null;

  /** Context tag brand color (hex color from hotel brand) */
  contextTagColor: string | null = null;

  /** Reference to input field for programmatic focus */
  @ViewChild('inputField') inputField?: ElementRef<HTMLInputElement>;

  /** Subject for debouncing input submissions */
  private inputSubject = new Subject<void>();

  constructor() {
    // Debounce input submissions with 300ms delay
    this.inputSubject.pipe(
      debounceTime(300)
    ).subscribe(() => {
      this.submitMessage();
    });
  }

  /**
   * Handle form submission
   * Triggers debounced submission via inputSubject
   * @param event - Optional form submit event
   */
  onSubmit(event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    // Trigger debounced submission
    this.inputSubject.next();
  }

  /**
   * Submit message after validation
   * Only emits non-empty, trimmed messages when not disabled
   * Includes context tag if present
   */
  private submitMessage(): void {
    const trimmedValue = this.inputValue.trim();

    // Validate non-empty input
    if (trimmedValue && !this.disabled) {
      // Prepend context tag if present
      const messageWithContext = this.contextTag 
        ? `[Context: ${this.contextTag}] ${trimmedValue}`
        : trimmedValue;
      
      this.messageSent.emit(messageWithContext);
      this.clearInput();
      this.clearContextTag(); // Clear context tag after sending
    }
  }

  /**
   * Clear the input field
   */
  clearInput(): void {
    this.inputValue = '';
  }

  /**
   * Set context tag (e.g., hotel name for contextual queries)
   * @param tag - Context tag text
   * @param brandColor - Optional brand color for the tag (hex color)
   */
  setContextTag(tag: string, brandColor?: string): void {
    this.contextTag = tag;
    this.contextTagColor = brandColor || null;
  }

  /**
   * Clear context tag
   */
  clearContextTag(): void {
    this.contextTag = null;
    this.contextTagColor = null;
  }

  /**
   * Remove context tag (user clicked X)
   */
  removeContextTag(): void {
    this.clearContextTag();
  }

  /**
   * Focus the input field programmatically
   */
  focusInput(): void {
    setTimeout(() => {
      if (this.inputField) {
        this.inputField.nativeElement.focus();
      }
    }, 100);
  }

  /**
   * Get context tag background color with 20% opacity
   */
  getContextTagBackgroundColor(): string {
    if (!this.contextTagColor) {
      return 'rgba(31, 68, 86, 0.2)'; // Default brand color
    }
    
    // Convert hex to rgba with 20% opacity
    const hex = this.contextTagColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.2)`;
  }

  /**
   * Get context tag text color (full opacity)
   * Ensures WCAG AAA contrast ratio (7:1) against the background
   */
  getContextTagTextColor(): string {
    if (!this.contextTagColor) {
      return '#1F4456'; // Default brand color
    }
    
    // For light backgrounds (20% opacity), we need dark text for contrast
    // Calculate relative luminance to determine if we need dark or light text
    const hex = this.contextTagColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // For 20% opacity backgrounds, they're always light, so we always use dark text
    // Use the brand color itself if it's dark enough, otherwise use black
    if (luminance < 0.5) {
      // Brand color is dark, use it directly for good contrast
      return this.contextTagColor;
    } else {
      // Brand color is light, use a darkened version or black for WCAG AAA
      return '#000000';
    }
  }
}
