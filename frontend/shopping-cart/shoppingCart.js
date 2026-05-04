<script>
function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

// ========================
function normalizeItem(item) {
    return {
        name: item.name || item.productName || "No name",
        image: item.image || item.productImg || "/img/default.png",
        price: typeof (item.price || item.productPrice) === "string"
            ? parseFloat((item.price || item.productPrice).replace("$",""))
            : (item.price || item.productPrice || 0),
        qty: item.qty || item.quantity || 1
    };
}

// ========================
function loadCart() {
    let rawCart = getCart();
    let cart = rawCart.map(normalizeItem);

    const container = document.getElementById("cartItems");
    if (!container) return;

    container.innerHTML = "";

    let subtotal = 0;

    if (!cart.length) {
        container.innerHTML = "<p class='text-muted'>Your cart is empty.</p>";
        document.getElementById("subtotal").textContent = "$0";
        document.getElementById("tax").textContent = "$0";
        document.getElementById("total").textContent = "$0";
        return;
    }

    cart.forEach((item, index) => {

        const { name, image, price, qty } = item;

        subtotal += price * qty;

        const div = document.createElement("div");
        div.className = "product mb-3 p-3 border rounded";

        div.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-2">
                    <img src="${image}" class="img-fluid">
                </div>

                <div class="col-md-4">
                    <p>${name}</p>
                </div>

                <div class="col-md-3">
                    <div class="input-group">
                        <button class="btn btn-outline-secondary" onclick="changeQty(${index}, -1)">-</button>
                        <input type="text" class="form-control text-center" value="${qty}" readonly>
                        <button class="btn btn-outline-secondary" onclick="changeQty(${index}, 1)">+</button>
                    </div>
                </div>

                <div class="col-md-2 text-end">
                    <span>$${(price * qty).toFixed(2)}</span>
                </div>

                <div class="col-md-1 text-end">
                    <button class="btn btn-danger btn-sm" onclick="removeItem(${index})">X</button>
                </div>
            </div>
        `;

        container.appendChild(div);
    });

    const tax = subtotal * 0.06;
    const total = subtotal + tax + 5.99;

    document.getElementById("subtotal").textContent = "$" + subtotal.toFixed(2);
    document.getElementById("tax").textContent = "$" + tax.toFixed(2);
    document.getElementById("total").textContent = "$" + total.toFixed(2);
}

// ========================
function changeQty(index, change) {
    let cart = getCart();

    const current = cart[index];
    current.quantity = (current.quantity || current.qty || 1) + change;

    if (current.quantity <= 0) {
        cart.splice(index, 1);
    }

    saveCart(cart);
    loadCart();
}

// ========================
function removeItem(index) {
    let cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    loadCart();
}

// ========================
document.addEventListener("DOMContentLoaded", loadCart);
</script>
