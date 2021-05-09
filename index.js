var express = require('express'); // Подключаем express
var app = express();
var server = require('http').Server(app);
var port = 3000;
var io = require('socket.io')(server);
var userOnline = new Map(); // ассоциативный массив пользователей стостоящий из id_user : id_socket
console.log("Script Start! \n" + __dirname + '/www');
server.listen(port);
app.use(express.static(__dirname + '/www')); // Отправляет "статические" файлы из папки public при коннекте // __dirname - путь по которому лежит index.js
// подключение к bd
const mysql = require("mysql2");
const multer = require("multer");

const connection = mysql.createConnection({
    host: "localhost",
    user: "admin",
    port: 3306,
    database: "nir6",
    password: "admin"
});
connection.connect(function (err) {
    if (err) {
        return console.error("Ошибка: " + err.message);
    }
    else {
        console.log("Подключение к серверу MySQL успешно установлено");
    }
});

// обработка событий 
io.on('connection', function (socket) {
    console.log(socket["id"]);// id сокета
    console.log('A user connected');
    // let lastSocketId; // последний id сокета для записи онлайна
    // for (let entry of io.sockets.sockets) {
    //     console.log("element")
    //     console.log(entry[0]);
    //     lastSocketId = entry[0];
    // }
    console.log("Кол-во пользователей: " + io.sockets.sockets.size);
    socket.on("user", (username) => // событие подключения пользователя
    {
        let userId; // сохраняем id пользователя чтобы не отправлять чаты по два раза
        connection.query("SELECT id FROM user WHERE name=\"" + username + "\"",
            (err, result) => {
                if (err) {
                    console.log(err);
                }
                if (result != 0) {
                    // console.log(result);
                    userId = result[0]["id"];
                    userOnline.set(userId, socket["id"]);
                    io.sockets.emit("user_id", result[0]["id"]);
                    console.log("Список онлайн:")
                    console.log(userOnline)

                }
            }
        )
        connection.query(
            " SELECT user_chat.*, user.name, chat.chat_name, chat.is_personal, path_img, user_img " +
            " FROM user_chat LEFT JOIN user ON user.id=user_chat.user_id " +
            " LEFT JOIN chat ON user_chat.chat_id=chat.id " +
            " WHERE name=\"" + username + "\" AND is_personal=0 " +
            " UNION" +
            " SELECT user_chat.*, user.name, chat.chat_name, chat.is_personal, path_img, user_img " +
            " FROM user_chat LEFT JOIN user ON user.id=user_chat.user_id " +
            " LEFT JOIN chat ON user_chat.chat_id=chat.id " +
            " WHERE is_personal=1 AND name !=\"" + username + "\" AND chat_id IN " +
            " (SELECT chat_id FROM `user_chat` LEFT JOIN user ON user.id=user_chat.user_id WHERE name=\"" + username + "\")",
            (err, result) => {
                if (err) {
                    console.log(err);
                }
                if (result != 0) {
                    // console.log("\nСписок чатов\n");
                    // console.log(result);
                    io.sockets.emit("chat_list", result, userId);
                }
                else {
                    io.sockets.emit("user_error"); // отправляет сообщение о том, что пользователь не найден
                }
            })
    });
    //Whenever someone disconnects this piece of code executed
    socket.on('disconnect', function () {
        console.log('A user disconnected');
        console.log(socket["id"])
        let userKey = ([...userOnline].find(([, v]) => v === socket["id"]) || [])[0];
        userOnline.delete(userKey);
        console.log("Список онлайн:")
        console.log(userOnline)
    });
    //запрос онлайна пользователя персональный чат
    socket.on("online_status", (userId, socketId) => {
        // has возвращает true если элемент есть онлайн
        io.to(socketId).emit('online_request', userOnline.has(userId));
    });
    //запрос кол-ва человек в чате и онлайна чата
    socket.on("online_status_group_chat", (chatId, socketId) => {
        connection.query("SELECT user_id FROM user_chat WHERE chat_id=\"" + chatId + "\"",
            (err, result) => {
                if (err) {
                    console.log(err);
                }
                // меньше нагрузить сервер и кинуть просто весь массив клиенту, а там пусть обрабатывает
                // нужно перевести map в массив ибо сокет что то его не отправляет
                io.to(socketId).emit('online_request_group_chat', result, Array.from(userOnline.keys()));
            })
    })

    // запрос истории данного чата
    socket.on("history_chat", (chat_id, user_id) => {
        connection.query("SELECT message.*, user.name, user.user_img, chat.is_personal FROM message " +
            " LEFT JOIN chat ON message.chat_id=chat.id " +
            "LEFT JOIN user ON message.user_id=user.id WHERE chat_id=\"" + chat_id + "\" ORDER BY message.send_time",
            (err, results) => {
                if (err) {
                    console.log(err);
                }
                io.sockets.emit("history_mess", results, user_id); // отправляем историю чата
                // возвращаем еще  result[0][id] для избежания повторной загрузки истории сообщений
            });
    });

    socket.on("send_mess", function (message, chat_id, user_id) {
        var date = new Date().toISOString().slice(0, 19).replace('T', ' ');
        connection.query("INSERT INTO message (id, chat_id, user_id, text, send_time) VALUES (NULL, " + chat_id + ", " + user_id + ", '" + message + "', '" + date + "')",
            (err, result) => {
                if (err) {
                    console.log("Ошибка внесения в таблицу");
                    console.log(err);
                }
            })
        console.log("Получено сообщение в " + date);
        io.sockets.emit('messageToClients', message, chat_id, user_id); // Отправляем всем сокетам событие 'messageToClients' и отправляем туда же два аргумента (текст, имя юзера)
    });
});
// обработка файлов
app.post("/", function (req, res, next) {
    console.log("Обработка присланного файла");
    let filedata = req.file;
    console.log(filedata);
    if (!filedata)
        res.send("Ошибка при загрузке файла");
    else
        res.send("Файл загружен");
});
