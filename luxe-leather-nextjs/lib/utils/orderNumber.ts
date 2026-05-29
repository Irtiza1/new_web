export function createOrderNumber(date = new Date(), id = crypto.randomUUID()): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const shortId = id.replace(/-/g, '').slice(-6).toUpperCase();

    return `LLC-${year}${month}-${shortId}`;
}

export function displayOrderNumber(order: { order_number?: string | null; id: string; createdAt?: string; created_at?: string }): string {
    if (order.order_number) return order.order_number;

    const rawDate = order.createdAt ?? order.created_at;
    const date = rawDate ? new Date(rawDate) : new Date();
    return createOrderNumber(date, order.id);
}
