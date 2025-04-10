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

export async function clearCart() {
  try {
    // Get all cart items
    const cartItems = await global.CartStore.list({ limit: 100 });
    
    // Delete each item individually using the Store's API
    for (const item of cartItems.data) {
      await global.CartStore.delete(item.id);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error clearing cart:', error);
    return { success: false, error };
  }
}
