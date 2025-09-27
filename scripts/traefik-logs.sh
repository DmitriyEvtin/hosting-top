#!/bin/bash

# Traefik Logs Viewer
# ===================

set -e

CONTAINER_NAME="traefik"
LOG_DIR="/var/log/traefik"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода справки
show_help() {
    echo -e "${BLUE}Traefik Logs Viewer${NC}"
    echo ""
    echo "Использование: $0 [ОПЦИЯ]"
    echo ""
    echo "Опции:"
    echo "  -a, --access     Показать access logs"
    echo "  -e, --error      Показать error logs"
    echo "  -f, --follow     Следить за логами в реальном времени"
    echo "  -t, --tail N     Показать последние N строк (по умолчанию: 50)"
    echo "  -s, --stats      Показать статистику логов"
    echo "  -c, --clear      Очистить логи"
    echo "  -h, --help       Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0 --access --follow"
    echo "  $0 --error --tail 100"
    echo "  $0 --stats"
}

# Функция для проверки существования контейнера
check_container() {
    if ! docker ps --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        echo -e "${RED}Ошибка: Контейнер '${CONTAINER_NAME}' не запущен${NC}"
        exit 1
    fi
}

# Функция для показа access логов
show_access_logs() {
    echo -e "${GREEN}=== Access Logs ===${NC}"
    docker exec $CONTAINER_NAME cat $LOG_DIR/access.log
}

# Функция для показа error логов
show_error_logs() {
    echo -e "${RED}=== Error Logs ===${NC}"
    docker exec $CONTAINER_NAME cat $LOG_DIR/traefik.log | grep -i error
}

# Функция для следования за логами
follow_logs() {
    echo -e "${YELLOW}Следим за логами... (Ctrl+C для выхода)${NC}"
    docker exec $CONTAINER_NAME tail -f $LOG_DIR/access.log
}

# Функция для показа статистики
show_stats() {
    echo -e "${BLUE}=== Статистика логов ===${NC}"
    
    # Общее количество запросов
    TOTAL_REQUESTS=$(docker exec $CONTAINER_NAME wc -l < $LOG_DIR/access.log)
    echo "Всего запросов: $TOTAL_REQUESTS"
    
    # Топ IP адресов
    echo -e "\n${YELLOW}Топ 10 IP адресов:${NC}"
    docker exec $CONTAINER_NAME cat $LOG_DIR/access.log | \
        awk '{print $1}' | sort | uniq -c | sort -nr | head -10
    
    # Топ URL
    echo -e "\n${YELLOW}Топ 10 URL:${NC}"
    docker exec $CONTAINER_NAME cat $LOG_DIR/access.log | \
        awk '{print $7}' | sort | uniq -c | sort -nr | head -10
    
    # Статус коды
    echo -e "\n${YELLOW}Статус коды:${NC}"
    docker exec $CONTAINER_NAME cat $LOG_DIR/access.log | \
        awk '{print $9}' | sort | uniq -c | sort -nr
    
    # Ошибки
    ERROR_COUNT=$(docker exec $CONTAINER_NAME cat $LOG_DIR/traefik.log | grep -i error | wc -l)
    echo -e "\n${RED}Ошибок в логах: $ERROR_COUNT${NC}"
}

# Функция для очистки логов
clear_logs() {
    echo -e "${YELLOW}Очищаем логи...${NC}"
    docker exec $CONTAINER_NAME sh -c "> $LOG_DIR/access.log"
    docker exec $CONTAINER_NAME sh -c "> $LOG_DIR/traefik.log"
    echo -e "${GREEN}Логи очищены${NC}"
}

# Парсинг аргументов
TAIL_LINES=50
SHOW_ACCESS=false
SHOW_ERROR=false
FOLLOW=false
SHOW_STATS=false
CLEAR_LOGS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -a|--access)
            SHOW_ACCESS=true
            shift
            ;;
        -e|--error)
            SHOW_ERROR=true
            shift
            ;;
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -t|--tail)
            TAIL_LINES="$2"
            shift 2
            ;;
        -s|--stats)
            SHOW_STATS=true
            shift
            ;;
        -c|--clear)
            CLEAR_LOGS=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Неизвестная опция: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Проверяем контейнер
check_container

# Выполняем действия
if [ "$CLEAR_LOGS" = true ]; then
    clear_logs
elif [ "$SHOW_STATS" = true ]; then
    show_stats
elif [ "$FOLLOW" = true ]; then
    follow_logs
elif [ "$SHOW_ACCESS" = true ]; then
    if [ "$TAIL_LINES" -gt 0 ]; then
        docker exec $CONTAINER_NAME tail -n $TAIL_LINES $LOG_DIR/access.log
    else
        show_access_logs
    fi
elif [ "$SHOW_ERROR" = true ]; then
    if [ "$TAIL_LINES" -gt 0 ]; then
        docker exec $CONTAINER_NAME tail -n $TAIL_LINES $LOG_DIR/traefik.log | grep -i error
    else
        show_error_logs
    fi
else
    # По умолчанию показываем последние логи
    echo -e "${GREEN}=== Последние $TAIL_LINES строк access логов ===${NC}"
    docker exec $CONTAINER_NAME tail -n $TAIL_LINES $LOG_DIR/access.log
fi
