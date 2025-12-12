import { Component, signal, inject, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { DocumentService } from '../../../core/services/document.service';
import { Document, DocumentField } from '../../../core/models';
import { FlashMessageService } from '../../../core/services/flash-message.service';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-document-builder',
  standalone: true,
  imports: [FormsModule, NgSelectModule, ConfirmDialogComponent],
  templateUrl: './document-builder.component.html',
  styleUrls: ['./document-builder.component.css']
})
export class DocumentBuilderComponent implements OnInit {
  private documentService = inject(DocumentService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private flashMessage = inject(FlashMessageService);

  isEditing = signal(false);
  documentId = signal<number | null>(null);
  isSaving = signal(false);

  // Confirm dialog signals
  showDeleteFieldDialog = signal(false);
  fieldToDelete = signal<DocumentField | null>(null);

  // Document metadata
  documentData = signal({
    title: '',
    description: '',
    category: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    is_required: false
  });

  // Template fields
  fields = signal<DocumentField[]>([]);
  selectedField = signal<DocumentField | null>(null);
  showFieldEditor = signal(false);

  // Field editor form
  fieldForm = signal<Partial<DocumentField>>({
    type: 'text',
    label: '',
    placeholder: '',
    required: false,
    x: 0,
    y: 0,
    width: 300,
    height: 40
  });

  fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'file', label: 'File Upload' },
    { value: 'signature', label: 'Signature' }
  ];

  categories = ['Application Forms', 'Reports', 'Certificates', 'Registrations', 'Other'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.documentId.set(parseInt(id));
      this.loadDocument(parseInt(id));
    }
  }

  loadDocument(id: number): void {
    this.documentService.getDocumentById(id).subscribe({
      next: (doc) => {
        this.documentData.set({
          title: doc.title,
          description: doc.description || '',
          category: doc.category || '',
          status: doc.status,
          is_required: doc.is_required || false
        });
        // Parse template_data if it's a string
        const templateData = typeof doc.template_data === 'string'
          ? JSON.parse(doc.template_data)
          : doc.template_data;
        this.fields.set(templateData || []);
      },
      error: (err) => {
        console.error('Error loading document:', err);
        this.flashMessage.error('Failed to load document');
        this.router.navigate(['/documents/vault']);
      }
    });
  }

  updateDocumentField(field: string, value: any): void {
    this.documentData.update(data => ({ ...data, [field]: value }));
  }

  addField(): void {
    this.fieldForm.set({
      type: 'text',
      label: '',
      placeholder: '',
      required: false,
      x: 0,
      y: this.fields().length * 60,
      width: 300,
      height: 40
    });
    this.showFieldEditor.set(true);
    this.selectedField.set(null);
  }

  editField(field: DocumentField): void {
    this.selectedField.set(field);
    this.fieldForm.set({ ...field });
    this.showFieldEditor.set(true);
  }

  saveField(): void {
    const form = this.fieldForm();

    if (!form.label) {
      this.flashMessage.error('Please enter a field label');
      return;
    }

    const field: DocumentField = {
      id: this.selectedField()?.id || `field_${Date.now()}`,
      type: form.type as any,
      label: form.label,
      placeholder: form.placeholder,
      required: form.required || false,
      options: form.options,
      x: form.x || 0,
      y: form.y || 0,
      width: form.width || 300,
      height: form.height || 40
    };

    if (this.selectedField()) {
      // Update existing field
      this.fields.update(fields =>
        fields.map(f => f.id === field.id ? field : f)
      );
    } else {
      // Add new field
      this.fields.update(fields => [...fields, field]);
    }

    this.closeFieldEditor();
  }

  openDeleteFieldDialog(field: DocumentField): void {
    this.fieldToDelete.set(field);
    this.showDeleteFieldDialog.set(true);
  }

  confirmDeleteField(): void {
    const field = this.fieldToDelete();
    if (field) {
      this.fields.update(fields => fields.filter(f => f.id !== field.id));
      this.flashMessage.success('Field deleted successfully!');
    }
    this.showDeleteFieldDialog.set(false);
    this.fieldToDelete.set(null);
  }

  cancelDeleteField(): void {
    this.showDeleteFieldDialog.set(false);
    this.fieldToDelete.set(null);
  }

  moveFieldUp(index: number): void {
    if (index === 0) return;
    this.fields.update(fields => {
      const newFields = [...fields];
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      return newFields;
    });
  }

  moveFieldDown(index: number): void {
    const fields = this.fields();
    if (index === fields.length - 1) return;
    this.fields.update(fields => {
      const newFields = [...fields];
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      return newFields;
    });
  }

  closeFieldEditor(): void {
    this.showFieldEditor.set(false);
    this.selectedField.set(null);
    this.fieldForm.set({
      type: 'text',
      label: '',
      placeholder: '',
      required: false,
      x: 0,
      y: 0,
      width: 300,
      height: 40
    });
  }

  saveDocument(): void {
    const data = this.documentData();

    if (!data.title) {
      this.flashMessage.error('Please enter a document title');
      return;
    }

    if (this.fields().length === 0) {
      this.flashMessage.error('Please add at least one field to the document');
      return;
    }

    this.isSaving.set(true);

    const payload = {
      ...data,
      template_data: this.fields()
    };

    const observable = this.isEditing()
      ? this.documentService.updateDocument(this.documentId()!, payload)
      : this.documentService.createDocument(payload);

    observable.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.flashMessage.success(`Document ${this.isEditing() ? 'updated' : 'created'} successfully!`);
        this.router.navigate(['/documents/vault']);
      },
      error: (err) => {
        console.error('Error saving document:', err);
        this.isSaving.set(false);
        this.flashMessage.error('Failed to save document. Please try again.');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/documents/vault']);
  }

  getFieldTypeLabel(type: string): string {
    return this.fieldTypes.find(t => t.value === type)?.label || type;
  }

  // Field form update methods for template bindings
  updateFieldType(value: string): void {
    this.fieldForm.update(f => ({ ...f, type: value as any }));
  }

  updateFieldLabel(value: string): void {
    this.fieldForm.update(f => ({ ...f, label: value }));
  }

  updateFieldPlaceholder(value: string): void {
    this.fieldForm.update(f => ({ ...f, placeholder: value }));
  }

  updateFieldOptions(value: string): void {
    this.fieldForm.update(f => ({
      ...f,
      options: value.split(',').map((s: string) => s.trim())
    }));
  }

  updateFieldWidth(value: number): void {
    this.fieldForm.update(f => ({ ...f, width: value }));
  }

  updateFieldHeight(value: number): void {
    this.fieldForm.update(f => ({ ...f, height: value }));
  }

  updateFieldRequired(checked: boolean): void {
    this.fieldForm.update(f => ({ ...f, required: checked }));
  }
}
