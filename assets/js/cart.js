class ShoppingCart {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.init();
    }

    init() {
        this.loadCart();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('checkoutBtn').addEventListener('click', () => {
            this.showCheckoutModal();
        });

        document.getElementById('checkoutForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processOrder();
        });
    }

    loadCart() {
        const cartItems = document.getElementById('cartItems');
        if (this.cart.length === 0) {
            cartItems.innerHTML = '<p>Ihr Warenkorb ist leer</p>';
            return;
        }

        cartItems.innerHTML = this.cart.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}">
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <p>${item.brandName}</p>
                    <p class="price">${item.price} €</p>
                    <div class="item-quantity">
                        <button class="quantity-button" onclick="cart.updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-button" onclick="cart.updateQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
                <button onclick="cart.removeItem(${item.id})" class="remove-button">×</button>
            </div>
        `).join('');

        this.updateSummary();
    }

    updateSummary() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 50 ? 0 : 4.99;
        const total = subtotal + shipping;

        document.getElementById('subtotal').textContent = `${subtotal.toFixed(2)} €`;
        document.getElementById('shipping').textContent = `${shipping.toFixed(2)} €`;
        document.getElementById('total').textContent = `${total.toFixed(2)} €`;
    }

    addItem(product) {
        const existingItem = this.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }

        this.saveCart();
        this.loadCart();
    }

    updateQuantity(productId, change) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.removeItem(productId);
                return;
            }
        }

        this.saveCart();
        this.loadCart();
    }

    removeItem(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.loadCart();
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    showCheckoutModal() {
        if (!this.cart.length) {
            alert('Ihr Warenkorb ist leer');
            return;
        }
        document.getElementById('checkoutModal').style.display = 'block';
    }

    async processOrder() {
        const form = document.getElementById('checkoutForm');
        const orderData = {
            items: this.cart,
            shipping: {
                street: form.elements.street.value,
                city: form.elements.city.value,
                zipCode: form.elements.zipCode.value
            },
            paymentMethod: form.elements.paymentMethod.value,
            total: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };

        // Speichere die Bestellung
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders.push({
            id: Date.now(),
            ...orderData,
            status: 'pending',
            date: new Date().toISOString()
        });
        localStorage.setItem('orders', JSON.stringify(orders));

        // Leere den Warenkorb
        this.cart = [];
        this.saveCart();

        alert('Vielen Dank für Ihre Bestellung!');
        window.location.href = '/pages/profile.html';
    }
}

const cart = new ShoppingCart(); 