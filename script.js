const beep = new Audio("beep.ogg");  // make sure beep.oggis in the same folder

function startScanner() {
  const scannerElement = document.getElementById("scanner");
  scannerElement.style.display = "block";

  Quagga.offDetected(); // Remove previous listeners

  Quagga.init({
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target: document.querySelector("#scanner-preview"),
      constraints: {
        width: { min: 640 },
        height: { min: 480 },
        facingMode: "environment"
      }
    },
    locator: {
      patchSize: "medium",
      halfSample: true
    },
    decoder: {
      readers: [
        "ean_reader",
        "ean_8_reader",
        "upc_reader",
        "upc_e_reader",
        "code_128_reader"
      ]
    },
    locate: true,
    numOfWorkers: navigator.hardwareConcurrency || 4
  }, function(err) {
    if (err) {
      console.error("❌ Quagga init failed:", err);
      alert("Camera initialization failed. Please allow access or check device permissions.");
      return;
    }

    Quagga.start();
    console.log("✅ Quagga started");
  });

  Quagga.onDetected(function(result) {
    const code = result.codeResult.code;
    console.log("✅ Barcode Detected:", code);

    beep.play(); // Play sound

    document.body.classList.add("flash");
    setTimeout(() => document.body.classList.remove("flash"), 200);

    Quagga.stop();
    scannerElement.style.display = "none";

    document.getElementById("barcode").value = code;
    getProduct(); // auto fetch
  });

  setTimeout(() => {
    if (Quagga.running) {
      Quagga.stop();
      scannerElement.style.display = "none";
      alert("⏰ No barcode detected. Try again.");
    }
  }, 15000);
}

async function getProduct() {
  const barcode = document.getElementById("barcode").value.trim();
  const resultDiv = document.getElementById("result");

  if (!barcode) {
    alert("Please enter a barcode");
    return;
  }

  resultDiv.innerHTML = "<p>🔍 Fetching product details...</p>";

  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();

    if (data.status === 1) {
      const product = data.product;
      resultDiv.innerHTML = `
        <h2>${product.product_name || "No product name available"}</h2>
        <p><strong>Brand:</strong> ${product.brands || "Unknown"}</p>
        <p><strong>Quantity:</strong> ${product.quantity || "N/A"}</p>
        <p><strong>Categories:</strong> ${product.categories || "N/A"}</p>
        <p><strong>Ingredients:</strong> ${product.ingredients_text || "N/A"}</p>
        <img src="${product.image_url || ""}" alt="Product Image" width="200" />
      `;
    } else {
      resultDiv.innerHTML = "<p>❌ Product not found. Try a different barcode.</p>";
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    resultDiv.innerHTML = "<p>⚠️ Error fetching product data.</p>";
  }
}
