function shoppingCartClick(){
    let productName = document.querySelector("#productName").textContent;
    let productPrice = document.querySelector(".price").textContent;
    let productImg = document.querySelector("#productImg").getAttribute("src");

    console.log("ADDING:", productName, productPrice, productImg);

    if (!productName) {
        alert("ERROR: No product loaded");
        return;
    }

    let cart = JSON.parse(sessionStorage.getItem("cart")) || [];

    let existingItem = cart.find(item => item.productName === productName);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            productName,
            productPrice,
            productImg,
            quantity: 1
        });
    }

    sessionStorage.setItem("cart", JSON.stringify(cart));

    console.log("Cart:", cart);

    if (typeof showToast === "function") {
        showToast(productName + " added to cart");
    }
}

function display(card){
    let productName = card.querySelector(".productName")?.textContent;
    let productPrice = card.querySelector(".price")?.textContent;
    let productImg = card.querySelector(".prod-img")?.getAttribute("src");

    console.log("CLICKED:", productName, productPrice, productImg);

    if (!productName || !productPrice || !productImg) {
        alert("ERROR: Missing product data from card");
        return;
    }

    sessionStorage.setItem("productName", productName);
    sessionStorage.setItem("productPrice", productPrice);
    sessionStorage.setItem("productImg", productImg);

    window.location.href = "/product_temp/";
}
