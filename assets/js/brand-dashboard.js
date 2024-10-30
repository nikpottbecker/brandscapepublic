class BrandDashboard {
    constructor() {
        this.brand = JSON.parse(localStorage.getItem('currentBrand'));
        this.products = JSON.parse(localStorage.getItem(`products_${this.brand.id}`)) || [];
        this.init();
    }

    init() {
        this.checkBrandAuth();
        this.setupEventListeners();
        this.loadDashboardStats();
        this.loadProducts();
        this.loadBrandProfile();
    }

    checkBrandAuth() {
        if (!this.brand || !this.brand.isApproved) {
            window.location.href = '../login.html';
        }
        document.getElementById('brandName').textContent = this.brand.brandName;
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.admin-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('href').substring(1);
                this.showSection(sectionId);
            });
        });

        // Produkt hinzufügen Button
        document.getElementById('addProductBtn').addEventListener('click', () => {
            this.openProductModal();
        });

        // Produkt Formular
        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        // Markenprofil Formular
        document.getElementById('brandProfileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBrandProfile();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('currentBrand');
            window.location.href = '../login.html';
        });
    }

    showSection(sectionId) {
        document.querySelectorAll('.section, .active-section').forEach(section => {
            section.classList.remove('active-section');
        });
        document.getElementById(`${sectionId}-section`).classList.add('active-section');
    }

    loadDashboardStats() {
        document.getElementById('activeProducts').textContent = this.products.length;
        // Produktaufrufe würden in einer echten Implementierung aus einer Datenbank kommen
        document.getElementById('productViews').textContent = '0';
    }

    loadProducts() {
        const productsGrid = document.getElementById('productsGrid');
        productsGrid.innerHTML = this.products.map(product => `
            <div class="product-card">
                <img src="${product.image || 'default-product.jpg'}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <p class="price">${product.price} €</p>
                </div>
                <div class="product-actions">
                    <button onclick="brandDashboard.editProduct(${product.id})">Bearbeiten</button>
                    <button onclick="brandDashboard.deleteProduct(${product.id})">Löschen</button>
                </div>
            </div>
        `).join('');
    }

    openProductModal(productId = null) {
        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        
        if (productId) {
            const product = this.products.find(p => p.id === productId);
            if (product) {
                form.elements.productName.value = product.name;
                form.elements.productDescription.value = product.description;
                form.elements.productPrice.value = product.price;
                form.elements.productCategory.value = product.category;
            }
        } else {
            form.reset();
        }
        
        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('productModal').style.display = 'none';
    }

    async saveProduct() {
        const form = document.getElementById('productForm');
        const productData = {
            id: Date.now(),
            name: form.elements.productName.value,
            description: form.elements.productDescription.value,
            price: parseFloat(form.elements.productPrice.value),
            category: form.elements.productCategory.value,
            brandId: this.brand.id
        };

        // Bildupload verarbeiten
        const imageFile = form.elements.productImage.files[0];
        if (imageFile) {
            productData.image = await this.handleImageUpload(imageFile);
        }

        this.products.push(productData);
        localStorage.setItem(`products_${this.brand.id}`, JSON.stringify(this.products));
        
        this.loadProducts();
        this.loadDashboardStats();
        this.closeModal();
    }

    async handleImageUpload(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result); // Base64 encoded image
            };
            reader.readAsDataURL(file);
        });
    }

    deleteProduct(productId) {
        if (confirm('Möchten Sie dieses Produkt wirklich löschen?')) {
            this.products = this.products.filter(product => product.id !== productId);
            localStorage.setItem(`products_${this.brand.id}`, JSON.stringify(this.products));
            this.loadProducts();
            this.loadDashboardStats();
        }
    }

    loadBrandProfile() {
        const form = document.getElementById('brandProfileForm');
        form.elements.brandDescription.value = this.brand.description || '';
        form.elements.brandWebsite.value = this.brand.website || '';
    }

    async saveBrandProfile() {
        const form = document.getElementById('brandProfileForm');
        
        // Logo-Upload verarbeiten
        const logoFile = form.elements.brandLogoUpload.files[0];
        if (logoFile) {
            this.brand.logo = await this.handleImageUpload(logoFile);
        }

        this.brand.description = form.elements.brandDescription.value;
        this.brand.website = form.elements.brandWebsite.value;

        // Brand-Daten aktualisieren
        localStorage.setItem('currentBrand', JSON.stringify(this.brand));
        
        // Brands-Array aktualisieren
        const brands = JSON.parse(localStorage.getItem('brands')) || [];
        const brandIndex = brands.findIndex(b => b.id === this.brand.id);
        if (brandIndex !== -1) {
            brands[brandIndex] = this.brand;
            localStorage.setItem('brands', JSON.stringify(brands));
        }

        alert('Markenprofil wurde erfolgreich aktualisiert');
    }
}

const brandDashboard = new BrandDashboard(); 