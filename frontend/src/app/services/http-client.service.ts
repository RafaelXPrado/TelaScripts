import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, catchError, EMPTY } from 'rxjs';
import { HttpRequestModel, HttpResponseModel, RequestHistory } from '../models/http-request.model';

@Injectable({
  providedIn: 'root'
})
export class HttpClientService {
  private historySubject = new BehaviorSubject<RequestHistory[]>([]);
  public history$ = this.historySubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadHistoryFromStorage();
  }

  async executeRequest(request: HttpRequestModel): Promise<HttpResponseModel> {
    const startTime = performance.now();
    
    try {
      const headers = new HttpHeaders(request.headers);
      const options = {
        headers: headers,
        params: request.params,
        observe: 'response' as const
      };

      let response: HttpResponse<any>;

      switch (request.method) {
        case 'GET':
          response = await firstValueFrom(
            this.http.get(request.url, options).pipe(
              catchError((error: HttpErrorResponse) => {
                throw error;
              })
            )
          );
          break;
        case 'POST':
          response = await firstValueFrom(
            this.http.post(request.url, request.body, options).pipe(
              catchError((error: HttpErrorResponse) => {
                throw error;
              })
            )
          );
          break;
        case 'PUT':
          response = await firstValueFrom(
            this.http.put(request.url, request.body, options).pipe(
              catchError((error: HttpErrorResponse) => {
                throw error;
              })
            )
          );
          break;
        case 'DELETE':
          response = await firstValueFrom(
            this.http.delete(request.url, options).pipe(
              catchError((error: HttpErrorResponse) => {
                throw error;
              })
            )
          );
          break;
        case 'PATCH':
          response = await firstValueFrom(
            this.http.patch(request.url, request.body, options).pipe(
              catchError((error: HttpErrorResponse) => {
                throw error;
              })
            )
          );
          break;
        default:
          throw new Error('Método HTTP não suportado');
      }

      const endTime = performance.now();
      
      const httpResponse: HttpResponseModel = {
        status: response.status,
        statusText: response.statusText,
        headers: this.extractHeaders(response),
        body: response.body,
        responseTime: Math.round(endTime - startTime)
      };

      this.addToHistory(request, httpResponse);
      return httpResponse;

    } catch (error: any) {
      const endTime = performance.now();
      
      const errorResponse: HttpResponseModel = {
        status: error.status || 0,
        statusText: error.statusText || 'Network Error',
        headers: error.headers ? this.extractHeaders(error) : {},
        body: error.error || error.message,
        responseTime: Math.round(endTime - startTime)
      };

      this.addToHistory(request, errorResponse);
      return errorResponse;
    }
  }

  private extractHeaders(response: HttpResponse<any>): { [key: string]: string } {
    const headers: { [key: string]: string } = {};
    if (response && response.headers && typeof response.headers.keys === 'function') {
      response.headers.keys().forEach((key: string) => {
        headers[key] = response.headers.get(key) || '';
      });
    }
    return headers;
  }

  private addToHistory(request: HttpRequestModel, response: HttpResponseModel): void {
    const historyItem: RequestHistory = {
      id: Date.now().toString(),
      request: request,
      response: response,
      timestamp: new Date()
    };

    const currentHistory = this.historySubject.value;
    const newHistory = [historyItem, ...currentHistory.slice(0, 49)];
    
    this.historySubject.next(newHistory);
    this.saveHistoryToStorage(newHistory);
  }

  private saveHistoryToStorage(history: RequestHistory[]): void {
    try {
      const serializedHistory = JSON.stringify(history, (key, value) => {
        // Handle circular references and non-serializable values
        if (value instanceof Date) {
          return value.toISOString();
        }
        if (typeof value === 'function') {
          return undefined;
        }
        return value;
      });
      localStorage.setItem('telascripts-http-history', serializedHistory);
    } catch (error) {
      console.warn('Não foi possível salvar no localStorage:', error);
    }
  }

  private loadHistoryFromStorage(): void {
    try {
      const stored = localStorage.getItem('telascripts-http-history');
      if (stored) {
        const history = JSON.parse(stored, (key, value) => {
          // Parse ISO date strings back to Date objects
          if (key === 'timestamp' && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        });
        // Validate that history is an array before setting
        if (Array.isArray(history)) {
          this.historySubject.next(history);
        } else {
          console.warn('Invalid history format in localStorage, clearing...');
          localStorage.removeItem('telascripts-http-history');
          this.historySubject.next([]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      // Clear corrupted data and start fresh
      try {
        localStorage.removeItem('telascripts-http-history');
      } catch (clearError) {
        console.error('Failed to clear corrupted history:', clearError);
      }
      this.historySubject.next([]);
    }
  }

  clearHistory(): void {
    this.historySubject.next([]);
    try {
      localStorage.removeItem('telascripts-http-history');
    } catch (error) {
      console.warn('Não foi possível limpar o localStorage:', error);
    }
  }
}