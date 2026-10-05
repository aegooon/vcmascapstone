import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DomainApiService } from '../../core/api/domain-api.service';

export interface InventoryItem {
  id: number;
  serverId?: string;
  name: string;
  category: 'Drugs' | 'Medical Items' | 'Laboratory Equipment' | 'Pet Food';
  stock: number;
  unit: string;
  price: number;
  lastUpdated: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './inventory.html'
})
export class InventoryComponent implements OnInit, OnDestroy {

  // Real-time clock, same pattern as DashboardComponent / AdminComponent
  private timeInterval: any;
  currentTime: Date = new Date();

  searchQuery: string = '';
  selectedCategory: string = 'All';
  isFilterOpen: boolean = false;

  // Modal Control
  isModalOpen: boolean = false;
  isEditMode: boolean = false;

  // Form State
  currentItem: InventoryItem = this.getEmptyItem();

  // Initial Data covering all required categories
  items: InventoryItem[] = [
    { id: 1, name: 'Rabies Vaccine (1yr)', category: 'Drugs', stock: 8, unit: 'vials', price: 15.00, lastUpdated: '2026-09-10' },
    { id: 2, name: 'Amoxicillin 250mg', category: 'Drugs', stock: 45, unit: 'boxes', price: 22.50, lastUpdated: '2026-09-12' },
    { id: 3, name: 'Sterile Surgical Gauze 4x4', category: 'Medical Items', stock: 120, unit: 'packs', price: 5.00, lastUpdated: '2026-09-01' },
    { id: 4, name: 'Surgical Scalpel Handle #3', category: 'Laboratory Equipment', stock: 4, unit: 'units', price: 35.00, lastUpdated: '2026-08-28' },
    { id: 5, name: 'Centrifuge Tube 15ml', category: 'Laboratory Equipment', stock: 30, unit: 'packs', price: 12.00, lastUpdated: '2026-09-05' },
    { id: 6, name: 'Adult Dog Dry Food (Salmon 10kg)', category: 'Pet Food', stock: 18, unit: 'bags', price: 48.00, lastUpdated: '2026-09-14' },
    { id: 7, name: 'Gourmet Cat Wet Food (Chicken Can 85g)', category: 'Pet Food', stock: 65, unit: 'cans', price: 2.50, lastUpdated: '2026-09-15' }
  ];

  categories: string[] = ['All', 'Drugs', 'Medical Items', 'Laboratory Equipment', 'Pet Food'];
  private readonly api = inject(DomainApiService);

  constructor(private router: Router) {}

  ngOnInit() {
    this.api.inventory().subscribe({ next: ({ data }) => {
      this.items = data.items.map((item, index) => ({ id: index + 1, serverId: item.id, name: item.name, category: this.displayCategory(item.category), stock: Number(item.quantity_on_hand), unit: item.unit, price: Number(item.client_price), lastUpdated: item.updated_at.slice(0, 10) }));
    } });
    this.timeInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  // READ: Filtered list calculation
  get filteredItems(): InventoryItem[] {
    return this.items.filter(item => {
      const matchesCategory = this.selectedCategory === 'All' || item.category === this.selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                            item.category.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  // Stock Level Helper Indicator
  getStockStatus(stock: number): 'Low' | 'Medium' | 'High' {
    if (stock <= 10) return 'Low';
    if (stock <= 40) return 'Medium';
    return 'High';
  }

  // Low-stock count for the header stat card
  get lowStockCount(): number {
    return this.items.filter(item => this.getStockStatus(item.stock) === 'Low').length;
  }

  get totalItems(): number {
    return this.items.length;
  }

  get totalInventoryValue(): number {
    return this.items.reduce((sum, item) => sum + item.stock * item.price, 0);
  }

  // CREATE / UPDATE Modal Triggers
  openAddModal(): void {
    this.isEditMode = false;
    this.currentItem = this.getEmptyItem();
    this.isModalOpen = true;
  }

  openEditModal(item: InventoryItem): void {
    this.isEditMode = true;
    this.currentItem = { ...item };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  // CREATE / UPDATE Logic
  saveItem(): void {
    if (!this.currentItem.name || !this.currentItem.category) return;

    this.currentItem.lastUpdated = new Date().toISOString().split('T')[0];

    const payload = { name: this.currentItem.name, category: this.apiCategory(this.currentItem.category), unit: this.currentItem.unit, quantity_on_hand: this.currentItem.stock, reorder_level: 0, unit_cost: this.currentItem.price, client_price: this.currentItem.price, chargeable: true };
    if (this.isEditMode && this.currentItem.serverId) {
      const index = this.items.findIndex(i => i.id === this.currentItem.id);
      if (index !== -1) {
        this.api.updateInventoryItem(this.currentItem.serverId, payload).subscribe({ next: () => { this.items[index] = { ...this.currentItem }; this.closeModal(); } });
      }
    } else {
      this.api.createInventoryItem(payload).subscribe({ next: ({ data }) => { this.currentItem.id = Date.now(); this.currentItem.serverId = data.id; this.items.unshift({ ...this.currentItem }); this.closeModal(); } });
    }
  }

  // DELETE Logic
  deleteItem(id: number): void {
    const item = this.items.find(candidate => candidate.id === id);
    if (!item?.serverId) return;
    this.api.deleteInventoryItem(item.serverId).subscribe({ next: () => { this.items = this.items.filter(candidate => candidate.id !== id); } });
  }

  private getEmptyItem(): InventoryItem {
    return {
      id: 0,
      name: '',
      category: 'Drugs',
      stock: 0,
      unit: 'units',
      price: 0,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  }

  private displayCategory(category: string): InventoryItem['category'] {
    const labels: Record<string, InventoryItem['category']> = { drugs: 'Drugs', medical_items: 'Medical Items', laboratory_equipment: 'Laboratory Equipment', pet_food: 'Pet Food', pet_supplies: 'Pet Food', other: 'Medical Items' };
    return labels[category] ?? 'Medical Items';
  }

  private apiCategory(category: InventoryItem['category']): string {
    const values: Record<InventoryItem['category'], string> = { Drugs: 'drugs', 'Medical Items': 'medical_items', 'Laboratory Equipment': 'laboratory_equipment', 'Pet Food': 'pet_food' };
    return values[category];
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}
