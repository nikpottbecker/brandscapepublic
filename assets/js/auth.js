// Einfache Benutzerverwaltung mit localStorage
class UserAuth {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.brands = JSON.parse(localStorage.getItem('brands')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    }

    register(data, type = 'user') {
        const { email, password } = data;
        
        // Prüfen ob E-Mail bereits existiert
        if (this.users.find(user => user.email === email) || 
            this.brands.find(brand => brand.email === email)) {
            throw new Error('Diese E-Mail ist bereits registriert');
        }

        const baseUser = {
            id: Date.now(),
            email,
            password: this.hashPassword(password),
            type
        };

        if (type === 'user') {
            const user = {
                ...baseUser,
                username: data.username
            };
            this.users.push(user);
            localStorage.setItem('users', JSON.stringify(this.users));
        } else if (type === 'brand') {
            const brand = {
                ...baseUser,
                brandName: data.brandName,
                description: data.brandDescription,
                website: data.website,
                isApproved: false // Marken müssen erst genehmigt werden
            };
            this.brands.push(brand);
            localStorage.setItem('brands', JSON.stringify(this.brands));
        }

        return true;
    }

    login(email, password) {
        // Prüfe zuerst auf Admin-Login
        const admin = this.admins?.find(admin => 
            admin.email === email && 
            admin.password === this.hashPassword(password)
        );

        if (admin) {
            localStorage.setItem('currentAdmin', JSON.stringify(admin));
            window.location.href = 'admin/dashboard.html';
            return true;
        }

        // Normaler User-Login
        const user = this.users.find(user => 
            user.email === email && 
            user.password === this.hashPassword(password)
        );

        if (!user) {
            throw new Error('Ungültige E-Mail oder Passwort');
        }

        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    hashPassword(password) {
        // In der Praxis sollte hier eine richtige Verschlüsselung verwendet werden
        return btoa(password);
    }
}

const auth = new UserAuth();

// Event Listeners für die Registrierungsseite
document.addEventListener('DOMContentLoaded', () => {
    const typeButtons = document.querySelectorAll('.type-button');
    const userFields = document.querySelector('.user-fields');
    const brandFields = document.querySelector('.brand-fields');
    const registerForm = document.getElementById('registerForm');

    if (typeButtons.length) {
        typeButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Toggle active class
                typeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Show/hide relevant fields
                if (button.dataset.type === 'user') {
                    userFields.style.display = 'block';
                    brandFields.style.display = 'none';
                } else {
                    userFields.style.display = 'none';
                    brandFields.style.display = 'block';
                }
            });
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const activeType = document.querySelector('.type-button.active').dataset.type;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                alert('Die Passwörter stimmen nicht überein');
                return;
            }

            try {
                const data = {
                    email,
                    password
                };

                if (activeType === 'user') {
                    data.username = document.getElementById('username').value;
                } else {
                    data.brandName = document.getElementById('brandName').value;
                    data.brandDescription = document.getElementById('brandDescription').value;
                    data.website = document.getElementById('website').value;
                }

                if (await auth.register(data, activeType)) {
                    alert('Registrierung erfolgreich!' + 
                          (activeType === 'brand' ? ' Ihre Marke wird überprüft.' : ''));
                    window.location.href = 'login.html';
                }
            } catch (error) {
                alert(error.message);
            }
        });
    }
}); 