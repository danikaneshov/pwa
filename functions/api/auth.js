export async function onRequestPost(context) {
    const db = context.env.DB; 
    const data = await context.request.json();
    const { action, phone, password } = data;

    if (!phone || !password) return new Response(JSON.stringify({ error: "Пустые поля" }), { status: 400 });

    if (action === 'register') {
        const existing = await db.get('user_' + phone);
        if (existing) return new Response(JSON.stringify({ error: "Номер уже в клубе" }), { status: 400 });
        
        const newUser = { password, stamps: 0, totalOrders: 0 };
        await db.put('user_' + phone, JSON.stringify(newUser));
        return new Response(JSON.stringify({ success: true, user: { stamps: 0, totalOrders: 0 } }), { status: 200 });
    }

    if (action === 'login') {
        const userStr = await db.get('user_' + phone);
        if (!userStr) return new Response(JSON.stringify({ error: "Пользователь не найден" }), { status: 404 });
        
        const user = JSON.parse(userStr);
        if (user.password !== password) return new Response(JSON.stringify({ error: "Неверный пароль" }), { status: 401 });
        
        delete user.password;
        return new Response(JSON.stringify({ success: true, user }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: "Ошибка" }), { status: 400 });
}
