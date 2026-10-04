import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

export interface InventoryItem {
  id: number;
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

  constructor(private router: Router) {}

  ngOnInit() {
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

    if (this.isEditMode) {
      const index = this.items.findIndex(i => i.id === this.currentItem.id);
      if (index !== -1) {
        this.items[index] = { ...this.currentItem };
      }
    } else {
      this.currentItem.id = Date.now();
      this.items.unshift({ ...this.currentItem });
    }

    this.closeModal();
  }

  // DELETE Logic
  deleteItem(id: number): void {
    if (confirm('Are you sure you want to delete this inventory item?')) {
      this.items = this.items.filter(item => item.id !== id);
    }
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

  logout(): void {
    this.router.navigate(['/login']);
  }
}