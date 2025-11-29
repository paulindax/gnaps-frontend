import { Component, signal, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MediaService } from '../../../core/services/media.service';
import { ButtonHelmComponent } from '../button-helm/button-helm.component';

/**
 * Media types supported by the upload component
 * - 'image': JPG, PNG, GIF, WebP, SVG (max 5MB)
 * - 'video': MP4, WebM, OGG, MOV (max 50MB)
 * - 'document': DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV (max 10MB)
 * - 'pdf': PDF files (max 10MB)
 * - 'any': Any file type (max 5MB)
 */
export type MediaType = 'image' | 'video' | 'document' | 'pdf' | 'any';

interface MediaTypeConfig {
  accept: string;
  mimeTypes: string[];
  label: string;
  extensions: string;
  icon: string;
}

/**
 * Versatile media upload component supporting images, videos, documents, and PDFs
 *
 * @example
 * // For images (default)
 * <app-image-upload
 *   [imageUrl]="formData().image_url"
 *   (imageUrlChange)="updateField('image_url', $event)"
 * />
 *
 * @example
 * // For videos
 * <app-image-upload
 *   [imageUrl]="formData().video_url"
 *   (imageUrlChange)="updateField('video_url', $event)"
 *   [mediaType]="'video'"
 *   [maxSize]="50"
 * />
 *
 * @example
 * // For PDFs
 * <app-image-upload
 *   [imageUrl]="formData().document_url"
 *   (imageUrlChange)="updateField('document_url', $event)"
 *   [mediaType]="'pdf'"
 *   [maxSize]="10"
 * />
 *
 * @example
 * // For any document type
 * <app-image-upload
 *   [imageUrl]="formData().file_url"
 *   (imageUrlChange)="updateField('file_url', $event)"
 *   [mediaType]="'document'"
 *   [allowUrlInput]="false"
 * />
 */
@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonHelmComponent],
  template: `
    <div class="space-y-4">
      <!-- Preview Section -->
      @if (mediaUrl()) {
        <div class="relative rounded-lg overflow-hidden border-2 border-border/50">
          @if (isImageMedia()) {
            <img
              [src]="getMediaUrl()"
              [alt]="'Preview'"
              class="w-full h-48 object-cover"
            />
          } @else if (isVideoMedia()) {
            <video
              [src]="getMediaUrl()"
              class="w-full h-48 object-cover"
              controls
            ></video>
          } @else if (isPdfMedia()) {
            <div class="flex items-center justify-center h-48 bg-muted">
              <div class="text-center">
                <svg class="w-16 h-16 mx-auto text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p class="mt-2 text-sm text-muted-foreground">PDF Document</p>
                <a [href]="getMediaUrl()" target="_blank" class="mt-1 text-xs text-primary hover:underline">View PDF</a>
              </div>
            </div>
          } @else {
            <div class="flex items-center justify-center h-48 bg-muted">
              <div class="text-center">
                <svg class="w-16 h-16 mx-auto text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="mt-2 text-sm text-muted-foreground">Document</p>
                <a [href]="getMediaUrl()" target="_blank" class="mt-1 text-xs text-primary hover:underline">View File</a>
              </div>
            </div>
          }
          <button
            type="button"
            (click)="removeMedia()"
            class="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }

      <!-- Upload Area -->
      <div
        class="relative border-2 border-dashed rounded-lg p-8 text-center transition-colors"
        [class.border-primary]="isDragging()"
        [class.border-border]="!isDragging()"
        [class.bg-primary/5]="isDragging()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
      >
        <input
          #fileInput
          type="file"
          [accept]="mediaConfig().accept"
          class="hidden"
          (change)="onFileSelected($event)"
        />

        @if (isUploading()) {
          <div class="space-y-2">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p class="text-sm text-muted-foreground">Uploading...</p>
          </div>
        } @else {
          <div class="space-y-4">
            <div class="flex justify-center">
              <svg class="w-12 h-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium">
                Drag and drop your {{ mediaConfig().label }} here, or
              </p>
              <button
                type="button"
                (click)="fileInput.click()"
                class="mt-2 text-sm text-primary hover:text-primary/80 font-semibold"
              >
                browse to upload
              </button>
            </div>
            <p class="text-xs text-muted-foreground">
              Supports: {{ mediaConfig().extensions }} (Max {{ maxSizeMB() }}MB)
            </p>
          </div>
        }

        @if (uploadError()) {
          <div class="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p class="text-sm text-destructive">{{ uploadError() }}</p>
          </div>
        }
      </div>

      <!-- URL Input (Alternative) -->
      @if (!mediaUrl() && !isUploading() && allowUrlInput()) {
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border"></div>
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-background px-2 text-muted-foreground">Or enter URL</span>
          </div>
        </div>

        <div class="flex gap-2">
          <input
            type="text"
            [(ngModel)]="urlInput"
            (keyup.enter)="setMediaFromUrl()"
            [placeholder]="'https://example.com/' + mediaConfig().label"
            class="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <app-button-helm
            type="button"
            variant="outline"
            (click)="setMediaFromUrl()"
          >
            Set URL
          </app-button-helm>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ImageUploadComponent {
  private mediaService = inject(MediaService);

  // Input/Output - keeping legacy names for backward compatibility
  imageUrl = input<string>('');
  imageUrlChange = output<string>();

  // New inputs for media configuration
  mediaType = input<MediaType>('image');
  maxSize = input<number>(5); // Max size in MB
  allowUrlInput = input<boolean>(true);

  // Signals
  isDragging = signal(false);
  isUploading = signal(false);
  uploadError = signal<string | null>(null);
  urlInput = '';

  // Computed values
  mediaUrl = computed(() => this.imageUrl());
  maxSizeMB = computed(() => this.maxSize());

  mediaConfig = computed<MediaTypeConfig>(() => {
    const configs: Record<MediaType, MediaTypeConfig> = {
      image: {
        accept: 'image/*',
        mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        label: 'image',
        extensions: 'JPG, PNG, GIF, WebP, SVG',
        icon: 'image'
      },
      video: {
        accept: 'video/*',
        mimeTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
        label: 'video',
        extensions: 'MP4, WebM, OGG, MOV',
        icon: 'video'
      },
      document: {
        accept: '.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv',
        mimeTypes: [
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'text/csv'
        ],
        label: 'document',
        extensions: 'DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV',
        icon: 'document'
      },
      pdf: {
        accept: 'application/pdf',
        mimeTypes: ['application/pdf'],
        label: 'PDF',
        extensions: 'PDF',
        icon: 'pdf'
      },
      any: {
        accept: '*/*',
        mimeTypes: [],
        label: 'file',
        extensions: 'Any file type',
        icon: 'file'
      }
    };

    return configs[this.mediaType()];
  });

  isImageMedia = computed(() => {
    const url = this.mediaUrl();
    return url && (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || this.mediaType() === 'image');
  });

  isVideoMedia = computed(() => {
    const url = this.mediaUrl();
    return url && (url.match(/\.(mp4|webm|ogg|mov)$/i) || this.mediaType() === 'video');
  });

  isPdfMedia = computed(() => {
    const url = this.mediaUrl();
    return url && (url.match(/\.pdf$/i) || this.mediaType() === 'pdf');
  });

  getMediaUrl(): string {
    return this.mediaService.getImageUrl(this.mediaUrl());
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFile(input.files[0]);
    }
  }

  uploadFile(file: File): void {
    const config = this.mediaConfig();

    // Validate file type
    if (config.mimeTypes.length > 0 && !config.mimeTypes.includes(file.type)) {
      this.uploadError.set(`Please select a valid ${config.label} file`);
      return;
    }

    // Validate file size
    const maxBytes = this.maxSize() * 1024 * 1024;
    if (file.size > maxBytes) {
      this.uploadError.set(`File size must be less than ${this.maxSize()}MB`);
      return;
    }

    this.uploadError.set(null);
    this.isUploading.set(true);

    this.mediaService.uploadMedia(file).subscribe({
      next: (response) => {
        this.isUploading.set(false);
        this.imageUrlChange.emit(response.url);
      },
      error: (err) => {
        console.error('Upload error:', err);
        this.isUploading.set(false);
        this.uploadError.set(err.error?.error || `Failed to upload ${config.label}. Please try again.`);
      }
    });
  }

  setMediaFromUrl(): void {
    if (this.urlInput.trim()) {
      this.imageUrlChange.emit(this.urlInput.trim());
      this.urlInput = '';
    }
  }

  removeMedia(): void {
    this.imageUrlChange.emit('');
  }
}
