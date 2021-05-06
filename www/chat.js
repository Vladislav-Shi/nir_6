var port = 3000; // Указываем порт на котором у на стоит сокет
var socket = io.connect('http://localhost:' + port); // Тут мы объявляем "socket" (дальше мы будем с ним работать) и подключаемся сразу к серверу через порт
let username = prompt("Введите свое имя");
let user_id = -1;
let chat_id = -1; // хранит текущий чат
let resultSave; // будет хранить список чатов чтобы не делать запрос
socket.emit("user", username);
console.log(socket);
$(document).on('click', '#mes_btn', function () {
    console.log($("#mes_area").val());
    let mess = $("#mes_area").val();
    socket.emit('send_mess', mess, chat_id, user_id);
    $("textarea").val("");
})
// Функция обработки нажатия на иконку чата
function click_div(id) {
    // рисуем "шапку" диалога
    chat_id = id.substr(5);
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
                $(".card").append('<div class="border"></div>' +
                    '<img class="card-image" src="' + scrChat + '" alt="" />' +
                    '<div><h3>' + element["chat_name"] + '<h3></div>');
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
    socket.emit("history_chat", id.substr(5), user_id);
}
socket.on("online_request", (status) => {
    $(".card_status").empty()
    if(status)
    {
        $(".card_status").append("онлайн")
    }
    else{
        $(".card_status").append("не в сети")
    }
 
})
socket.on("user_id", (id) => {
    if (user_id == -1)
        user_id = id; // получаем id текущего пользоваетля
});

// обработка события подключения пользоваетля 
socket.on("chat_list", (result, userId) => {
    let numChat = 0; // кол-во чатов для 
    let scrChat; // картинка для чата
    // цикл, в котором получаем спосик чатов 
    if (userId == user_id) {
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

socket.on("messageToClients", function (mess, chatId, id) {
    if (chatId == chat_id) {
        console.log("Сообщение добавлено: " + mess);
        let date = new Date().toISOString().slice(0, 19).replace('T', ' ');
        let isPersonal;
        let pathImg;
        resultSave.forEach(element => {
            if (element["chat_id"] == chatId) {
                isPersonal = element["is_personal"];
            }
            if (element["chat_id"] == id) {
                pathImg = element["user_img"];
            }
        })
        if (isPersonal == 0) {

            iconMessage(mess, date.substr(11, 5), pathImg, id == user_id)

        }
        else {
            basicMessage(mess, date.substr(11, 5), id == user_id); // рисует сообщения для просто чата 
        }

    }
});
socket.on("history_mess", (result, id) => {
    if (id == user_id) // если id пользователя запросившего историю совпадает, то загружаем ее
    {
        $("#chat-area").empty(); // очищает тэг
        result.forEach(element => {
            let dates = element['send_time'].substr(11, 5);
            console.log(dates);
            if (result[0]["is_personal"] == 0) {
                iconMessage(element['text'], dates, element["user_img"], element["user_id"] == user_id,)
            }
            else {
                basicMessage(element['text'], dates, element["user_id"] == user_id);
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
