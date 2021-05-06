// функция добавляет базовое сообщение (без иконок) isYour логическое сравнение на принадлежность пользователю сообщения
function basicMessage(messText, messDate, isYour) {
    if (isYour) {
        $("#chat-area").append('<div class="mes_box right"> <div class="mess_text">' +
            '<p class="yuor_mes">' + messText + '</p> <div class="mess_time">' + messDate + '</div></div></div>');
    }
    else {
        $("#chat-area").append('<div class="mes_box"><div class="mess_text">' +
            '<p class="oponent_mes">' + messText + '</p> <div class="mess_time">' + messDate + '</div></div></div>');
    }
}

// Обычное сообщение для группового чата с рисуемой иконкой у сообщения
function iconMessage(messText, messDate, img, isYour) {
    if (isYour) {
        $("#chat-area").append('<div class="mes_box right"><div class="mess_text">' +
            '<p class="yuor_mes">' + messText + '</p> <div class="mess_time">' + messDate + '</div></div></div>');
    }
    else {
        if (img == null) {
            scrChat = "include/cat_img.jpg";
        }
        else {
            scrChat = "include/" + img;
        }
        $("#chat-area").append(
            '<div class="mes_box"><img class="card-image" src="'+scrChat+'" alt="" />'+
            '<div class="border "></div><div class="mess_text">'+
            '<p class="oponent_mes">' + messText + '</p><div class="mess_time">' + messDate + '</div></div>'
        );
    }
}