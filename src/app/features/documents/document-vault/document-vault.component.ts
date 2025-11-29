import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DocumentService } from '../../../core/services/document.service';
import { Document } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-document-vault',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-vault.component.html',
  styleUrls: ['./document-vault.component.css']
})
export class DocumentVaultComponent implements OnInit {
  private documentService = inject(DocumentService);
  private authService = inject(AuthService);
  private router = inject(Router);

  documents = signal<Document[]>([]);
  loading = signal(false);
  selectedCategory = signal<string>('all');
  selectedStatus = signal<string>('all');

  role = this.authService.userRole;

  categories = ['Application Forms', 'Reports', 'Certificates', 'Registrations', 'Other'];

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading.set(true);
    const params: any = { page: 1, limit: 100 };

    if (this.selectedCategory() !== 'all') {
      params.category = this.selectedCategory();
    }

    if (this.selectedStatus() !== 'all') {
      params.status = this.selectedStatus();
    }

    this.documentService.getDocuments(params).subscribe({
      next: (response) => {
        this.documents.set(response.data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading documents:', err);
        this.loading.set(false);
      }
    });
  }

  filterByCategory(category: string): void {
    this.selectedCategory.set(category);
    this.loadDocuments();
  }

  filterByStatus(status: string): void {
    this.selectedStatus.set(status);
    this.loadDocuments();
  }

  createDocument(): void {
    this.router.navigate(['/documents/builder']);
  }

  editDocument(doc: Document): void {
    this.router.navigate(['/documents/builder', doc.id]);
  }

  fillDocument(doc: Document): void {
    this.router.navigate(['/documents/fill', doc.id]);
  }

  viewSubmissions(doc: Document): void {
    this.router.navigate(['/documents/submissions', doc.id]);
  }

  deleteDocument(doc: Document): void {
    if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      this.documentService.deleteDocument(doc.id).subscribe({
        next: () => {
          this.loadDocuments();
        },
        error: (err) => {
          console.error('Error deleting document:', err);
          alert('Failed to delete document');
        }
      });
    }
  }

  canManageDocuments(): boolean {
    const userRole = this.role();
    return userRole === 'system_admin' || userRole === 'national_admin' || userRole === 'regional_admin';
  }

  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
