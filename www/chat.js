let port;
let socket;
var uploader;
let username;
let userId = -1;
let chatId = -1; // хранит текущий чат
let resultSave; // будет хранить список чатов чтобы не делать запрос


// настрйока чата
function chatConfig(newUsername, newPort) {
    createHtml();
    port = newPort; // Указываем порт на котором у на стоит сокет
    socket = io.connect('http://localhost:' + port, { // доп. загаловки для разрешения получения инфы от сторонних сероверов.
        extraHeaders: {
            Headers: "Access-Control-Allow-Origin: *",
            Authorization: "Bearer authorization_token_here"
        }
    });
    // Тут мы объявляем "socket" (дальше мы будем с ним работать) и подключаемся сразу к серверу через порт
    uploader = new SocketIOFileClient(socket); // для отправки файлов
    socket.emit("user", username);

    // логирование событий загрузки файла
    uploader.on('start', function (fileInfo) {
        console.log('Start uploading', fileInfo);
    });
    uploader.on('stream', function (fileInfo) {
        console.log('Streaming... sent ' + fileInfo.sent + ' bytes.');
    });
    // Если есть файл, то будет выполнятся код только по завершению его загрузки
    uploader.on('complete', function (fileInfo) {
        console.log('Upload Complete', fileInfo);
        socket.emit('send_mess', fileInfo.data.mess, fileInfo.data.chatId, fileInfo.data.userId, fileInfo.data.name, fileInfo.data.uploadDir);
        $("textarea").val("");
        $("#progressbar").html('');
        document.getElementById("input__file").value = null;
        console.log("send_mess");
    });
    uploader.on('error', function (err) {
        console.log('Error!', err);
    });
    uploader.on('abort', function (fileInfo) {
        console.log('Aborted: ', fileInfo);
    });

    // Станус онлайна чата 1 на 1
    socket.on("online_request", (status) => {
        $(".card_status").empty()
        if (status) {
            $(".card_status").append("онлайн")
        }
        else {
            $(".card_status").append("не в сети")
        }
    })

    // пусть тут будет обработка массива, чтобы не нагружать сервер
    socket.on("online_request_group_chat",
        (sqlResult, userOnline) => {
            $(".card_status").empty();
            let chatSize = sqlResult.length // кол-во пользователей
            let chatOnline = 0;
            sqlResult.forEach(element => {
                if (userOnline.includes(element["user_id"])) {
                    chatOnline++;
                }
            })
            $(".card_status").append(chatSize + " людей, " + chatOnline + " онлайн")
        })

    // получение id пользователя 
    socket.on("user_id", (id) => {
        if (userId == -1)
            userId = id; // получаем id текущего пользоваетля
    });

    // обработка события подключения пользоваетля 
    // рисуем список чатов 
    socket.on("chat_list", (result, userId2) => {
        let numChat = 0; // кол-во чатов для 
        let scrChat; // картинка для чата
        // цикл, в котором получаем спосик чатов 
        if (userId2 == userId) {
            resultSave = result;
            $(".chat-list").empty(); // очистка поля чатоу 
            let newMessIcon;
            result.forEach(element => {
                // рисуем с кол-вом новых сообщений
                if (element["new_mess"] > 0) {
                    if (element["new_mess"] > 99) {
                        newMessIcon = '<div class="message_status" id="mes_' + element["chat_id"] + '">+' + 99 + '</div>';
                    }
                    else {
                        newMessIcon = '<div class="message_status" id="mes_' + element["chat_id"] + '">+' + element["new_mess"] + '</div>';
                    }
                }
                else {
                    newMessIcon = '<div class="message_status" id="mes_' + element["chat_id"] + '" style="display: none;"></div>';
                }
                if (element["is_personal"] == 0) {
                    if (element["path_img"] == null) {
                        scrChat = "include/cat_img.jpg";
                    }
                    else {
                        scrChat = "include/" + element["path_img"];
                    }
                    $(".chat-list").append(newMessIcon + '<div class="border" id="chat_' + element["chat_id"] + '" '
                        + 'onClick="click_div(this.id)" data-tooltip="' + element["chat_name"] + '"></div>' +
                        '<img class="card-image" src="' + scrChat + '" alt="" />');
                }
                else {
                    if (element["user_img"] == null) {
                        scrChat = "include/cat_img.jpg";
                    }
                    else {
                        scrChat = "include/" + element["user_img"];
                    }
                    $(".chat-list").append(newMessIcon + '<div class="border" id="chat_' + element["chat_id"] + '" ' +
                        'onClick="click_div(this.id)" data-tooltip="' + element["name"] + '"></div>' +
                        '<img class="card-image" src="' + scrChat + '" alt=""/>');
                }
                numChat++;
            });
        }
    })

    socket.on("messageToClients", function (mess, chatIdArg, id, path_file) {
        if (chatIdArg == chatId) {
            let date = new Date().toISOString().slice(0, 19).replace('T', ' ');
            let isPersonal;
            let pathImg;
            let userMessageName
            resultSave.forEach(element => {
                if (element["chat_id"] == chatIdArg) {
                    isPersonal = element["is_personal"];
                }
                if (element["chat_id"] == id) {
                    pathImg = element["user_img"];
                }
                userMessageName = element['name']
            })
            if (isPersonal == 0) {
                iconMessage(mess, date.substr(11, 5), pathImg, userMessageName, id == userId, path_file)
            }
            else {
                basicMessage(mess, date.substr(11, 5), id == userId, path_file); // рисует сообщения для просто чата 
            }

        }
        // тогда добавляем значек о новом сообщении
        else {
            $("#mes_" + chatIdArg).show();
            let newMess = $("#mes_" + chatIdArg).text();
            if (newMess == "") {
                $("#mes_" + chatIdArg).text("+1");
            }
            else {
                $("#mes_" + chatIdArg).text("+" + (Number(newMess.slice(1)) + 1));
            }
        }
    });

    // Загрузка истории чата
    socket.on("history_mess", (result, id, chatIdArg) => {
        if (id == userId) // если id пользователя запросившего историю совпадает, то загружаем ее
        {
            $("#chat-area").empty(); // очищает тэг
            result.forEach(element => {
                let dates = element['send_time'].substr(11, 5);
                if (result[0]["is_personal"] == 0) {
                    iconMessage(element['text'], dates, element["user_img"], element['name'], element["user_id"] == userId, element["path_file"])
                }
                else {
                    basicMessage(element['text'], dates, element["user_id"] == userId, element["path_file"]);
                }

            });
            let div = document.getElementById('chat-area'); // id div'a
            $('#chat-area').scrollTop(div.scrollHeight - div.offsetHeight + 1);
            // так как переходит в чат и перемещается вниз, то прочитаны все сообщения пусть будут
            $("#mes_" + chatIdArg).hide();
            $("#mes_" + chatIdArg).text("");
            socket.emit("read_messages", chatIdArg, id);
        }
    });

    socket.on("user_error", () => {
        if (user_id == -1) {
            console.log("Неверный ник");
            $("#chat-area").append('<h4>Требуется авторизация!</h4>');
        }
    });
}

// при загрузке документа вызывается это
$(document).on('change', '#input__file', function () {
    console.log("test2");
    var filename = $(this).val().replace(/.*\\/, "");
    $("#progressbar").html(filename);
});

// обрабатывает нажатие на кнопку отправки сообщения
$(document).on('click', '#mes_btn', function () {
    let fileName = null;
    let uploadDir = null;
    let mess = $("#mes_area").val();
    var fileEl = document.getElementById('input__file')
    if (fileEl.value) {
        let typeFile = fileEl.value.split('.'); // последний элемент массива будет содержать расшмрение
        fileName = "" + chatId + "_" + userId + "_" + new Date().toISOString().slice(0, 19).replace('T', '_')
            + "." + typeFile[typeFile.length - 1]; // заадется имя файла
        console.log('fileEl:', fileEl)
        if (typeFile[typeFile.length - 1].includes('png') || typeFile[typeFile.length - 1].includes('jpg')) {
            uploadDir = "image";
        }
        else {
            uploadDir = "other";
        }

        var uploadIds = uploader.upload(fileEl, {
            uploadTo: uploadDir,
            // дополнительные данные, нужны чтобы задать хаарктиристики файлу и что то передать обработчикам загрузки
            data: {
                name: fileName,
                mess: mess,
                chatId: chatId,
                userId: userId,
                uploadDir: uploadDir
            }
        });
    }
    // выполнять только если пользователь не отправлял файл и если сообщение не пустое
    if ($("#mes_area").val().trim() != "" && fileEl.value == "") {
        socket.emit('send_mess', mess, chatId, userId, fileName, uploadDir);
        $("textarea").val("");
        $("#progressbar").html('');
    }
})

// Функция обработки нажатия на иконку чата
function click_div(id) {
    // рисуем "шапку" диалога
    chatId = id.substr(5);
    $(".card").empty()
    console.log("id chat: " + id.substr(5));
    resultSave.forEach(element => {
        if (element["chat_id"] == id.substr(5)) {
            if (element["is_personal"] == 0) {
                if (element["path_img"] == null) {
                    scrChat = "include/cat_img.jpg";
                }
                else {
                    scrChat = "include/" + element["path_img"];
                }
                // Запрос кол-ва человек в чате и кол-во людей онлайн
                socket.emit("online_status_group_chat", element["chat_id"], socket["id"]);
                $(".card").append('<div class="border"></div>' +
                    '<img class="card-image" src="' + scrChat + '" alt="" />' +
                    '<div><h3>' + element["chat_name"] + '<h3><p class="card_status"></p></div>');
            }
            else {
                if (element["user_img"] == null) {
                    scrChat = "include/cat_img.jpg";
                }
                else {
                    scrChat = "include/" + element["user_img"];
                }
                // получение статуса онлайна человека, отправляем id человека с которым чат, и id своего сокета, чтобы отправили инфу только тебе
                socket.emit("online_status", element['user_id'], socket["id"]);
                $(".card").append('<div class="border"></div>' +
                    '<img class="card-image" src="' + scrChat + '" alt="" />' +
                    '<div><h3>' + element["name"] + '<h3><p class="card_status"></p></div>');
            }
        }
    })
    // запрос истории данного чата
    socket.emit("history_chat", id.substr(5), userId);

}


// создает на странице поле чата
function createHtml() {
    $(document).ready(function () {
        $("body").html('<div class="fixed-chat"><div class="chat-list"></div>' +
            '<div style="flex: max-content;"> <div><div class="card"><img class="card-image" src="include/cat_img.jpg" alt="" onClick="click_div()" />' +
            '<div class="border"></div><div><h3></h3><p class=""></p>' +
            '</div></div></div><div class="chat-area"><div class=" msg_container_base" id="chat-area">' +
            '</div></div><div class="progressbar" id="progressbar"></div><div class="text-area">' +
            '<textarea name="mes_area" id="mes_area" cols="33" rows="2" placeholder="Введите сообщение"></textarea>' +
            '<div><label for="input__file" class="file_btn">Файл</label><input class="" type="file" name="file" id="input__file">' +
            '<button class="send_button" id="mes_btn">Отправить</button></div></div></div></div>')
    })
}

// функция добавляет базовое сообщение (без иконок) isYour логическое сравнение на принадлежность пользователю сообщения
function basicMessage(messText, messDate, isYour, path_file) {
    if (isYour) {
        $("#chat-area").append('<div class="mes_box right"> <div class="yuor_mes">' +
            '<p>' + messText + '</p>' + messageFile(path_file) + ' <div class="mess_time">' + messDate + '</div></div></div>');
    }
    else {
        $("#chat-area").append('<div class="mes_box"><div class="oponent_mes">' +
            '<p>' + messText + '</p>' + messageFile(path_file) + ' <div class="mess_time">' + messDate + '</div></div></div>');
    }
}

// Обычное сообщение для группового чата с рисуемой иконкой у сообщения
function iconMessage(messText, messDate, img, userMessageName, isYour, path_file) {
    if (isYour) {
        $("#chat-area").append('<div class="mes_box right"><div class="yuor_mes">' +
            '<p>' + messText + '</p> ' + messageFile(path_file) + '<div class="mess_time">' + messDate + '</div></div></div>');
    }
    else {
        if (img == null) {
            scrChat = "include/cat_img.jpg";
        }
        else {
            scrChat = "include/" + img;
        }
        $("#chat-area").append(
            '<div class="mes_box"><img class="card-image" src="' + scrChat + '" alt="" />' +
            '<div class="border" data-tooltip="' + userMessageName + '"></div><div class="oponent_mes">' +
            '<p>' + messText + '</p>' + messageFile(path_file) + '<div class="mess_time">' + messDate + '</div></div>'
        );
    }
}

// функция возвращает картинку если путь содержит image и ссылку на файл если other
function messageFile(path) {
    if (path == null)
        return '';
    let parsedPath = path.split('/');
    if (parsedPath[0] == 'image') {
        return '<img class="mess_img" src="include/' + path + '">'
    }
    if (typeof parsedPath != "null" && parsedPath[0] == 'other') {
        return '<div class="border"></div><img class="card-image" src="include/doc.png" alt="" />' +
            '<a download href="include/' + path + '">' + parsedPath[1] + '</a>'
    }
    return "";
}