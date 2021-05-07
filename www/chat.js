var port = 3000; // Указываем порт на котором у на стоит сокет
var socket = io.connect('http://localhost:' + port); // Тут мы объявляем "socket" (дальше мы будем с ним работать) и подключаемся сразу к серверу через порт
let username = prompt("Введите свое имя");
let userId = -1;
let chatId = -1; // хранит текущий чат
let resultSave; // будет хранить список чатов чтобы не делать запрос
socket.emit("user", username);
console.log(socket);
$(document).on('click', '#mes_btn', function () {
    console.log($("#mes_area").val());
    let mess = $("#mes_area").val();
    socket.emit('send_mess', mess, chatId, userId);
    $("textarea").val("");
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


socket.on("user_id", (id) => {
    if (userId == -1)
        userId = id; // получаем id текущего пользоваетля
});

// обработка события подключения пользоваетля 
socket.on("chat_list", (result, userId2) => {
    let numChat = 0; // кол-во чатов для 
    let scrChat; // картинка для чата
    // цикл, в котором получаем спосик чатов 
    if (userId2 == userId) {
        resultSave = result;
        result.forEach(element => {
            if (element["is_personal"] == 0) {
                if (element["path_img"] == null) {
                    scrChat = "include/cat_img.jpg";
                }
                else {
                    scrChat = "include/" + element["path_img"];
                }
                $(".chat-list").append('<div class="border" id="chat_' + element["chat_id"] + '"  onClick="click_div(this.id)"></div>' +
                    '<img class="card-image" src="' + scrChat + '" alt="" />');
            }
            else {
                if (element["user_img"] == null) {
                    scrChat = "include/cat_img.jpg";
                }
                else {
                    scrChat = "include/" + element["user_img"];
                }
                $(".chat-list").append('<div class="border" id="chat_' + element["chat_id"] + '"  onClick="click_div(this.id)"></div>' +
                    '<img class="card-image" src="' + scrChat + '" alt="" />');
            }
            numChat++;
        });
    }
})

socket.on("messageToClients", function (mess, chatIdArg, id) {
    if (chatIdArg == chatId) {
        console.log("Сообщение добавлено: " + mess);
        let date = new Date().toISOString().slice(0, 19).replace('T', ' ');
        let isPersonal;
        let pathImg;
        resultSave.forEach(element => {
            if (element["chat_id"] == chatIdArg) {
                isPersonal = element["is_personal"];
            }
            if (element["chat_id"] == id) {
                pathImg = element["user_img"];
            }
        })
        if (isPersonal == 0) {

            iconMessage(mess, date.substr(11, 5), pathImg, id == userId)

        }
        else {
            basicMessage(mess, date.substr(11, 5), id == userId); // рисует сообщения для просто чата 
        }

    }
});
socket.on("history_mess", (result, id) => {
    if (id == userId) // если id пользователя запросившего историю совпадает, то загружаем ее
    {
        $("#chat-area").empty(); // очищает тэг
        result.forEach(element => {
            let dates = element['send_time'].substr(11, 5);
            console.log(dates);
            if (result[0]["is_personal"] == 0) {
                iconMessage(element['text'], dates, element["user_img"], element["user_id"] == userId,)
            }
            else {
                basicMessage(element['text'], dates, element["user_id"] == userId);
            }

        });
    }
});
socket.on("user_error", () => {
    if (user_id == -1) {
        console.log("Неверный ник");
        $("#chat-area").append('<h4>Требуется авторизация!</h4>');
    }
});
