// ========================
// NAVBAR RENDER
// ========================
function renderNavbar() {
    const header = document.querySelector("header");
    if (!header) return;

    header.innerHTML = `
        <div class="nav-left">
            <a href="/" style="text-decoration:none;">
                <h2 style="color:white; margin:0;">OutOfStock</h2>
            </a>
        </div>

        <div class="nav-center">
            <form onsubmit="event.preventDefault();">
                <input id="searchInput" class="form-control" type="search" placeholder="Search...">
                <button class="btn btn-outline-light">Search</button>
            </form>
        </div>

        <div class="nav-right" id="nav-right"></div>
    `;

    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";

    const form = header.querySelector(".nav-center form");
    form.style.display = "flex";
    form.style.gap = "10px";
    form.style.width = "400px";
}

// ========================
// GET USER
// ========================
function getUser() {
    const id = localStorage.getItem("userId");
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!id || !username || username === "undefined" || username === "null") {
        return null;
    }

    return { id, username, role };
}

// ========================
// UPDATE NAVBAR (FINAL RULES)
// ========================
function updateNavbar() {
    const nav = document.getElementById("nav-right");
    const user = getUser();

    if (!nav) return;

    if (user) {
        const isAdmin = user.role === "admin";
        const isSeller = user.role === "seller";

        nav.innerHTML = `
            <span>Hello, ${user.username}</span>

            ${(isAdmin || isSeller) ? `<a href="/dashboard.html">Dashboard</a>` : ""}

            <!-- ✅ EVERY LOGGED-IN USER CAN SEE SUPPORT -->
            <a href="/tickets/">Support</a>

            <a href="#" id="logout">Logout</a>
            <a href="/shopping-cart/">Cart</a>
        `;

        document.getElementById("logout").onclick = () => {
            localStorage.clear();
            window.location.href = "/login/";
        };

    } else {
        nav.innerHTML = `
            <a href="/login/">Login</a>
            <a href="/shopping-cart/">Cart</a>
        `;
    }
}

// ========================
// SEARCH
// ========================
function setupSearch() {
    const input = document.getElementById("searchInput");
    if (!input) return;

    input.addEventListener("input", () => {
        const q = input.value.toLowerCase();

        document.querySelectorAll(".card").forEach(card => {
            const name =
                card.querySelector(".productName")?.innerText.toLowerCase() || "";
            card.style.display = name.includes(q) ? "block" : "none";
        });
    });
}
