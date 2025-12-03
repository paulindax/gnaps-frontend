import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { DocumentService } from '../../../core/services/document.service';
import { AuthService } from '../../../core/services/auth.service';
import { Document, DocumentField } from '../../../core/models';
import { ImageUploadComponent } from '../../../shared/ui/image-upload/image-upload.component';
import { FlashMessageService } from '../../../core/services/flash-message.service';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-document-fill',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, ImageUploadComponent, ConfirmDialogComponent],
  templateUrl: './document-fill.component.html',
  styleUrls: ['./document-fill.component.css']
})
export class DocumentFillComponent implements OnInit {
  private documentService = inject(DocumentService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private flashMessage = inject(FlashMessageService);

  document = signal<Document | null>(null);
  loading = signal(false);
  isSubmitting = signal(false);

  // Confirm dialog signals
  showSubmitDialog = signal(false);

  // Form data storage
  formData = signal<Record<string, any>>({});

  userSchoolId = signal<number | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDocument(parseInt(id));
    }

    // Get user's school ID (you may need to adjust based on your auth setup)
    const user = this.authService.currentUserSignal();
    if (user && 'school_id' in user) {
      this.userSchoolId.set((user as any).school_id);
    }
  }

  loadDocument(id: number): void {
    this.loading.set(true);
    this.documentService.getDocumentById(id).subscribe({
      next: (doc) => {
        this.document.set(doc);
        this.loading.set(false);

        // Initialize form data
        const templateData = typeof doc.template_data === 'string'
          ? JSON.parse(doc.template_data)
          : doc.template_data;

        const initialData: Record<string, any> = {};
        templateData.forEach((field: DocumentField) => {
          initialData[field.id] = '';
        });
        this.formData.set(initialData);
      },
      error: (err) => {
        console.error('Error loading document:', err);
        this.flashMessage.error('Failed to load document');
        this.loading.set(false);
        this.router.navigate(['/documents/vault']);
      }
    });
  }

  updateField(fieldId: string, value: any): void {
    this.formData.update(data => ({ ...data, [fieldId]: value }));
  }

  getTemplateFields(): DocumentField[] {
    const doc = this.document();
    if (!doc) return [];

    return typeof doc.template_data === 'string'
      ? JSON.parse(doc.template_data)
      : doc.template_data;
  }

  validateForm(): boolean {
    const fields = this.getTemplateFields();
    const data = this.formData();

    for (const field of fields) {
      if (field.required && (!data[field.id] || data[field.id] === '')) {
        this.flashMessage.error(`Please fill in the required field: ${field.label}`);
        return false;
      }
    }

    return true;
  }

  saveDraft(): void {
    if (!this.userSchoolId()) {
      this.flashMessage.error('School ID not found. Please contact support.');
      return;
    }

    const doc = this.document();
    if (!doc) return;

    this.isSubmitting.set(true);

    const submission = {
      document_id: doc.id,
      school_id: this.userSchoolId()!,
      form_data: this.formData(),
      status: 'draft' as const
    };

    this.documentService.submitDocument(submission).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.flashMessage.success('Draft saved successfully!');
        this.router.navigate(['/documents/vault']);
      },
      error: (err) => {
        console.error('Error saving draft:', err);
        this.isSubmitting.set(false);
        this.flashMessage.error('Failed to save draft. Please try again.');
      }
    });
  }

  openSubmitDialog(): void {
    if (!this.validateForm()) return;

    if (!this.userSchoolId()) {
      this.flashMessage.error('School ID not found. Please contact support.');
      return;
    }

    this.showSubmitDialog.set(true);
  }

  confirmSubmit(): void {
    const doc = this.document();
    if (!doc) return;

    this.isSubmitting.set(true);

    const submission = {
      document_id: doc.id,
      school_id: this.userSchoolId()!,
      form_data: this.formData(),
      status: 'submitted' as const,
      submitted_at: new Date().toISOString()
    };

    this.documentService.submitDocument(submission).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.flashMessage.success('Form submitted successfully!');
        this.router.navigate(['/documents/vault']);
      },
      error: (err) => {
        console.error('Error submitting form:', err);
        this.isSubmitting.set(false);
        this.flashMessage.error('Failed to submit form. Please try again.');
      }
    });

    this.showSubmitDialog.set(false);
  }

  cancelSubmit(): void {
    this.showSubmitDialog.set(false);
  }

  printForm(): void {
    window.print();
  }

  cancel(): void {
    this.router.navigate(['/documents/vault']);
  }
}
