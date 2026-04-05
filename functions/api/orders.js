export async function onRequest(context) {
    const db = context.env.DB; 
    const request = context.request;

    // НОВЫЙ ЗАКАЗ (POST)
    if (request.method === "POST") {
        const orderData = await request.json();
        const orderId = 'ORD-' + Date.now();
        orderData.id = orderId;
        orderData.timestamp = Date.now();
        
        await db.put('order_' + orderId, JSON.stringify(orderData));

        // Начисляем печать пользователю
        const userStr = await db.get('user_' + orderData.phone);
        if(userStr) {
            let user = JSON.parse(userStr);
            user.stamps += 1;
            user.totalOrders += 1;
            if(user.stamps > 5) user.stamps = 1;
            await db.put('user_' + orderData.phone, JSON.stringify(user));
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // ПОЛУЧИТЬ ЗАКАЗЫ (GET)
    if (request.method === "GET") {
        const url = new URL(request.url);
        
        // Для админки (выводим все активные)
        if (url.searchParams.get('admin') === 'true') {
            const list = await db.list({ prefix: 'order_' });
            const orders = [];
            for (let key of list.keys) {
                const dataStr = await db.get(key.name);
                const order = JSON.parse(dataStr);
                if (order.status !== 'done') orders.push(order); // Скрываем завершенные
            }
            orders.sort((a, b) => b.timestamp - a.timestamp);
            return new Response(JSON.stringify(orders), { status: 200 });
        }

        // Для клиента (выводим его последний заказ)
        const phone = url.searchParams.get('phone');
        if (phone) {
            const list = await db.list({ prefix: 'order_' });
            let lastOrder = null;
            for (let key of list.keys) {
                const dataStr = await db.get(key.name);
                const order = JSON.parse(dataStr);
                if (order.phone === phone && order.status !== 'done') {
                    if(!lastOrder || order.timestamp > lastOrder.timestamp) lastOrder = order;
                }
            }
            return new Response(JSON.stringify(lastOrder || {}), { status: 200 });
        }
    }

    // СМЕНА СТАТУСА АДМИНОМ (PATCH)
    if (request.method === "PATCH") {
        const { id, status } = await request.json();
        const orderStr = await db.get('order_' + id);
        if (orderStr) {
            let order = JSON.parse(orderStr);
            order.status = status;
            await db.put('order_' + id, JSON.stringify(order));
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
    }

    return new Response("Method not allowed", { status: 405 });
}
