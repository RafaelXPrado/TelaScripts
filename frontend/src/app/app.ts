import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientComponent } from './components/http-client/http-client.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientComponent],
  template: `<app-http-client></app-http-client>`,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      width: 100vw;
    }
  `]
})
export class AppComponent {
  title = 'TELASCRIPTS';
}