import { Component, input, signal } from '@angular/core';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExportColumn {
  key: string;
  header: string;
  formatter?: (value: any, row: any) => string;
}

export interface ExportConfig {
  title: string;
  filename: string;
  columns: ExportColumn[];
  summaryLine?: string;
  headerColor?: [number, number, number];
}

@Component({
  selector: 'app-data-export',
  standalone: true,
  imports: [],
  templateUrl: './data-export.component.html'
})
export class DataExportComponent {
  // Inputs
  data = input.required<any[]>();
  config = input.required<ExportConfig>();
  disabled = input<boolean>(false);
  buttonLabel = input<string>('Export');

  // Dropdown state
  dropdownOpen = signal(false);

  toggleDropdown(): void {
    this.dropdownOpen.update(v => !v);
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  private formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private getCellValue(row: any, column: ExportColumn): string {
    const value = row[column.key];
    if (column.formatter) {
      return column.formatter(value, row);
    }
    if (value === undefined || value === null) return 'N/A';
    if (value instanceof Date) return this.formatDate(value);
    return String(value);
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    const items = this.data();
    const cfg = this.config();

    doc.setFontSize(18);
    doc.text(cfg.title, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${this.formatDate(new Date())}`, 14, 30);

    if (cfg.summaryLine) {
      doc.text(cfg.summaryLine, 14, 38);
    }

    const tableData = items.map(item =>
      cfg.columns.map(col => this.getCellValue(item, col))
    );

    const startY = cfg.summaryLine ? 45 : 38;

    autoTable(doc, {
      head: [cfg.columns.map(col => col.header)],
      body: tableData,
      startY,
      styles: { fontSize: 8 },
      headStyles: { fillColor: cfg.headerColor || [225, 29, 72] }
    });

    // Open PDF in new window
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
    this.closeDropdown();
  }

  exportToExcel(): void {
    const items = this.data();
    const cfg = this.config();

    const data = items.map(item => {
      const row: Record<string, any> = {};
      cfg.columns.forEach(col => {
        row[col.header] = this.getCellValue(item, col);
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, cfg.title.substring(0, 31));

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${cfg.filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
    this.closeDropdown();
  }

  exportToCSV(): void {
    const items = this.data();
    const cfg = this.config();

    const headers = cfg.columns.map(col => col.header);
    const rows = items.map(item =>
      cfg.columns.map(col => {
        const value = this.getCellValue(item, col);
        // Escape quotes and wrap in quotes if contains comma or quote
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
    );

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${cfg.filename}-${new Date().toISOString().split('T')[0]}.csv`);
    this.closeDropdown();
  }
}
