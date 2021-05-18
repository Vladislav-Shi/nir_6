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
function iconMessage(messText, messDate, img, isYour, path_file) {
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
            '<div class="border "></div><div class="oponent_mes">' +
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
        return '<img class="card-image" src="include/document_1jpg" alt="" /><div class="border">' +
            '<a>' + parsedPath[2] + '</a>'
    }
    return "";
}
// показываем толькоп ри полной загрузке 
