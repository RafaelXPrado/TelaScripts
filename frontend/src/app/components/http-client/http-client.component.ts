import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { HttpClientService } from '../../services/http-client.service';
import { HttpRequestModel, HttpResponseModel, RequestHistory } from '../../models/http-request.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-http-client',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './http-client.component.html',
  styleUrls: ['./http-client.component.css']
})
export class HttpClientComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  requestForm: FormGroup;
  activeTab = 'params';
  response: HttpResponseModel | null = null;
  isLoading = false;
  history: RequestHistory[] = [];
  showHistory = false;

  readonly httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  readonly authTypes = ['bearer', 'basic', 'api-key'];

  constructor(
    private fb: FormBuilder,
    private httpClientService: HttpClientService
  ) {
    this.requestForm = this.initializeForm();
  }

  ngOnInit(): void {
    this.httpClientService.history$
      .pipe(takeUntil(this.destroy$))
      .subscribe(history => {
        this.history = history;
      });

    // Adicionar alguns headers e params iniciais
    this.addHeader();
    this.addParam();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): FormGroup {
    return this.fb.group({
      method: ['GET'],
      url: ['https://jsonplaceholder.typicode.com/posts/1'],
      authorization: this.fb.group({
        type: ['bearer'],
        token: [''],
        username: [''],
        password: ['']
      }),
      headers: this.fb.array([]),
      params: this.fb.array([]),
      body: ['{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}'],
      scripts: ['']
    });
  }

  get headersArray(): FormArray {
    return this.requestForm.get('headers') as FormArray;
  }

  get paramsArray(): FormArray {
    return this.requestForm.get('params') as FormArray;
  }

  // Métodos para obter os controles como FormGroup
  getHeaderFormGroup(index: number): FormGroup {
    return this.headersArray.at(index) as FormGroup;
  }

  getParamFormGroup(index: number): FormGroup {
    return this.paramsArray.at(index) as FormGroup;
  }

  addHeader(): void {
    const headerGroup = this.fb.group({
      key: ['Content-Type'],
      value: ['application/json']
    });
    this.headersArray.push(headerGroup);
  }

  removeHeader(index: number): void {
    this.headersArray.removeAt(index);
  }

  addParam(): void {
    const paramGroup = this.fb.group({
      key: [''],
      value: ['']
    });
    this.paramsArray.push(paramGroup);
  }

  removeParam(index: number): void {
    this.paramsArray.removeAt(index);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  async sendRequest(): Promise<void> {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.response = null;

    try {
      const formValue = this.requestForm.value;
      
      const headers: { [key: string]: string } = {};
      formValue.headers?.forEach((header: any) => {
        if (header?.key && header?.value) {
          headers[header.key] = header.value;
        }
      });

      const params: { [key: string]: string } = {};
      formValue.params?.forEach((param: any) => {
        if (param?.key && param?.value) {
          params[param.key] = param.value;
        }
      });

      let bodyContent = '';
      if (['POST', 'PUT', 'PATCH'].includes(formValue.method)) {
        bodyContent = formValue.body || '';
      }

      const request: HttpRequestModel = {
        method: formValue.method,
        url: formValue.url,
        headers,
        params,
        body: bodyContent,
        authorization: formValue.authorization
      };

      this.response = await this.httpClientService.executeRequest(request);
    } catch (error) {
      console.error('Erro ao enviar requisição:', error);
      // Ensure the error is properly handled and doesn't propagate as unhandled
      this.response = {
        status: 0,
        statusText: 'Request Failed',
        headers: {},
        body: error instanceof Error ? error.message : 'Unknown error occurred',
        responseTime: 0
      };
    } finally {
      this.isLoading = false;
    }
  }

  toggleHistory(): void {
    this.showHistory = !this.showHistory;
  }

  loadFromHistory(historyItem: RequestHistory): void {
    const request = historyItem.request;
    
    // Limpar arrays existentes
    while (this.headersArray.length) {
      this.headersArray.removeAt(0);
    }
    while (this.paramsArray.length) {
      this.paramsArray.removeAt(0);
    }

    // Preencher form
    this.requestForm.patchValue({
      method: request.method,
      url: request.url,
      body: request.body,
      authorization: request.authorization
    });

    // Adicionar headers
    Object.entries(request.headers || {}).forEach(([key, value]) => {
      const headerGroup = this.fb.group({ key, value });
      this.headersArray.push(headerGroup);
    });

    // Adicionar params
    Object.entries(request.params || {}).forEach(([key, value]) => {
      const paramGroup = this.fb.group({ key, value });
      this.paramsArray.push(paramGroup);
    });

    this.showHistory = false;
  }

  clearHistory(): void {
    this.httpClientService.clearHistory();
  }

  formatJson(jsonString: string): string {
    try {
      if (typeof jsonString === 'string') {
        const obj = JSON.parse(jsonString);
        return JSON.stringify(obj, null, 2);
      } else {
        return JSON.stringify(jsonString, null, 2);
      }
    } catch {
      return jsonString;
    }
  }

  getStatusClass(status: number): string {
    if (status >= 200 && status < 300) return 'status-success';
    if (status >= 300 && status < 400) return 'status-redirect';
    if (status >= 400 && status < 500) return 'status-client-error';
    if (status >= 500) return 'status-server-error';
    return 'status-unknown';
  }
}