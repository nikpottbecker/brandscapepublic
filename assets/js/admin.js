class AdminPanel {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.brands = JSON.parse(localStorage.getItem('brands')) || [];
        this.admins = JSON.parse(localStorage.getItem('admins')) || [
            {
                id: 1,
                email: 'admin@brandscape.de',
                password: btoa('admin123'), // Nur für Demo-Zwecke
                username: 'Admin'
            }
        ];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboardStats();
        this.loadPendingBrands();
        this.loadUsers();
        this.checkAdminAuth();
    }

    checkAdminAuth() {
        const currentAdmin = JSON.parse(localStorage.getItem('currentAdmin'));
        if (!currentAdmin) {
            window.location.href = '../login.html';
        }
        document.getElementById('adminName').textContent = currentAdmin.username;
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

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('currentAdmin');
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
        document.getElementById('pendingBrands').textContent = 
            this.brands.filter(brand => !brand.isApproved).length;
        document.getElementById('activeUsers').textContent = this.users.length;
        document.getElementById('approvedBrands').textContent = 
            this.brands.filter(brand => brand.isApproved).length;
    }

    loadPendingBrands() {
        const pendingBrandsList = document.getElementById('pendingBrandsList');
        const pendingBrands = this.brands.filter(brand => !brand.isApproved);

        pendingBrandsList.innerHTML = pendingBrands.map(brand => `
            <div class="brand-card">
                <h3>${brand.brandName}</h3>
                <p>${brand.description}</p>
                <p>Website: <a href="${brand.website}" target="_blank">${brand.website}</a></p>
                <div class="brand-actions">
                    <button onclick="adminPanel.approveBrand(${brand.id})">Genehmigen</button>
                    <button onclick="adminPanel.rejectBrand(${brand.id})">Ablehnen</button>
                </div>
            </div>
        `).join('');
    }

    loadUsers() {
        const usersTableBody = document.getElementById('usersTableBody');
        usersTableBody.innerHTML = this.users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.type}</td>
                <td>
                    <button onclick="adminPanel.editUser(${user.id})">Bearbeiten</button>
                    <button onclick="adminPanel.deleteUser(${user.id})">Löschen</button>
                </td>
            </tr>
        `).join('');
    }

    approveBrand(brandId) {
        const brandIndex = this.brands.findIndex(brand => brand.id === brandId);
        if (brandIndex !== -1) {
            this.brands[brandIndex].isApproved = true;
            localStorage.setItem('brands', JSON.stringify(this.brands));
            this.loadDashboardStats();
            this.loadPendingBrands();
        }
    }

    rejectBrand(brandId) {
        this.brands = this.brands.filter(brand => brand.id !== brandId);
        localStorage.setItem('brands', JSON.stringify(this.brands));
        this.loadDashboardStats();
        this.loadPendingBrands();
    }

    deleteUser(userId) {
        if (confirm('Möchten Sie diesen Benutzer wirklich löschen?')) {
            this.users = this.users.filter(user => user.id !== userId);
            localStorage.setItem('users', JSON.stringify(this.users));
            this.loadUsers();
            this.loadDashboardStats();
        }
    }
}

const adminPanel = new AdminPanel(); 