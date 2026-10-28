export class Order {
    constructor(id, customerName, items, status = "Sedang Disiapkan") {
        this.id = id;
        this.customerName = customerName;
        this.items = items; // Array of menu objects with qty
        this.status = status; // "Sedang Disiapkan" | "Diantar" | "Selesai"
        this.createdAt = new Date().toISOString();
    }

    calculateTotal() { 
        return this.items.reduce((sum, item) => sum + item.price * item.qty, 0); 
    }

    updateStatus(newStatus) { 
        this.status = newStatus; 
    }
}

export default Order;