// ========================
// 🔐 USER SESSION
// ========================
function getUser() {
    try {
        return JSON.parse(sessionStorage.getItem("user"));
    } catch {
        return null;
    }
}

// ========================
// 📡 AUTH HEADERS
// ========================
function getAuthHeaders() {
    const user = getUser();
    if (!user) return {};

    return {
        "x-user-id": user.id,
        "x-role": user.role
    };
}

// ========================
// 🛒 ADD TO CART
// ========================
function shoppingCartClick() {
    let product = JSON.parse(sessionStorage.getItem("selectedProduct"));

    if (!product) {
        product = JSON.parse(localStorage.getItem("selectedProduct"));
    }

    if (!product) {
        alert("ERROR: No product loaded");
        return;
    }

    let cart = JSON.parse(sessionStorage.getItem("cart")) || [];

    let existingItem = cart.find(item => item.productId === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            productId: product.id,
            productName: product.name,
            productPrice: parseFloat(String(product.price).replace("$", "")),
            productImg: product.image || product.img,
            quantity: 1
        });
    }

    sessionStorage.setItem("cart", JSON.stringify(cart));
    alert(product.name + " added to cart");
}

// ========================
// 📦 PRODUCT CLICK
// ========================
function display(card) {
    const product = {
        id: card.getAttribute("data-id"),
        name: card.querySelector(".productName")?.textContent?.trim(),
        price: card.querySelector(".price")?.textContent?.trim(),
        image: card.querySelector(".prod-img")?.getAttribute("src")
    };

    if (!product.id) {
        alert("ERROR: Product ID missing");
        return;
    }

    sessionStorage.setItem("selectedProduct", JSON.stringify(product));
    localStorage.setItem("selectedProduct", JSON.stringify(product));

    window.location.href = `/product_template/index.html?id=${product.id}`;
}

// ========================
// ⭐ SUBMIT REVIEW
// ========================
async function submitReview(productId, comment, rating) {
    const user = getUser();

    if (!user) {
        alert("You must be logged in to leave a review");
        return;
    }

    try {
        const res = await fetch(`/api/reviews`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders()
            },
            body: JSON.stringify({
                product_id: productId,
                comment,
                rating
            })
        });

        const data = await res.json();

        if (data.success) {
            alert("Review submitted");
            location.reload();
        } else {
            alert(data.error || "Failed to submit review");
        }

    } catch (err) {
        console.error(err);
        alert("Error submitting review");
    }
}

// ========================
// ⭐ FETCH REVIEWS (FIXED)
// ========================
async function fetchReviews(productId) {
    try {
        const res = await fetch(`/api/reviews/${productId}`);

        if (!res.ok) return []; // ✅ prevents crash

        const data = await res.json();

        return data.reviews || [];
    } catch (err) {
        console.error(err);
        return [];
    }
}

// ========================
// 🔍 SEARCH PRODUCTS
// ========================
async function searchProducts() {
    const input = document.querySelector(".search input");
    const query = input.value.trim();

    if (!query) {
        window.location.href = "/";
        return;
    }

    try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);

        if (!res.ok) return;

        const products = await res.json();

        renderSearchResults(products, query);

    } catch (err) {
        console.error("Search error:", err);
    }
}

// ========================
// 🎯 RENDER SEARCH RESULTS
// ========================
function renderSearchResults(products, query) {
    const mainGrid = document.querySelector(".product-grid:not(.amazon-grid)");
    const amazonGrid = document.querySelector(".amazon-grid");

    if (!mainGrid || !amazonGrid) return;

    mainGrid.innerHTML = "";

    if (products.length) {
        products.forEach(p => {
            mainGrid.innerHTML += `
                <div class="card" data-id="${p.id}" onclick="display(this)">
                    <img class="prod-img" src="${p.image || '/img/default.png'}">
                    <p>OutOfStock</p>
                    <div class="productName">${p.name}</div>
                    <div class="price">$${p.price}</div>
                </div>
            `;
        });
    } else {
        mainGrid.innerHTML = "<p>No results found</p>";
    }

    const amazonCards = amazonGrid.querySelectorAll(".amazon-card");

    let anyVisible = false;

    amazonCards.forEach(card => {
        const name = card.querySelector(".productName").textContent.toLowerCase();

        if (name.includes(query.toLowerCase())) {
            card.style.display = "block";
            anyVisible = true;
        } else {
            card.style.display = "none";
        }
    });

    const title = document.querySelector(".section-title");

    if (anyVisible) {
        amazonGrid.style.display = "flex";
        if (title) title.style.display = "block";
    } else {
        amazonGrid.style.display = "none";
        if (title) title.style.display = "none";
    }
}

// ========================
// 🔗 SEARCH EVENTS
// ========================
document.addEventListener("DOMContentLoaded", () => {
    const input = document.querySelector(".search input");
    const btn = document.querySelector(".search button");

    let debounceTimer;

    if (input) {
        input.addEventListener("input", () => {
            clearTimeout(debounceTimer);

            debounceTimer = setTimeout(() => {
                searchProducts();
            }, 300);
        });
    }

    if (btn) {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            searchProducts();
        });
    }
});
