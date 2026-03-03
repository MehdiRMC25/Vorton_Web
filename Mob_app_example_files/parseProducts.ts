// Parser for product data input
// Paste your product data in product-input.txt and run this to update products.ts

export interface ProductInput {
  name: string;
  category: "men" | "women" | "unisex";
  color: string;
  fabric: string;
  price: number;
  image?: string;
  imageType?: "local" | "remote";
}

/**
 * Parse product data from text input
 * Format: Name | Category | Color | Fabric | Price | Image
 */
export function parseProductText(input: string): ProductInput[] {
  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.length > 0);

  const products: ProductInput[] = [];
  let idCounter = 1;

  for (const line of lines) {
    const parts = line.split("|").map((part) => part.trim());

    if (parts.length < 5) {
      console.warn(`Skipping invalid line: ${line}`);
      continue;
    }

    const [name, category, color, fabric, priceStr, image] = parts;

    // Validate category
    const validCategory = category.toLowerCase();
    if (!["men", "women", "unisex"].includes(validCategory)) {
      console.warn(`Invalid category "${category}" in line: ${line}`);
      continue;
    }

    // Parse price
    const price = parseFloat(priceStr);
    if (isNaN(price)) {
      console.warn(`Invalid price "${priceStr}" in line: ${line}`);
      continue;
    }

    // Determine image type
    let imageType: "local" | "remote" | undefined;
    if (image) {
      imageType = image.startsWith("http://") || image.startsWith("https://") 
        ? "remote" 
        : "local";
    }

    products.push({
      id: idCounter++,
      name,
      category: validCategory as "men" | "women" | "unisex",
      color,
      fabric,
      price,
      image: image || undefined,
      imageType,
    });
  }

  return products;
}

/**
 * Generate TypeScript code for products array
 */
export function generateProductsCode(products: ProductInput[]): string {
  const productStrings = products.map((p) => {
    const imagePart = p.image 
      ? `image: "${p.image}", imageType: "${p.imageType || "local"}",` 
      : "";
    return `  { id: ${p.id}, name: "${p.name}", category: "${p.category}", color: "${p.color}", fabric: "${p.fabric}", price: ${p.price}${imagePart ? `, ${imagePart}` : ""} },`;
  });

  return `export const products: Product[] = [
${productStrings.join("\n")}
];`;
}
