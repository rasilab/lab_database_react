// Unified data management service that handles both local and GitHub data
import { csvManager } from './csvManager';
import { createGitHubService, getGitHubConfig } from './github';
import { Cellline, Order, Oligo, Plasmid, Organism, Vendor, Category, User } from '../types';

export interface DataUpdateRequest {
  type: 'add' | 'update' | 'delete';
  entity: 'celllines' | 'orders' | 'oligos' | 'plasmids' | 'organisms' | 'vendors' | 'categories' | 'users';
  data: any;
  id?: number;
}

class DataManager {
  private githubService: any = null;
  private useGitHub: boolean = false;

  constructor() {
    // Try to initialize GitHub service
    try {
      const config = getGitHubConfig();
      console.log('🔧 GitHub config:', { owner: config.owner, repo: config.repo, tokenSet: !!config.token });
      this.githubService = createGitHubService(config);
      this.useGitHub = true;
      console.log('✅ GitHub service initialized successfully');
    } catch (error) {
      console.warn('❌ GitHub not configured, using local data only:', error);
    }
  }

  // Read operations - try GitHub first, fallback to local
  async getCelllines(): Promise<Cellline[]> {
    let data: Cellline[];
    
    if (this.useGitHub) {
      try {
        console.log('🌐 Loading celllines from GitHub...');
        const csvContent = await this.githubService.getCSVContent('celllines.csv');
        console.log('✅ GitHub data loaded, parsing CSV...');
        data = csvManager.parseCSV(csvContent, this.celllineMapper);
        console.log(`✅ Parsed ${data.length} celllines from GitHub`);
      } catch (error) {
        console.error('❌ Failed to load from GitHub, using local data:', error);
        console.log('💾 Loading from local CSV files...');
        data = await csvManager.getCelllines();
      }
    } else {
      console.log('⚠️ GitHub not configured, using local data');
      console.log('💾 Loading from local CSV files...');
      data = await csvManager.getCelllines();
    }
    
    // Resolve relationships for normalized data
    return this.resolveCelllineRelationships(data);
  }

  async getOrganisms(): Promise<Organism[]> {
    if (this.useGitHub) {
      try {
        const csvContent = await this.githubService.getCSVContent('organisms.csv');
        return csvManager.parseCSV(csvContent, this.organismMapper);
      } catch (error) {
        console.warn('Failed to load from GitHub, using local data:', error);
      }
    }
    return await csvManager.getOrganisms();
  }

  async getVendors(): Promise<Vendor[]> {
    if (this.useGitHub) {
      try {
        const csvContent = await this.githubService.getCSVContent('vendors.csv');
        return csvManager.parseCSV(csvContent, this.vendorMapper);
      } catch (error) {
        console.warn('Failed to load from GitHub, using local data:', error);
      }
    }
    return await csvManager.getVendors();
  }

  async getCategories(): Promise<Category[]> {
    if (this.useGitHub) {
      try {
        const csvContent = await this.githubService.getCSVContent('categories.csv');
        return csvManager.parseCSV(csvContent, this.categoryMapper);
      } catch (error) {
        console.warn('Failed to load from GitHub, using local data:', error);
      }
    }
    return await csvManager.getCategories();
  }

  // Write operations - only work with GitHub
  async updateData(request: DataUpdateRequest): Promise<void> {
    if (!this.useGitHub) {
      throw new Error('Data updates require GitHub configuration');
    }

    const filename = `${request.entity}.csv`;
    
    // Get current data
    let currentData: any[] = [];
    switch (request.entity) {
      case 'celllines':
        currentData = await this.getCelllines();
        break;
      case 'organisms':
        currentData = await this.getOrganisms();
        break;
      case 'vendors':
        currentData = await this.getVendors();
        break;
      case 'categories':
        currentData = await this.getCategories();
        break;
      case 'users':
        currentData = await this.getUsers();
        break;
      case 'orders':
        currentData = await this.getOrders();
        break;
      case 'oligos':
        currentData = await this.getOligos();
        break;
      case 'plasmids':
        currentData = await this.getPlasmids();
        break;
      default:
        throw new Error(`Unsupported entity type: ${request.entity}`);
    }

    // Apply the update
    let updatedData = [...currentData];
    
    switch (request.type) {
      case 'add':
        const newId = Math.max(...currentData.map(item => item.id), 0) + 1;
        updatedData.push({ ...request.data, id: newId });
        break;
        
      case 'update':
        const updateIndex = updatedData.findIndex(item => item.id === request.id);
        if (updateIndex === -1) {
          throw new Error(`Item with id ${request.id} not found`);
        }
        updatedData[updateIndex] = { ...updatedData[updateIndex], ...request.data };
        break;
        
      case 'delete':
        updatedData = updatedData.filter(item => item.id !== request.id);
        break;
    }

    // Convert back to CSV
    const headers = this.getHeadersForEntity(request.entity);
    const csvContent = this.dataToCSV(updatedData, headers);

    // Create commit message
    const action = request.type === 'add' ? 'Add' : request.type === 'update' ? 'Update' : 'Delete';
    const message = `${action} ${request.entity.slice(0, -1)} via web interface`;

    // Update GitHub
    await this.githubService.updateCSV(filename, csvContent, message);
  }

  // Bulk import operations - for CSV import functionality
  async bulkImport(entity: 'celllines' | 'orders' | 'oligos' | 'plasmids', importData: any[]): Promise<void> {
    if (!this.useGitHub) {
      throw new Error('Data imports require GitHub configuration');
    }

    const filename = `${entity}.csv`;
    
    // Get current data
    let currentData: any[] = [];
    switch (entity) {
      case 'celllines':
        currentData = await this.getCelllines();
        break;
      case 'orders':
        currentData = await this.getOrders();
        break;
      case 'oligos':
        currentData = await this.getOligos();
        break;
      case 'plasmids':
        currentData = await this.getPlasmids();
        break;
    }

    // Find the next available ID
    const maxId = Math.max(...currentData.map(item => item.id), 0);
    
    // Process import data and assign new IDs
    const processedData = importData.map((row, index) => {
      const newId = maxId + index + 1;
      return { ...row, id: newId };
    });

    // Merge with existing data
    const mergedData = [...currentData, ...processedData];

    // Convert back to CSV
    const headers = this.getHeadersForEntity(entity);
    const csvContent = this.dataToCSV(mergedData, headers);

    // Create commit message
    const message = `Bulk import ${processedData.length} ${entity} via CSV upload`;

    // Update GitHub
    await this.githubService.updateCSV(filename, csvContent, message);
  }

  // Helper methods for data mapping
  private celllineMapper = (row: string[]): Cellline => ({
    id: parseInt(row[0]) || 0,
    user_id: parseInt(row[1]) || 0,
    user_name: '', // Will be resolved from user_id
    organism_id: parseInt(row[2]) || 0,
    organism_name: '', // Will be resolved from organism_id
    refid: row[3] || '',
    genotype: row[4] || '',
    date: row[5] || '',
    source: row[6] || '',
    link: row[7] || '',
    copies: parseInt(row[8]) || 0,
    leftcopies: parseInt(row[9]) || 0,
    parent: row[10] || '',
    reference: row[11] || '',
    sequence: row[12] || '',
    comment: row[13] || '',
    location: row[14] || ''
  });

  private organismMapper = (row: string[]): Organism => ({
    id: parseInt(row[0]) || 0,
    name: row[1] || ''
  });

  private vendorMapper = (row: string[]): Vendor => ({
    id: parseInt(row[0]) || 0,
    name: row[1] || ''
  });

  private categoryMapper = (row: string[]): Category => ({
    id: parseInt(row[0]) || 0,
    name: row[1] || ''
  });

  private userMapper = (row: string[]): User => ({
    id: parseInt(row[0]) || 0,
    username: row[1] || '',
    first_name: row[2] || '',
    last_name: row[3] || '',
    email: row[4] || ''
  });

  // Normalized mappers for orders, oligos, plasmids
  private orderMapper = (row: string[]): Order => ({
    id: parseInt(row[0]) || 0,
    user_id: parseInt(row[1]) || 0,
    user_name: '', // Will be resolved from user_id
    vendor_id: parseInt(row[2]) || 0,
    vendor_name: '', // Will be resolved from vendor_id
    category_id: parseInt(row[3]) || 0,
    category_name: '', // Will be resolved from category_id
    catalog: row[4] || '',
    qty: parseInt(row[5]) || 0,
    desc: row[6] || '',
    unitprice: parseFloat(row[7]) || 0,
    unit: row[8] || '',
    link: row[9] || '',
    orderdate: row[10] || '',
    receiptdate: row[11] || '',
    comment: row[12] || '',
    location: row[13] || ''
  });

  private oligoMapper = (row: string[]): Oligo => ({
    id: parseInt(row[0]) || 0,
    user_id: parseInt(row[1]) || 0,
    user_name: '', // Will be resolved from user_id
    organism_id: parseInt(row[2]) || 0,
    organism_name: '', // Will be resolved from organism_id
    refid: row[3] || '',
    desc: row[4] || '',
    seq: row[5] || '',
    date: row[6] || '',
    source: row[7] || '',
    link: row[8] || '',
    reference: row[9] || '',
    usefulseq: row[10] || '',
    comment: row[11] || '',
    location: row[12] || '',
    length: parseInt(row[13]) || 0,
    meltingtemp: parseFloat(row[14]) || 0,
    gc: parseFloat(row[15]) || 0
  });

  private plasmidMapper = (row: string[]): Plasmid => ({
    id: parseInt(row[0]) || 0,
    user_id: parseInt(row[1]) || 0,
    user_name: '', // Will be resolved from user_id
    organism_id: parseInt(row[2]) || 0,
    organism_name: '', // Will be resolved from organism_id
    refid: row[3] || '',
    genotype: row[4] || '',
    date: row[5] || '',
    source: row[6] || '',
    link: row[7] || '',
    replicates: parseInt(row[8]) || 0,
    leftover: parseInt(row[9]) || 0,
    parent: row[10] || '',
    reference: row[11] || '',
    sequence: row[12] || '',
    resistance: row[13] || '',
    temperature: row[14] || '',
    copynumber: row[15] || '',
    comment: row[16] || '',
    location: row[17] || ''
  });

  async getUsers(): Promise<User[]> {
    if (this.useGitHub) {
      try {
        const csvContent = await this.githubService.getCSVContent('users.csv');
        return csvManager.parseCSV(csvContent, this.userMapper);
      } catch (error) {
        console.warn('Failed to load users from GitHub, using local data:', error);
      }
    }
    return await csvManager.getUsers();
  }

  async getOrders(): Promise<Order[]> {
    let data: Order[];
    
    if (this.useGitHub) {
      try {
        console.log('🌐 Loading orders from GitHub...');
        const csvContent = await this.githubService.getCSVContent('orders.csv');
        console.log('✅ GitHub data loaded, parsing CSV...');
        data = csvManager.parseCSV(csvContent, this.orderMapper);
        console.log(`✅ Parsed ${data.length} orders from GitHub`);
      } catch (error) {
        console.error('❌ Failed to load from GitHub, using local data:', error);
        console.log('💾 Loading from local CSV files...');
        data = await csvManager.getOrders();
      }
    } else {
      console.log('⚠️ GitHub not configured, using local data');
      console.log('💾 Loading from local CSV files...');
      data = await csvManager.getOrders();
    }
    
    // Resolve relationships for normalized data
    return this.resolveOrderRelationships(data);
  }

  async getOligos(): Promise<Oligo[]> {
    let data: Oligo[];
    
    if (this.useGitHub) {
      try {
        console.log('🌐 Loading oligos from GitHub...');
        const csvContent = await this.githubService.getCSVContent('oligos.csv');
        console.log('✅ GitHub data loaded, parsing CSV...');
        data = csvManager.parseCSV(csvContent, this.oligoMapper);
        console.log(`✅ Parsed ${data.length} oligos from GitHub`);
      } catch (error) {
        console.error('❌ Failed to load from GitHub, using local data:', error);
        console.log('💾 Loading from local CSV files...');
        data = await csvManager.getOligos();
      }
    } else {
      console.log('⚠️ GitHub not configured, using local data');
      console.log('💾 Loading from local CSV files...');
      data = await csvManager.getOligos();
    }
    
    // Resolve relationships for normalized data
    return this.resolveOligoRelationships(data);
  }

  async getPlasmids(): Promise<Plasmid[]> {
    let data: Plasmid[];
    
    if (this.useGitHub) {
      try {
        console.log('🌐 Loading plasmids from GitHub...');
        const csvContent = await this.githubService.getCSVContent('plasmids.csv');
        console.log('✅ GitHub data loaded, parsing CSV...');
        data = csvManager.parseCSV(csvContent, this.plasmidMapper);
        console.log(`✅ Parsed ${data.length} plasmids from GitHub`);
      } catch (error) {
        console.error('❌ Failed to load from GitHub, using local data:', error);
        console.log('💾 Loading from local CSV files...');
        data = await csvManager.getPlasmids();
      }
    } else {
      console.log('⚠️ GitHub not configured, using local data');
      console.log('💾 Loading from local CSV files...');
      data = await csvManager.getPlasmids();
    }
    
    // Resolve relationships for normalized data
    return this.resolvePlasmidRelationships(data);
  }

  private getHeadersForEntity(entity: string): string[] {
    switch (entity) {
      case 'celllines':
        return ['id', 'user_id', 'organism_id', 'refid', 'genotype', 'date', 'source', 'link', 'copies', 'leftcopies', 'parent', 'reference', 'sequence', 'comment', 'location'];
      case 'organisms':
        return ['id', 'name'];
      case 'vendors':
        return ['id', 'name'];
      case 'categories':
        return ['id', 'name'];
      case 'users':
        return ['id', 'username', 'first_name', 'last_name', 'email'];
      case 'orders':
        return ['id', 'user_id', 'vendor_id', 'category_id', 'catalog', 'qty', 'desc', 'unitprice', 'unit', 'link', 'orderdate', 'receiptdate', 'comment', 'location'];
      case 'oligos':
        return ['id', 'user_id', 'organism_id', 'refid', 'desc', 'seq', 'date', 'source', 'link', 'reference', 'usefulseq', 'comment', 'location', 'length', 'meltingtemp', 'gc'];
      case 'plasmids':
        return ['id', 'user_id', 'organism_id', 'refid', 'genotype', 'date', 'source', 'link', 'replicates', 'leftover', 'parent', 'reference', 'sequence', 'resistance', 'temperature', 'copynumber', 'comment', 'location'];
      default:
        throw new Error(`Unknown entity: ${entity}`);
    }
  }

  private dataToCSV(data: any[], headers: string[]): string {
    const csvRows = [
      headers.join(','),
      ...data.map(item => 
        headers.map(header => {
          let value = item[header] || '';
          
          // Convert to string and handle special characters
          value = String(value);
          
          // Replace newlines with spaces to prevent CSV corruption
          value = value.replace(/[\r\n]+/g, ' ');
          
          // For normalized format, only output ID fields, not names
          if (header === 'user_name' || header === 'organism_name') {
            return ''; // Skip name fields for normalized CSV
          }
          
          // Escape quotes and wrap in quotes if needed
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          
          return value;
        }).join(',')
      )
    ];
    return csvRows.join('\n');
  }

  // Resolve foreign key relationships for normalized data
  private async resolveCelllineRelationships(celllines: Cellline[]): Promise<Cellline[]> {
    try {
      // Load reference data
      const [organisms, users] = await Promise.all([
        this.getOrganisms(),
        this.getUsers()
      ]);

      // Create lookup maps
      const organismMap = new Map(organisms.map(org => [org.id, org.name]));
      const userMap = new Map(users.map(user => [user.id, user.username]));

      // Resolve relationships
      return celllines.map(cellline => ({
        ...cellline,
        organism_name: organismMap.get(cellline.organism_id) || '',
        user_name: userMap.get(cellline.user_id) || ''
      }));
    } catch (error) {
      console.warn('Failed to resolve relationships, returning data as-is:', error);
      return celllines;
    }
  }

  private async resolveOrderRelationships(orders: Order[]): Promise<Order[]> {
    try {
      // Load reference data
      const [users, vendors, categories] = await Promise.all([
        this.getUsers(),
        this.getVendors(),
        this.getCategories()
      ]);

      // Create lookup maps
      const userMap = new Map(users.map(user => [user.id, user.username]));
      const vendorMap = new Map(vendors.map(vendor => [vendor.id, vendor.name]));
      const categoryMap = new Map(categories.map(category => [category.id, category.name]));

      // Resolve relationships
      return orders.map(order => ({
        ...order,
        user_name: userMap.get(order.user_id) || '',
        vendor_name: vendorMap.get(order.vendor_id) || '',
        category_name: categoryMap.get(order.category_id) || ''
      }));
    } catch (error) {
      console.warn('Failed to resolve order relationships, returning data as-is:', error);
      return orders;
    }
  }

  private async resolveOligoRelationships(oligos: Oligo[]): Promise<Oligo[]> {
    try {
      // Load reference data
      const [organisms, users] = await Promise.all([
        this.getOrganisms(),
        this.getUsers()
      ]);

      // Create lookup maps
      const organismMap = new Map(organisms.map(org => [org.id, org.name]));
      const userMap = new Map(users.map(user => [user.id, user.username]));

      // Resolve relationships
      return oligos.map(oligo => ({
        ...oligo,
        organism_name: organismMap.get(oligo.organism_id) || '',
        user_name: userMap.get(oligo.user_id) || ''
      }));
    } catch (error) {
      console.warn('Failed to resolve oligo relationships, returning data as-is:', error);
      return oligos;
    }
  }

  private async resolvePlasmidRelationships(plasmids: Plasmid[]): Promise<Plasmid[]> {
    try {
      // Load reference data
      const [organisms, users] = await Promise.all([
        this.getOrganisms(),
        this.getUsers()
      ]);

      // Create lookup maps
      const organismMap = new Map(organisms.map(org => [org.id, org.name]));
      const userMap = new Map(users.map(user => [user.id, user.username]));

      // Resolve relationships
      return plasmids.map(plasmid => ({
        ...plasmid,
        organism_name: organismMap.get(plasmid.organism_id) || '',
        user_name: userMap.get(plasmid.user_id) || ''
      }));
    } catch (error) {
      console.warn('Failed to resolve plasmid relationships, returning data as-is:', error);
      return plasmids;
    }
  }
}

export const dataManager = new DataManager();