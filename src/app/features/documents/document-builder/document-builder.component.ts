import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DocumentService } from '../../../core/services/document.service';
import { Document, DocumentField } from '../../../core/models';

@Component({
  selector: 'app-document-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-builder.component.html',
  styleUrls: ['./document-builder.component.css']
})
export class DocumentBuilderComponent implements OnInit {
  private documentService = inject(DocumentService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditing = signal(false);
  documentId = signal<number | null>(null);
  isSaving = signal(false);

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
        alert('Failed to load document');
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
      alert('Please enter a field label');
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

  deleteField(field: DocumentField): void {
    if (confirm(`Delete field "${field.label}"?`)) {
      this.fields.update(fields => fields.filter(f => f.id !== field.id));
    }
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
      alert('Please enter a document title');
      return;
    }

    if (this.fields().length === 0) {
      alert('Please add at least one field to the document');
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
        alert(`Document ${this.isEditing() ? 'updated' : 'created'} successfully!`);
        this.router.navigate(['/documents/vault']);
      },
      error: (err) => {
        console.error('Error saving document:', err);
        this.isSaving.set(false);
        alert('Failed to save document');
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
