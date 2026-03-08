import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AppConfig } from '../models';

export interface AppConfigExtended extends AppConfig {
  passwordProtected?: boolean;
  appPassword?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private configCache: AppConfigExtended | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Load application configuration from server endpoint
   * Caches configuration after successful load to avoid repeated requests
   * @returns Observable of AppConfig containing API keys and settings
   * @throws Error if configuration cannot be loaded from server
   */
  loadConfig(): Observable<AppConfigExtended> {
    if (this.configCache) {
      return of(this.configCache);
    }

    return this.http.get<AppConfigExtended>('/api/config').pipe(
      tap(config => {
        this.configCache = config;
        // Store password in session storage if password protection is enabled
        if (config.passwordProtected && config.appPassword) {
          sessionStorage.setItem('app_password', config.appPassword);
        }
      }),
      catchError(error => {
        console.error('Failed to load configuration:', error);
        return throwError(() => new Error('Failed to load application configuration. Please try again later.'));
      })
    );
  }

  /**
   * Get the cached Gemini API key
   * Returns null if configuration has not been loaded yet
   * @returns The API key string or null if not available
   */
  getApiKey(): string | null {
    return this.configCache?.geminiApiKey || null;
  }

  /**
   * Check if password protection is enabled
   * @returns True if password protection is enabled
   */
  isPasswordProtected(): boolean {
    return this.configCache?.passwordProtected || false;
  }
}
