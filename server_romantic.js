const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PING_INTERVAL = 5000; // 5 секунд

// Хранилище активных подключений
const clients = new Set();

// Создание HTTP сервера
const server = http.createServer((req, res) => {
    // Главная страница
    if (req.url === '/' || req.url === '/index.html') {
        fs.readFile(path.join(__dirname, '8march_romantic.html'), (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Ошибка загрузки страницы');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
        });
    }
    // Server-Sent Events для пингов
    else if (req.url === '/ping') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });

        // Добавляем клиента
        clients.add(res);
        console.log(`💝 Новое подключение! Активных соединений: ${clients.size}`);

        // Первый пинг сразу
        const timestamp = new Date().toLocaleString('ru-RU');
        res.write(`data: ${JSON.stringify({ 
            message: '💖 Сервер активен', 
            time: timestamp,
            clientCount: clients.size,
            uptime: Math.floor(process.uptime())
        })}\n\n`);

        // Обработка отключения
        req.on('close', () => {
            clients.delete(res);
            console.log(`💔 Клиент отключился. Осталось: ${clients.size}`);
        });
    }
    // Статистика
    else if (req.url === '/stats') {
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({
            activeClients: clients.size,
            serverUptime: Math.floor(process.uptime()),
            timestamp: new Date().toISOString()
        }));
    }
    // 404
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Страница не найдена');
    }
});

// Функция отправки пингов всем клиентам
function sendPingToAll() {
    const timestamp = new Date().toLocaleString('ru-RU');
    const pingData = JSON.stringify({ 
        message: '💕 Пинг от сервера любви', 
        time: timestamp,
        clientCount: clients.size,
        uptime: Math.floor(process.uptime())
    });

    let sent = 0;
    clients.forEach(client => {
        try {
            client.write(`data: ${pingData}\n\n`);
            sent++;
        } catch (error) {
            clients.delete(client);
        }
    });

    if (sent > 0) {
        console.log(`💌 Пинг отправлен ${sent} клиентам [${timestamp}]`);
    }
}

// Запуск интервала пингования
setInterval(sendPingToAll, PING_INTERVAL);

// Запуск сервера
server.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║                                                ║');
    console.log('║        🌹 СЕРВЕР ПОДАРКОВ НА 8 МАРТА 🌹       ║');
    console.log('║                                                ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    console.log(`💝 Сервер запущен: \x1b[36mhttp://localhost:${PORT}\x1b[0m`);
    console.log(`⏰ Интервал пинга: \x1b[33m${PING_INTERVAL / 1000} секунд\x1b[0m`);
    console.log('\n📡 Доступные эндпоинты:');
    console.log(`   → \x1b[32mhttp://localhost:${PORT}/\x1b[0m - главная страница`);
    console.log(`   → \x1b[32mhttp://localhost:${PORT}/ping\x1b[0m - SSE пинги`);
    console.log(`   → \x1b[32mhttp://localhost:${PORT}/stats\x1b[0m - статистика`);
    console.log('\n✨ Нажми \x1b[31mCtrl+C\x1b[0m для остановки сервера\n');
    console.log('════════════════════════════════════════════════\n');
});

// Обработка завершения работы
process.on('SIGINT', () => {
    console.log('\n\n💔 Остановка сервера...\n');
    
    clients.forEach(client => {
        try {
            client.end();
        } catch (error) {
            // Игнорируем ошибки
        }
    });
    
    server.close(() => {
        console.log('👋 Сервер остановлен. С 8 Марта!\n');
        process.exit(0);
    });
});

// Обработка ошибок
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Порт ${PORT} уже занят. Попробуйте другой порт.\n`);
    } else {
        console.error('\n❌ Ошибка сервера:', error, '\n');
    }
    process.exit(1);
});
