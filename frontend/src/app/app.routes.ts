import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/http-client/http-client.component').then(c => c.HttpClientComponent), data: { breadcrumb: 'Home' } },

];
