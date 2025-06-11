import { Cellline, Order, Oligo, Plasmid, Organism, Vendor, Category, User } from '../types';

class CSVManager {
  private baseUrl = process.env.NODE_ENV === 'development' 
    ? '/data' 
    : 'https://raw.githubusercontent.com/YOUR_ORG/lab-data-private/main/data';
  
  async fetchCSV(filename: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
    }
    return response.text();
  }

  parseCSV<T>(csvText: string, mapper: (row: string[]) => T): T[] {
    if (!csvText || csvText.trim().length === 0) {
      return [];
    }
    
    const rows = this.parseCSVRows(csvText);
    if (rows.length <= 1) {
      return [];
    }
    
    return rows.slice(1).map(row => {
      try {
        return mapper(row);
      } catch (error) {
        console.error('Error parsing CSV row:', row, error);
        return null;
      }
    }).filter(item => item !== null) as T[];
  }

  private parseCSVRows(csvText: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < csvText.length) {
      const char = csvText[i];
      
      if (char === '"') {
        if (inQuotes && i + 1 < csvText.length && csvText[i + 1] === '"') {
          // Handle escaped quotes ("")
          currentField += '"';
          i += 2;
          continue;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        // End of row
        if (currentField.trim() || currentRow.length > 0) {
          currentRow.push(currentField.trim());
          if (currentRow.some(field => field.length > 0)) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentField = '';
        }
        // Skip \r\n sequences
        if (char === '\r' && i + 1 < csvText.length && csvText[i + 1] === '\n') {
          i++;
        }
      } else {
        currentField += char;
      }
      i++;
    }
    
    // Handle last field/row
    if (currentField.trim() || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field.length > 0)) {
        rows.push(currentRow);
      }
    }
    
    // Remove surrounding quotes from fields
    return rows.map(row => 
      row.map(field => {
        if (field.startsWith('"') && field.endsWith('"')) {
          return field.slice(1, -1);
        }
        return field;
      })
    );
  }


  async getUsers(): Promise<User[]> {
    const csvText = await this.fetchCSV('users.csv');
    return this.parseCSV(csvText, (row) => ({
      id: parseInt(row[0]),
      username: row[1],
      first_name: row[2],
      last_name: row[3],
      email: row[4]
    }));
  }

  async getOrganisms(): Promise<Organism[]> {
    const csvText = await this.fetchCSV('organisms.csv');
    return this.parseCSV(csvText, (row) => ({
      id: parseInt(row[0]),
      name: row[1]
    }));
  }

  async getVendors(): Promise<Vendor[]> {
    const csvText = await this.fetchCSV('vendors.csv');
    return this.parseCSV(csvText, (row) => ({
      id: parseInt(row[0]),
      name: row[1]
    }));
  }

  async getCategories(): Promise<Category[]> {
    const csvText = await this.fetchCSV('categories.csv');
    return this.parseCSV(csvText, (row) => ({
      id: parseInt(row[0]),
      name: row[1]
    }));
  }

  async getCelllines(): Promise<Cellline[]> {
    const csvText = await this.fetchCSV('celllines.csv');
    return this.parseCSV(csvText, (row) => ({
      id: parseInt(row[0]) || 0,
      user_id: parseInt(row[1]) || 0,
      user_name: row[2] || '',
      organism_id: parseInt(row[3]) || 0,
      organism_name: row[4] || '',
      refid: row[5] || '',
      genotype: row[6] || '',
      date: row[7] || '',
      source: row[8] || '',
      link: row[9] || '',
      copies: parseInt(row[10]) || 0,
      leftcopies: parseInt(row[11]) || 0,
      parent: row[12] || '',
      reference: row[13] || '',
      sequence: row[14] || '',
      comment: row[15] || '',
      location: row[16] || ''
    }));
  }

  async getOrders(): Promise<Order[]> {
    const csvText = await this.fetchCSV('orders.csv');
    return this.parseCSV(csvText, (row) => ({
      id: parseInt(row[0]),
      user_id: parseInt(row[1]) || 0,
      user_name: row[2],
      vendor_id: parseInt(row[3]),
      vendor_name: row[4],
      category_id: parseInt(row[5]),
      category_name: row[6],
      catalog: row[7],
      qty: parseInt(row[8]),
      desc: row[9],
      unitprice: parseFloat(row[10]),
      unit: row[11],
      link: row[12],
      orderdate: row[13],
      receiptdate: row[14],
      comment: row[15],
      location: row[16]
    }));
  }

  async getOligos(): Promise<Oligo[]> {
    const csvText = await this.fetchCSV('oligos.csv');
    return this.parseCSV(csvText, (row) => ({
      id: parseInt(row[0]),
      user_id: parseInt(row[1]) || 0,
      user_name: row[2],
      organism_id: parseInt(row[3]),
      organism_name: row[4],
      refid: row[5],
      desc: row[6],
      seq: row[7],
      date: row[8],
      source: row[9],
      link: row[10],
      reference: row[11],
      usefulseq: row[12],
      comment: row[13],
      location: row[14],
      length: parseInt(row[15]),
      meltingtemp: parseInt(row[16]),
      gc: parseInt(row[17])
    }));
  }

  async getPlasmids(): Promise<Plasmid[]> {
    const csvText = await this.fetchCSV('plasmids.csv');
    return this.parseCSV(csvText, (row) => ({
      id: parseInt(row[0]),
      user_id: parseInt(row[1]) || 0,
      user_name: row[2],
      organism_id: parseInt(row[3]),
      organism_name: row[4],
      refid: row[5],
      genotype: row[6],
      date: row[7],
      source: row[8],
      link: row[9],
      replicates: parseInt(row[10]),
      leftover: parseInt(row[11]),
      parent: row[12],
      reference: row[13],
      sequence: row[14],
      resistance: row[15],
      temperature: row[16],
      copynumber: row[17],
      comment: row[18],
      location: row[19]
    }));
  }

  // Export data as CSV
  exportToCSV<T>(data: T[], filename: string, headers: string[]) {
    const csvContent = [
      headers.join(','),
      ...data.map(item => 
        headers.map(header => {
          const value = (item as any)[header] || '';
          // Escape commas and quotes
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const csvManager = new CSVManager();