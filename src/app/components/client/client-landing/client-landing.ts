import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-landing',
  imports: [RouterLink],
  templateUrl: './client-landing.html',
  styleUrl: './client-landing.css',
})
export class ClientLandingComponent {
  readonly services = [
    ['Consultation', 'Personalized veterinary assessment and care planning.'],
    ['Vaccination & Deworming', 'Preventive care that keeps pets protected.'],
    ['Surgeries', 'Safe surgical care with attentive recovery support.'],
    ['Treatment Laboratories', 'Diagnostic testing to guide accurate treatment.'],
    ['Grooming', 'Comfortable grooming for a healthier, happier pet.'],
    ['Pet Supplies', 'Trusted essentials for everyday pet care.'],
    ['Boarding', 'A secure, caring stay while you are away.'],
    ['Confinement', 'Monitored care for pets who need closer observation.'],
  ] as const;
}
