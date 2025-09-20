export interface HttpRequestModel {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: { [key: string]: string };
  params: { [key: string]: string };
  body: string;
  authorization?: {
    type: 'bearer' | 'basic' | 'api-key';
    token?: string;
    username?: string;
    password?: string;
  };
}

export interface HttpResponseModel {
  status: number;
  statusText: string;
  headers: { [key: string]: string };
  body: any;
  responseTime: number;
}

export interface RequestHistory {
  id: string;
  request: HttpRequestModel;
  response?: HttpResponseModel;
  timestamp: Date;
}