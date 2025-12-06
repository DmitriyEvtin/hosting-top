<?php
// Конфигурация Adminer для автоматического подключения к PostgreSQL

// Автоматическое подключение к базе данных
function adminer_object() {
    class AdminerCustomization extends Adminer {
        function credentials() {
            // Возвращаем данные для подключения к PostgreSQL
            return [
                'postgres', // сервер
                'parket_crm_user', // пользователь
                'parket_crm_password', // пароль
                'parket_crm' // база данных
            ];
        }
        
        function login($login, $password) {
            // Автоматический вход без проверки пароля
            return true;
        }
        
        function name() {
            // Кастомное название
            return 'Hosting Top Database';
        }
        
        function permanentLogin($jwt) {
            // Отключаем JWT для упрощения
            return false;
        }
        
        function loginForm() {
            // Скрываем форму входа и автоматически подключаемся
            echo '<script>window.location.href = "?server=postgres&username=parket_crm_user&password=parket_crm_password&db=parket_crm";</script>';
        }
    }
    
    return new AdminerCustomization;
}

// Включаем кастомную конфигурацию
include_once "./adminer.php";
?>
