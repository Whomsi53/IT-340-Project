(async () => {
    try {
        const response = await fetch("http://localhost:5500/api/cart");
    
        
        const userCartData = await response.json();
        console.log("Cart data:", userCartData);
        
        addProductToCart(userCartData);
        
        
    } catch (err) {
        console.error("Fetch failed:", err);
    }


    try {
        const response = await fetch("http://localhost:5500/api/getSubtotal");

        
        const priceValues = await response.json();
        const {subtotal, tax, total} = priceValues;
        
        if(subtotal == 0 || total == 0){
            document.getElementById("shipping").textContent = "$0";
            document.getElementById("total").textContent == "$0"; 
        }
        else{
            document.getElementById("subtotal").textContent = "$" + subtotal;
            document.getElementById("tax").textContent = "$" + tax;
            document.getElementById("total").textContent = "$" + total;
        }
        
        
    } catch (err) {
        console.error("Fetch failed:", err);
    }


})();

function addProductToCart(cart) {
    const itemsHolder = document.querySelector('.items');

    cart.forEach(item => {
        const productDiv = document.createElement('div');
        productDiv.classList.add('product', 'mb-3'); 

    
        productDiv.innerHTML = `
            <div class="row">
                <div class="col-md-3">
                    <img class="img-fluid mx-auto d-block image" width="100" height="100" src="${item.productImg}">
                </div>
                <div class="col-md-8">
                    <div class="info">
                        <div class="row">
                            <div class="col-md-5 product-name">
                                <div class="product-name">
                                    <p class="cart-item-name">${item.productName}</p>
                                    <div class="product-info">
                                        <div><span class="value"></span></div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4 quantity">
                                <label for="quantity">Quantity:</label>
                                <input type="number" value="${item.quantity}" class="form-control quantity-input">
                            </div>
                            <div class="col-md-3 price">
                                <span>${item.productPrice}</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-1 d-flex align-items-center">
                    <button class="btn btn-danger btn-sm remove-item">Remove</button>
                </div>
                </div>
                
            </div>
            </div>
        `;
        

        itemsHolder.appendChild(productDiv);

        const qtyInput = productDiv.querySelector(".quantity-input");
        qtyInput.addEventListener("change", async (e) => {
            

            try {
                const res = await fetch("http://localhost:5500/api/changeQty", {
                    method: "POST", 
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({productName: item.productName , quantity: e.target.value }) 
                });

                
            } catch (err) {
                console.error(err);
            }
            
        });

        productDiv.querySelector('.remove-item').addEventListener('click', async () => {
            productDiv.remove();
            
             try {
                const res = await fetch("http://localhost:5500/api/removeFromCart", {
                    method: "POST", 
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ productName: item.productName }) 
                });

                
            } catch (err) {
                console.error(err);
            }
            
        });
    });
    
    
    
}

