export async function onRequestPost(context) {
    const db = context.env.DB;
    const data = await context.request.json();
    const { phone, tariff } = data;

    if (!phone || !tariff) {
        return new Response(JSON.stringify({ error: "Нет данных" }), { status: 400 });
    }

    const userStr = await db.get(phone);
    if (!userStr) {
        return new Response(JSON.stringify({ error: "Пользователь не найден" }), { status: 404 });
    }

    let user = JSON.parse(userStr);
    
    // Обновляем статистику
    user.totalOrders += 1;
    user.stamps += 1;
    user.lastOrder = tariff;

    // Логика 5-й бесплатной печати
    if (user.stamps > 5) {
        user.stamps = 1; // Сброс после бесплатного
    }

    // Сохраняем обратно в БД
    await db.put(phone, JSON.stringify(user));

    delete user.password;
    return new Response(JSON.stringify({ success: true, user }), { status: 200 });
}
