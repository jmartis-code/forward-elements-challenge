'use server';

export async function addToCart(productId: string) {
  const product = await global.ProductStore.getById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  await global.CartStore.create({
    id: product.id,
    name: product.title,
    price: product.price,
    quantity: 1,
  });
}
