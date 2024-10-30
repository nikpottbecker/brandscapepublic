class ProductsPage {
    constructor() {
        this.products = [];
        this.brands = [];
        this.filters = {
            categories: [],
            brands: [],
            priceRange: {
                min: null,
                max: null
            },
            searchQuery: ''
        };
        this.sortBy = 'newest';
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.loadBrandFilters();
        this.applyFilters();
    }

    async loadData() {
        // Lade alle Marken
        this.brands = JSON.parse(localStorage.getItem('brands')) || [];
        this.brands = this.brands.filter(brand => brand.isApproved);

        // Lade alle Produkte von allen Marken
        this.products = [];
        this.brands.forEach(brand => {
            const brandProducts = JSON.parse(localStorage.getItem(`products_${brand.id}`)) || [];
            this.products.push(...brandProducts.map(product => ({
                ...product,
                brandName: brand.brandName
            })));
        });
    }

    setupEventListeners() {
        // Filter Events
        document.querySelectorAll('.filter-options input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateFilters());
        });

        document.getElementById('minPrice').addEventListener('input', () => this.updateFilters());
        document.getElementById('maxPrice').addEventListener('input', () => this.updateFilters());
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filters.searchQuery = e.target.value;
            this.applyFilters();
        });

        // Sortierung
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.applyFilters();
        });

        // Filter Buttons
        document.getElementById('applyFilters').addEventListener('click', () => this.applyFilters());
        document.getElementById('resetFilters').addEventListener('click', () => this.resetFilters());
    }

    loadBrandFilters() {
        const brandFilters = document.getElementById('brandFilters');
        brandFilters.innerHTML = this.brands.map(brand => `
            <label>
                <input type="checkbox" value="${brand.id}">
                ${brand.brandName}
            </label>
        `).join('');
    }

    updateFilters() {
        // Kategorien
        this.filters.categories = Array.from(document.querySelectorAll('.filter-options input[type="checkbox"][value]'))
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        // Marken
        this.filters.brands = Array.from(document.querySelectorAll('#brandFilters input[type="checkbox"]'))
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        // Preisbereich
        const minPrice = document.getElementById('minPrice').value;
        const maxPrice = document.getElementById('maxPrice').value;
        this.filters.priceRange.min = minPrice ? parseFloat(minPrice) : null;
        this.filters.priceRange.max = maxPrice ? parseFloat(maxPrice) : null;

        this.updateActiveFilters();
    }

    updateActiveFilters() {
        const activeFilters = document.getElementById('activeFilters');
        let filterTags = [];

        // Kategorien
        this.filters.categories.forEach(category => {
            filterTags.push(`
                <div class="filter-tag">
                    ${category}
                    <button onclick="productsPage.removeFilter('category', '${category}')">&times;</button>
                </div>
            `);
        });

        // Marken
        this.filters.brands.forEach(brandId => {
            const brand = this.brands.find(b => b.id === parseInt(brandId));
            if (brand) {
                filterTags.push(`
                    <div class="filter-tag">
                        ${brand.brandName}
                        <button onclick="productsPage.removeFilter('brand', '${brandId}')">&times;</button>
                    </div>
                `);
            }
        });

        // Preisbereich
        if (this.filters.priceRange.min || this.filters.priceRange.max) {
            filterTags.push(`
                <div class="filter-tag">
                    ${this.filters.priceRange.min || 0}€ - ${this.filters.priceRange.max || '∞'}€
                    <button onclick="productsPage.removeFilter('price')">&times;</button>
                </div>
            `);
        }

        activeFilters.innerHTML = filterTags.join('');
    }

    removeFilter(type, value) {
        switch(type) {
            case 'category':
                this.filters.categories = this.filters.categories.filter(cat => cat !== value);
                document.querySelector(`input[value="${value}"]`).checked = false;
                break;
            case 'brand':
                this.filters.brands = this.filters.brands.filter(brand => brand !== value);
                document.querySelector(`#brandFilters input[value="${value}"]`).checked = false;
                break;
            case 'price':
                this.filters.priceRange.min = null;
                this.filters.priceRange.max = null;
                document.getElementById('minPrice').value = '';
                document.getElementById('maxPrice').value = '';
                break;
        }
        this.applyFilters();
    }

    applyFilters() {
        let filteredProducts = [...this.products];

        // Kategoriefilter
        if (this.filters.categories.length > 0) {
            filteredProducts = filteredProducts.filter(product => 
                this.filters.categories.includes(product.category)
            );
        }

        // Markenfilter
        if (this.filters.brands.length > 0) {
            filteredProducts = filteredProducts.filter(product => 
                this.filters.brands.includes(product.brandId.toString())
            );
        }

        // Preisfilter
        if (this.filters.priceRange.min !== null) {
            filteredProducts = filteredProducts.filter(product => 
                product.price >= this.filters.priceRange.min
            );
        }
        if (this.filters.priceRange.max !== null) {
            filteredProducts = filteredProducts.filter(product => 
                product.price <= this.filters.priceRange.max
            );
        }

        // Suchfilter
        if (this.filters.searchQuery) {
            const query = this.filters.searchQuery.toLowerCase();
            filteredProducts = filteredProducts.filter(product => 
                product.name.toLowerCase().includes(query) ||
                product.description.toLowerCase().includes(query) ||
                product.brandName.toLowerCase().includes(query)
            );
        }

        // Sortierung
        switch(this.sortBy) {
            case 'priceAsc':
                filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'priceDesc':
                filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'nameAsc':
                filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'newest':
                filteredProducts.sort((a, b) => b.id - a.id);
                break;
        }

        this.displayProducts(filteredProducts);
        this.updateActiveFilters();
    }

    displayProducts(products) {
        const productsGrid = document.getElementById('productsGrid');
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const paginatedProducts = products.slice(startIndex, startIndex + this.itemsPerPage);

        productsGrid.innerHTML = paginatedProducts.map(product => `
            <div class="product-card">
                <img src="${product.image || 'default-product.jpg'}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="brand-name">${product.brandName}</p>
                    <p class="description">${product.description}</p>
                    <p class="price">${product.price} €</p>
                </div>
            </div>
        `).join('');

        this.updatePagination(products.length);
    }

    updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        
        let paginationHTML = '';
        
        if (totalPages > 1) {
            paginationHTML += `
                <button ${this.currentPage === 1 ? 'disabled' : ''} 
                        onclick="productsPage.changePage(${this.currentPage - 1})">
                    Zurück
                </button>
            `;

            for (let i = 1; i <= totalPages; i++) {
                paginationHTML += `
                    <button class="${this.currentPage === i ? 'active' : ''}"
                            onclick="productsPage.changePage(${i})">
                        ${i}
                    </button>
                `;
            }

            paginationHTML += `
                <button ${this.currentPage === totalPages ? 'disabled' : ''} 
                        onclick="productsPage.changePage(${this.currentPage + 1})">
                    Weiter
                </button>
            `;
        }

        pagination.innerHTML = paginationHTML;
    }

    changePage(page) {
        this.currentPage = page;
        this.applyFilters();
    }

    resetFilters() {
        this.filters = {
            categories: [],
            brands: [],
            priceRange: {
                min: null,
                max: null
            },
            searchQuery: ''
        };
        
        document.querySelectorAll('.filter-options input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        
        document.getElementById('minPrice').value = '';
        document.getElementById('maxPrice').value = '';
        document.getElementById('searchInput').value = '';
        
        this.currentPage = 1;
        this.applyFilters();
    }
}

const productsPage = new ProductsPage(); 