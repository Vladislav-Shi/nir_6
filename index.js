const express = require('express'); // Подключаем express
const app = express();
const server = require('http').Server(app);
let port = 3000;
const io = require('socket.io')(server);
let userOnline = new Map(); // ассоциативный массив пользователей стостоящий из id_user : id_socket
console.log("Script Start! \n" + __dirname + '/www');
server.listen(port);
app.use(express.static(__dirname + '/www')); // Отправляет "статические" файлы из папки public при коннекте // __dirname - путь по которому лежит index.js
const mysql = require("mysql2");
const SocketIOFile = require('socket.io-file');

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
    var uploader = new SocketIOFile(socket, {
        uploadDir: {			// multiple directories
            image: 'www/include/image', // сюда картинки все
            other: 'www/include/other' // все остальное сюда
        },
        maxFileSize: 4194304, 						// 4 MB. default is undefined(no limit)
        chunkSize: 10240,							// default is 10240(1KB)
        transmissionDelay: 0,						// delay of each transmission, higher value saves more cpu resources, lower upload speed. default is 0(no delay)
        overwrite: true, 							// overwrite file if exists, default is true.
        rename: function (filename, fileInfo) {
            return fileInfo.data.name
        }
    });
    // логирование событий загрузки файла
    uploader.on('start', (fileInfo) => {
        console.log('Start uploading');
        console.log(fileInfo);

    });
    uploader.on('stream', (fileInfo) => {
        console.log(`${fileInfo.wrote} / ${fileInfo.size} byte(s)`);
    });
    // если загрузился только тогда вызывать метод с картинками
    uploader.on('complete', (fileInfo) => {
        console.log('Upload Complete.');
        console.log(fileInfo);
    });
    uploader.on('error', (err) => {
        console.log('Error!', err);
    });
    uploader.on('abort', (fileInfo) => {
        console.log('Aborted: ', fileInfo);
    });


    console.log(socket["id"]);// id сокета
    console.log('A user connected');
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
                io.sockets.emit("history_mess", results, user_id, chat_id); // отправляем историю чата
                // возвращаем еще  result[0][id] для избежания повторной загрузки истории сообщений
            });
    });
    // помечает сообщения для пользователя прочитанными
    socket.on("read_messages", (chat_id, user_id) => {
        connection.query("CALL read_message(" + user_id + ", " + chat_id + ")",
            (err, result) => {
                if (err) {
                    console.log("Ошибка процедуры");
                    console.log(err);
                }
            });
        console.log("CALL read_message(" + user_id + ", " + chat_id + ")")
    })

    socket.on("send_mess", function (message, chat_id, user_id, file, uploadDir) {
        var date = new Date().toISOString().slice(0, 19).replace('T', ' ');
        connection.query("INSERT INTO message (id, chat_id, user_id, text, send_time, path_file) VALUES" +
            "(NULL, " + chat_id + ", " + user_id + ", '" + message + "', '" + date + "', '" + uploadDir + "/" + file + "')",
            (err, result) => {
                if (err) {
                    console.log("Ошибка внесения в таблицу");
                    console.log(err);
                }
                else {
                    // Отправлять события только при положительном исходе
                    io.sockets.emit('messageToClients', message, chat_id, user_id, uploadDir + "/" + file); // Отправляем всем сокетам событие 'messageToClients' и отправляем туда же два аргумента (текст, имя юзера)
                    console.log("Получено сообщение в " + date);
                }
            })
        // процедура добавляет в таблицу запись о новом непрочитанном сообщении в чате
        connection.query("CALL new_message(" + user_id + ", " + chat_id + ")",
            (err, result) => {
                if (err) {
                    console.log("Ошибка процедуры");
                    console.log(err);
                }
            });
    });
});