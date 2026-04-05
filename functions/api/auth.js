export async function onRequestPost(context) {
    // Получаем базу данных из окружения Cloudflare
    const db = context.env.DB; 
    const data = await context.request.json();
    const { action, phone, password } = data;

    if (!phone || !password) {
        return new Response(JSON.stringify({ error: "Пустые поля" }), { status: 400 });
    }

    // РЕГИСТРАЦИЯ
    if (action === 'register') {
        const existingUser = await db.get(phone);
        if (existingUser) {
            return new Response(JSON.stringify({ error: "Номер уже в клубе" }), { status: 400 });
        }
        
        // Создаем профиль (В реальном проекте пароль нужно хэшировать!)
        const newUser = { password, stamps: 0, totalOrders: 0, lastOrder: null };
        await db.put(phone, JSON.stringify(newUser));
        
        return new Response(JSON.stringify({ success: true, user: newUser }), { status: 200 });
    }

    // ВХОД
    if (action === 'login') {
        const userStr = await db.get(phone);
        if (!userStr) {
            return new Response(JSON.stringify({ error: "Пользователь не найден" }), { status: 404 });
        }
        
        const user = JSON.parse(userStr);
        if (user.password !== password) {
            return new Response(JSON.stringify({ error: "Неверный пароль" }), { status: 401 });
        }
        
        // Не отправляем пароль обратно на фронт из соображений безопасности
        delete user.password;
        return new Response(JSON.stringify({ success: true, user }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Неизвестное действие" }), { status: 400 });
}
