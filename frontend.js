// ========================
// 🔐 USER SESSION (SINGLE SOURCE OF TRUTH)
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
// 🛒 ADD TO CART (FIXED)
// ========================
function shoppingCartClick() {
    let product = JSON.parse(sessionStorage.getItem("selectedProduct"));

    // 🔥 fallback (important)
    if (!product) {
        product = JSON.parse(localStorage.getItem("selectedProduct"));
    }

    console.log("ADDING TO CART:", product);

    if (!product) {
        alert("ERROR: No product loaded");
        return;
    }

    let cart = JSON.parse(sessionStorage.getItem("cart")) || [];

    let existingItem = cart.find(item => item.productName === product.name);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            productName: product.name,
            productPrice: product.price,
            productImg: product.img,
            quantity: 1
        });
    }

    sessionStorage.setItem("cart", JSON.stringify(cart));

    console.log("CART:", cart);

    alert(product.name + " added to cart");
}

// ========================
// 📦 PRODUCT CLICK → STORE DATA (FIXED FOR REAL)
// ========================
function display(card) {
    const product = {
        name: card.querySelector(".productName")?.textContent?.trim(),
        price: card.querySelector(".price")?.textContent?.trim(),
        img: card.querySelector(".prod-img")?.getAttribute("src")
    };

    console.log("CLICKED:", product);

    if (!product.name || !product.price || !product.img) {
        alert("ERROR: Missing product data from card");
        return;
    }

    // 🔥 CLEAR OLD (prevents weird bugs)
    sessionStorage.removeItem("selectedProduct");
    localStorage.removeItem("selectedProduct");

    // 🔥 SAVE TO BOTH (THIS FIXES YOUR ISSUE)
    sessionStorage.setItem("selectedProduct", JSON.stringify(product));
    localStorage.setItem("selectedProduct", JSON.stringify(product));

    // 🔥 VERIFY
    console.log("STORED SESSION:", JSON.parse(sessionStorage.getItem("selectedProduct")));
    console.log("STORED LOCAL:", JSON.parse(localStorage.getItem("selectedProduct")));

    window.location.href = "/product_temp/";
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
            alert(data.message || "Failed to submit review");
        }

    } catch (err) {
        console.error(err);
        alert("Error submitting review");
    }
}

// ========================
// ⭐ FETCH REVIEWS
// ========================
async function fetchReviews(productId) {
    try {
        const res = await fetch(`/api/reviews/${productId}`);
        const data = await res.json();

        return data.reviews || [];
    } catch (err) {
        console.error(err);
        return [];
    }
}
