import { Component, inject, OnInit, signal } from '@angular/core';
import { Location } from '@angular/common';
import { DocumentService } from '../../../core/services/document.service';

@Component({
  selector: 'app-mobile-documents',
  standalone: true,
  imports: [],
  templateUrl: './mobile-documents.component.html',
  styleUrl: './mobile-documents.component.css'
})
export class MobileDocumentsComponent implements OnInit {
  documentService = inject(DocumentService);
  location = inject(Location);

  documents = signal<any[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.documentService.getDocuments({ limit: 20 }).subscribe({
      next: (response) => {
        this.documents.set(response.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  goBack(): void {
    this.location.back();
  }
}
