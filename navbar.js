// ========================
// NAVBAR RENDER
// ========================
function renderNavbar() {
    const header = document.querySelector("header");

    header.innerHTML = `
        <div class="nav-left">
            <a href="/" style="text-decoration:none;">
                <h2 style="color:white; margin:0; font-weight:700;">
                    OutOfStock
                </h2>
            </a>
        </div>

        <div class="nav-center">
            <form class="d-flex" style="width: 40%;" onsubmit="event.preventDefault();">
                <input class="form-control me-2" type="search" placeholder="Search...">
                <button class="btn btn-outline-light" type="submit">Search</button>
            </form>
        </div>

        <div class="nav-right" id="nav-right"></div>
    `;
}

// ========================
// UPDATE USER STATE
// ========================
function updateNavbar() {
    const username = sessionStorage.getItem("username");
    const nav = document.getElementById("nav-right");

    if (username) {
        nav.innerHTML = `
            <span class="nav-user">Hello, ${username}</span>
            <a href="#" id="logout-btn">Logout</a>
            <span>|</span>
            <a href="/shopping-cart/">Cart</a>
        `;
    } else {
        nav.innerHTML = `
            <a href="/login/">Login</a>
            <span>|</span>
            <a href="/shopping-cart/">Cart</a>
        `;
    }

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            sessionStorage.clear();
            window.location.reload();
        };
    }
}

// ========================
// INIT
// ========================
document.addEventListener("DOMContentLoaded", () => {
    renderNavbar();
    updateNavbar();
});
