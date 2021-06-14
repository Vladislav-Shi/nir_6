-- phpMyAdmin SQL Dump
-- version 4.9.5deb2
-- https://www.phpmyadmin.net/
--
-- Хост: localhost:3306
-- Время создания: Июн 14 2021 г., 20:58
-- Версия сервера: 8.0.25-0ubuntu0.20.04.1
-- Версия PHP: 7.4.3

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `nir6`
--

DELIMITER $$
--
-- Процедуры
--
CREATE DEFINER=`admin`@`%` PROCEDURE `chat_list` (IN `username` VARCHAR(25))  NO SQL
BEGIN
SELECT user_chat.*, user.name, chat.chat_name, chat.is_personal, path_img, user_img
FROM user_chat LEFT JOIN user ON user.id=user_chat.user_id
LEFT JOIN chat ON user_chat.chat_id=chat.id
WHERE name= username AND is_personal=0
UNION
SELECT user_chat.*, user.name, chat.chat_name, chat.is_personal, path_img, user_img 
FROM user_chat LEFT JOIN user ON user.id=user_chat.user_id
LEFT JOIN chat ON user_chat.chat_id=chat.id
WHERE is_personal=1 AND name != username AND chat_id IN
(SELECT chat_id FROM `user_chat` LEFT JOIN user ON user.id=user_chat.user_id WHERE name= username);
END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `new_message` (IN `id_user` INT, IN `id_chat` INT)  NO SQL
BEGIN
DECLARE var tinyint(1);
SET var = (SELECT is_personal
FROM chat WHERE id=id_chat);
IF var=0 THEN
UPDATE user_chat
SET new_mess=new_mess+1
WHERE user_id != id_user AND
chat_id=id_chat;
ELSE
UPDATE user_chat
SET new_mess=new_mess+1
WHERE user_id = id_user AND
chat_id=id_chat;
END IF;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `read_message` (IN `id_user` INT, IN `id_chat` INT)  NO SQL
BEGIN
DECLARE var tinyint(1);
SET var = (SELECT is_personal
FROM chat WHERE id=id_chat);
IF var=0 THEN
UPDATE user_chat
SET new_mess=0
WHERE user_id = id_user AND
chat_id=id_chat;
ELSE
UPDATE user_chat
SET new_mess=0
WHERE user_id != id_user AND
chat_id=id_chat;
END IF;

END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Структура таблицы `chat`
--

CREATE TABLE `chat` (
  `id` int NOT NULL,
  `chat_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `is_personal` tinyint(1) NOT NULL DEFAULT '0',
  `path_img` varchar(40) DEFAULT NULL COMMENT 'отнолительный путь до картинки'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Дамп данных таблицы `chat`
--

INSERT INTO `chat` (`id`, `chat_name`, `is_personal`, `path_img`) VALUES
(1, 'Vladislave_admin', 1, NULL),
(3, 'group_chat_1', 0, 'dog_img2.jpg'),
(5, 'admin_user', 1, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `message`
--

CREATE TABLE `message` (
  `id` int NOT NULL,
  `chat_id` int NOT NULL,
  `user_id` int NOT NULL,
  `text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `path_file` varchar(70) DEFAULT NULL,
  `send_time` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Дамп данных таблицы `message`
--

INSERT INTO `message` (`id`, `chat_id`, `user_id`, `text`, `path_file`, `send_time`) VALUES
(150, 3, 3, '', 'null/3_3_2021-06-10_16:42:16.jpg', '2021-06-10 16:42:17'),
(151, 3, 2, '', 'image/3_2_2021-06-10_16:46:00.png', '2021-06-10 16:46:02'),
(152, 3, 2, 'sdfsdf', 'null/null', '2021-06-13 16:41:40'),
(153, 3, 2, 'var1', 'null/null', '2021-06-13 16:43:50'),
(154, 3, 2, 'f', 'image/3_2_2021-06-13_16:44:00.jpg', '2021-06-13 16:44:00'),
(155, 3, 2, '', 'image/3_2_2021-06-13_16:44:10.png', '2021-06-13 16:44:10');

-- --------------------------------------------------------

--
-- Структура таблицы `user`
--

CREATE TABLE `user` (
  `id` int NOT NULL,
  `name` varchar(25) NOT NULL,
  `user_img` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'путь до картинки пользователя'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Дамп данных таблицы `user`
--

INSERT INTO `user` (`id`, `name`, `user_img`) VALUES
(1, 'Vladislave', 'dog_img.jpg'),
(2, 'admin', NULL),
(3, 'iUser', NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `user_chat`
--

CREATE TABLE `user_chat` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `chat_id` int NOT NULL,
  `new_mess` int NOT NULL DEFAULT '0' COMMENT 'новые соощения для такого то пользователя'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Дамп данных таблицы `user_chat`
--

INSERT INTO `user_chat` (`id`, `user_id`, `chat_id`, `new_mess`) VALUES
(1, 2, 1, 0),
(2, 1, 1, 0),
(3, 2, 3, 0),
(4, 3, 3, 0),
(5, 1, 3, 6),
(6, 2, 5, 0),
(7, 3, 5, 0);

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `chat`
--
ALTER TABLE `chat`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `message`
--
ALTER TABLE `message`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `chat_id` (`chat_id`);

--
-- Индексы таблицы `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `user_chat`
--
ALTER TABLE `user_chat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `chat_id` (`chat_id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `chat`
--
ALTER TABLE `chat`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT для таблицы `message`
--
ALTER TABLE `message`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=156;

--
-- AUTO_INCREMENT для таблицы `user`
--
ALTER TABLE `user`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT для таблицы `user_chat`
--
ALTER TABLE `user_chat`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `message`
--
ALTER TABLE `message`
  ADD CONSTRAINT `message_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `message_ibfk_2` FOREIGN KEY (`chat_id`) REFERENCES `chat` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Ограничения внешнего ключа таблицы `user_chat`
--
ALTER TABLE `user_chat`
  ADD CONSTRAINT `user_chat_ibfk_1` FOREIGN KEY (`chat_id`) REFERENCES `chat` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `user_chat_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
