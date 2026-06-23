import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainer } from './components/toast-container/toast-container'; // <-- IMPORTANTE

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainer], // <-- AGREGADO AQUÍ
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}