document.addEventListener("DOMContentLoaded", () => {
    const addItemForm = document.getElementById("add-item-form");
    const cartBody = document.getElementById("cart-body");
    const totalBudgetEl = document.getElementById("total-budget");
    const totalActualEl = document.getElementById("total-actual");
    const completeCartBtn = document.getElementById("complete-cart-btn");
    const newCartTab = document.getElementById("new-cart-tab");
    const historicalCartTab = document.getElementById("historical-cart-tab");
    const newCartContent = document.getElementById("new-cart-content");
    const historicalCartContent = document.getElementById("historical-cart-content");
    const historicalCartGroups = document.getElementById("historical-cart-groups");

    // OCR Elements
    const imageUpload = document.getElementById("image-upload");
    const processImageBtn = document.getElementById("process-image-btn");

    let cart = [];
    let historicalCarts = JSON.parse(localStorage.getItem("historicalCarts")) || [];

    function saveHistoricalCartsToLocalStorage() {
        localStorage.setItem("historicalCarts", JSON.stringify(historicalCarts));
    }

    function updateTotals() {
        const totalBudget = cart.reduce((sum, item) => sum + item.budget, 0).toFixed(2);
        const totalActual = cart.reduce((sum, item) => sum + item.actual, 0).toFixed(2);
        totalBudgetEl.textContent = totalBudget;
        totalActualEl.textContent = totalActual;
    }

    function renderCart() {
        cartBody.innerHTML = "";
        cart.forEach((item, index) => {
            const row = document.createElement("tr");
            row.className = item.status === "Complete" ? "cart-row-completed" : "cart-row-incomplete";

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td><input type="number" step="0.01" value="${item.budget}" class="editable-budget"></td>
                <td><input type="number" step="0.01" value="${item.actual}" class="editable-actual"></td>
                <td>
                    <select class="status-dropdown">
                        <option value="Incomplete" ${item.status === "Incomplete" ? "selected" : ""}>Incomplete</option>
                        <option value="Complete" ${item.status === "Complete" ? "selected" : ""}>Complete</option>
                    </select>
                </td>
                <td><button class="delete-btn">&times;</button></td>
            `;

            row.querySelector(".editable-budget").addEventListener("change", (e) => {
                item.budget = parseFloat(e.target.value) || 0;
                updateTotals();
            });

            row.querySelector(".editable-actual").addEventListener("change", (e) => {
                item.actual = parseFloat(e.target.value) || 0;
                updateTotals();
            });

            row.querySelector(".status-dropdown").addEventListener("change", (e) => {
                item.status = e.target.value;
                renderCart();
            });

            row.querySelector(".delete-btn").addEventListener("click", () => {
                cart.splice(index, 1);
                renderCart();
                updateTotals();
            });

            cartBody.appendChild(row);
        });
        updateTotals();
    }

    function getRowColor(totalBudget, totalActual) {
        if (totalBudget > totalActual) {
            return "green-row";
        } else if (totalActual > totalBudget) {
            return "red-row";
        } else {
            return "white-row";
        }
    }

    function renderHistoricalCarts() {
        historicalCartGroups.innerHTML = "";

        historicalCarts.sort((a, b) => new Date(b.date) - new Date(a.date));

        historicalCarts.forEach((cartData, index) => {
            const group = document.createElement("div");
            group.className = "historical-cart-group";

            const totalBudget = cartData.items.reduce((sum, item) => sum + item.budget, 0).toFixed(2);
            const totalActual = cartData.items.reduce((sum, item) => sum + item.actual, 0).toFixed(2);

            const rowColor = getRowColor(totalBudget, totalActual);

            group.innerHTML = `
                <h4>Cart #${index + 1} - ${cartData.date}</h4>
                <table class="historical-cart">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Item</th>
                            <th>Budget ($)</th>
                            <th>Actual ($)</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cartData.items
                            .map(
                                (item, i) =>
                                    `<tr>
                                        <td>${i + 1}</td>
                                        <td>${item.name}</td>
                                        <td>${item.budget.toFixed(2)}</td>
                                        <td>${item.actual.toFixed(2)}</td>
                                        <td>${item.status}</td>
                                    </tr>`
                            )
                            .join("")}
                        <tr class="${rowColor}">
                            <td colspan="2"><strong>Totals</strong></td>
                            <td><strong>${totalBudget}</strong></td>
                            <td><strong>${totalActual}</strong></td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
                <button class="reuse-btn">Reuse Cart</button>
            `;

            group.querySelector(".reuse-btn").addEventListener("click", () => {
                cart = cartData.items.map((item) => ({
                    ...item,
                    status: "Incomplete",
                }));
                renderCart();
                newCartTab.click();
            });

            historicalCartGroups.appendChild(group);
        });
    }

    addItemForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("item-name").value;
        const budget = parseFloat(document.getElementById("item-budget").value) || 0;
        const actual = parseFloat(document.getElementById("item-actual").value) || 0;
        cart.push({ name, budget, actual, status: "Incomplete" });
        renderCart();
        addItemForm.reset();
    });

    completeCartBtn.addEventListener("click", () => {
        if (cart.length > 0) {
            const date = new Date().toLocaleDateString();
            historicalCarts.push({ date, items: [...cart] });
            saveHistoricalCartsToLocalStorage();
            cart = [];
            renderCart();
            renderHistoricalCarts();
        }
    });

    newCartTab.addEventListener("click", () => {
        newCartTab.classList.add("active");
        historicalCartTab.classList.remove("active");
        newCartContent.style.display = "block";
        historicalCartContent.style.display = "none";
    });

    historicalCartTab.addEventListener("click", () => {
        historicalCartTab.classList.add("active");
        newCartTab.classList.remove("active");
        historicalCartContent.style.display = "block";
        newCartContent.style.display = "none";
    });

    document.getElementById("date-display").textContent = `Date: ${new Date().toLocaleDateString()}`;

    renderCart();
    renderHistoricalCarts();

    // OCR Feature
    processImageBtn.addEventListener("click", async () => {
        const file = imageUpload.files[0];
        if (!file) {
            alert("Please upload an image first.");
            return;
        }

        const reader = new FileReader();
        reader.onload = async function (e) {
            const { data } = await Tesseract.recognize(e.target.result, "eng");
            const lines = data.text.split("\n").map(line => line.trim()).filter(line => line);

            lines.forEach(line => {
                const match = line.match(/^(.+?)\s*\$?(\d+(\.\d{1,2})?)$/);
                if (match) {
                    cart.push({ name: match[1], budget: parseFloat(match[2]), actual: 0, status: "Incomplete" });
                }
            });

            renderCart();
        };

        reader.readAsDataURL(file);
    });
});
