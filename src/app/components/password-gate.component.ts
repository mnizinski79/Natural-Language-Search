import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-password-gate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        <div class="text-center mb-6">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">IHG Hotel Search</h1>
          <p class="text-gray-600">Please enter the access password</p>
        </div>
        
        <form (ngSubmit)="checkPassword()" class="space-y-4">
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              [(ngModel)]="enteredPassword"
              name="password"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Enter password"
              [class.border-red-500]="showError"
              (keyup.enter)="checkPassword()"
              autofocus
            />
            <p *ngIf="showError" class="mt-2 text-sm text-red-600">
              Incorrect password. Please try again.
            </p>
          </div>
          
          <button
            type="submit"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Access Application
          </button>
        </form>
        
        <div class="mt-6 text-center text-sm text-gray-500">
          <p>This is a protected demo application</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class PasswordGateComponent {
  @Output() authenticated = new EventEmitter<void>();
  
  enteredPassword = '';
  showError = false;

  checkPassword(): void {
    // Get the password from session storage (set by app component from API)
    const correctPassword = sessionStorage.getItem('app_password');
    
    if (this.enteredPassword === correctPassword) {
      this.showError = false;
      sessionStorage.setItem('app_authenticated', 'true');
      this.authenticated.emit();
    } else {
      this.showError = true;
      this.enteredPassword = '';
    }
  }
}
