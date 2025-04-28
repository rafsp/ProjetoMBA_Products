document.addEventListener('DOMContentLoaded', () => {
    const accountName = "stecommercellmaula";
    const containerName = "products";
    const sasToken = "sv=2024-11-04&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2025-04-28T23:01:08Z&st=2025-04-28T15:01:08Z&spr=https&sig=FO%2Fv1dSNqBB210g0fY4UOcR5BToQijySfWlCPiD2pyo%3D";
    const blobName = "products.json";

    const baseUrl = `https://${accountName}.blob.core.windows.net/${containerName}`;
    const statusMessage = document.getElementById('statusMessage');
    const productTableBody = document.getElementById('productTableBody');
    const addProductBtn = document.getElementById('addProductBtn');
    const productFormContainer = document.getElementById('productFormContainer');
    const productForm = document.getElementById('productForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const formTitle = document.getElementById('formTitle');
    let editingProductId = null;
    let products = [];

    function showMessage(message, type = 'info', duration = 0) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.style.display = 'block';
        if (duration > 0) {
            setTimeout(() => {
                statusMessage.textContent = '';
                statusMessage.style.display = 'none';
            }, duration);
        }
    }

    async function fetchProducts() {
        showMessage('Carregando produtos...', 'info');
        productTableBody.innerHTML = '';

        try {
            const url = `${baseUrl}/${blobName}?${sasToken}`;
            const response = await fetch(url);
            if (!response.ok) {
                products = [];
                throw new Error("products.json ainda não existe. Será criado ao salvar o primeiro produto.");
            }
            const text = await response.text();
            products = JSON.parse(text);
            displayProducts(products);
            showMessage('Produtos carregados com sucesso!', 'success', 2000);
        } catch (error) {
            console.warn(error.message);
            productTableBody.innerHTML = '<tr><td colspan="5">Nenhum produto encontrado.</td></tr>';
            showMessage('Nenhum produto encontrado.', 'info');
        }
    }

    function displayProducts(products) {
        productTableBody.innerHTML = '';
        if (!products || products.length === 0) {
            productTableBody.innerHTML = '<tr><td colspan="5">Nenhum produto encontrado.</td></tr>';
            return;
        }
        products.forEach(product => {
            const row = productTableBody.insertRow();
            const updatedAt = product.updatedAt ? new Date(product.updatedAt).toLocaleString('pt-BR') : 'N/A';
            const price = (product.price ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            row.innerHTML = `
                <td>${product.sku || ''}</td>
                <td>${product.name || ''}</td>
                <td>${price}</td>
                <td>${updatedAt}</td>
                <td>
                    <button class="edit-btn" data-id="${product.id}">Editar</button>
                    <button class="delete-btn" data-id="${product.id}">Excluir</button>
                </td>
            `;
        });
    }

    async function saveProductsFile() {
        const url = `${baseUrl}/${blobName}?${sasToken}`;
        const options = {
            method: "PUT",
            headers: {
                "x-ms-blob-type": "BlockBlob",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(products, null, 2)
        };
        await fetch(url, options);
    }

    async function addOrUpdateProduct(productData) {
        const now = new Date().toISOString();
        if (editingProductId) {
            const index = products.findIndex(p => p.id === editingProductId);
            if (index !== -1) {
                products[index] = {
                    ...products[index],
                    ...productData,
                    updatedAt: now
                };
            }
        } else {
            const newProduct = {
                ...productData,
                id: crypto.randomUUID(),
                createdAt: now,
                updatedAt: now
            };
            products.push(newProduct);
        }
        await saveProductsFile();
        fetchProducts();
    }

    async function deleteProduct(id) {
        if (!confirm("Tem certeza que deseja excluir?")) return;
        products = products.filter(p => p.id !== id);
        await saveProductsFile();
        fetchProducts();
        showMessage('Produto excluído com sucesso!', 'success', 2000);
    }

    function showForm(product = null) {
        statusMessage.style.display = 'none';
        if (product) {
            formTitle.textContent = 'Editar Produto';
            editingProductId = product.id;
            document.getElementById('productId').value = product.id;
            document.getElementById('sku').value = product.sku || '';
            document.getElementById('name').value = product.name || '';
            document.getElementById('description').value = product.description || '';
            document.getElementById('price').value = product.price || '';
        } else {
            formTitle.textContent = 'Adicionar Produto';
            editingProductId = null;
            productForm.reset();
        }
        productFormContainer.style.display = 'block';
    }

    function hideForm() {
        productFormContainer.style.display = 'none';
        productForm.reset();
        editingProductId = null;
    }

    addProductBtn.addEventListener('click', () => showForm());
    cancelBtn.addEventListener('click', () => hideForm());

    productForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const productData = {
            sku: document.getElementById('sku').value.trim(),
            name: document.getElementById('name').value.trim(),
            description: document.getElementById('description').value.trim(),
            price: parseFloat(document.getElementById('price').value) || 0
        };
        if (!productData.sku || !productData.name || productData.price <= 0) {
            showMessage('Preencha SKU, Nome e Preço maior que zero.', 'error');
            return;
        }
        await addOrUpdateProduct(productData);
        showMessage('Produto salvo com sucesso!', 'success', 2000);
        hideForm();
    });

    productTableBody.addEventListener('click', async (event) => {
        const target = event.target;
        if (target.classList.contains('edit-btn')) {
            const id = target.dataset.id;
            const product = products.find(p => p.id === id);
            if (product) showForm(product);
        } else if (target.classList.contains('delete-btn')) {
            const id = target.dataset.id;
            deleteProduct(id);
        }
    });

    fetchProducts();
});
