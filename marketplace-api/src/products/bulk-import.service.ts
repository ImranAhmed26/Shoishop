import { Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';

const TEMPLATE_HEADERS = ['title', 'description', 'price', 'stock', 'category', 'images', 'status'];

interface ParsedRow {
  rowNumber: number;
  title?: string;
  description?: string;
  price?: string;
  stock?: string;
  category?: string;
  images?: string;
  status?: string;
}

export interface BulkImportFailure {
  row: number;
  reason: string;
}

export interface BulkImportSummary {
  imported: number;
  failed: BulkImportFailure[];
}

@Injectable()
export class BulkImportService {
  constructor(private readonly prisma: PrismaService) {}

  buildTemplateCsv(): string {
    const sampleRow = [
      'Sample T-Shirt',
      'A soft cotton t-shirt',
      '19.99',
      '25',
      'clothes',
      '"https://example.com/image1.jpg,https://example.com/image2.jpg"',
      'PUBLISHED',
    ];
    return [TEMPLATE_HEADERS.join(','), sampleRow.join(',')].join('\n');
  }

  async parseFile(file: Express.Multer.File): Promise<ParsedRow[]> {
    const isExcel =
      file.mimetype.includes('spreadsheet') ||
      file.originalname.toLowerCase().endsWith('.xlsx');

    if (isExcel) {
      return this.parseExcel(file.buffer);
    }
    return this.parseCsv(file.buffer);
  }

  private parseCsv(buffer: Buffer): ParsedRow[] {
    const records: Record<string, string>[] = parse(buffer, {
      columns: (header: string[]) => header.map((h) => h.trim().toLowerCase()),
      skip_empty_lines: true,
      trim: true,
    });
    return records.map((record, index) => ({ rowNumber: index + 2, ...record }));
  }

  private async parseExcel(buffer: Buffer): Promise<ParsedRow[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) return [];

    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = String(cell.value ?? '').trim().toLowerCase();
    });

    const rows: ParsedRow[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const record: ParsedRow = { rowNumber };
      row.eachCell((cell, colNumber) => {
        const key = headers[colNumber];
        if (key) {
          (record as unknown as Record<string, string>)[key] = String(cell.value ?? '').trim();
        }
      });
      if (Object.keys(record).length > 1) rows.push(record);
    });
    return rows;
  }

  async importRows(shopId: string, rows: ParsedRow[]): Promise<BulkImportSummary> {
    const categories = await this.prisma.category.findMany();
    const categoryByKey = new Map(
      categories.flatMap((c) => [
        [c.slug.toLowerCase(), c.id],
        [c.name.toLowerCase(), c.id],
      ]),
    );

    const failed: BulkImportFailure[] = [];
    let imported = 0;

    for (const row of rows) {
      const reason = this.validateRow(row);
      if (reason) {
        failed.push({ row: row.rowNumber, reason });
        continue;
      }

      const categoryId = row.category ? categoryByKey.get(row.category.toLowerCase()) : undefined;
      if (row.category && !categoryId) {
        failed.push({ row: row.rowNumber, reason: `Unknown category "${row.category}"` });
        continue;
      }

      const status = (row.status ?? 'DRAFT').toUpperCase();
      if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
        failed.push({ row: row.rowNumber, reason: `Invalid status "${row.status}"` });
        continue;
      }

      await this.prisma.product.create({
        data: {
          shopId,
          title: row.title!.trim(),
          description: row.description?.trim() || undefined,
          priceCents: Math.round(parseFloat(row.price!) * 100),
          stockQty: row.stock ? parseInt(row.stock, 10) : 0,
          categoryId,
          images: row.images
            ? row.images
                .split(',')
                .map((url) => url.trim())
                .filter(Boolean)
            : [],
          status: status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
        },
      });
      imported += 1;
    }

    return { imported, failed };
  }

  private validateRow(row: ParsedRow): string | null {
    if (!row.title || row.title.trim().length < 2) {
      return 'Missing or too-short title';
    }
    if (!row.price || Number.isNaN(parseFloat(row.price)) || parseFloat(row.price) < 0) {
      return 'Missing or invalid price';
    }
    if (row.stock && (Number.isNaN(parseInt(row.stock, 10)) || parseInt(row.stock, 10) < 0)) {
      return 'Invalid stock quantity';
    }
    return null;
  }
}
