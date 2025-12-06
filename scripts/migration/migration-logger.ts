/**
 * Migration Logger
 * Модуль для логирования процесса миграции данных
 */

import chalk from "chalk";
import { createWriteStream, WriteStream } from "fs";
import { join } from "path";

/**
 * Уровни логирования
 */
export enum LogLevel {
  INFO = "INFO",
  SUCCESS = "SUCCESS",
  WARNING = "WARNING",
  ERROR = "ERROR",
}

/**
 * Интерфейс для записи лога
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

/**
 * Класс для логирования миграции
 */
class MigrationLogger {
  private logFile: WriteStream | null = null;
  private logFilePath: string;

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    this.logFilePath = join(
      process.cwd(),
      "scripts",
      "migration",
      `migration-${timestamp}.log`
    );
    this.initializeLogFile();
  }

  /**
   * Инициализирует файл для записи логов
   */
  private initializeLogFile(): void {
    try {
      this.logFile = createWriteStream(this.logFilePath, { flags: "a" });
      this.logFile.write(`\n${"=".repeat(80)}\n`);
      this.logFile.write(`Migration started at: ${new Date().toISOString()}\n`);
      this.logFile.write(`${"=".repeat(80)}\n\n`);
    } catch (error) {
      console.error(chalk.red(`Failed to initialize log file: ${error}`));
    }
  }

  /**
   * Форматирует сообщение для вывода
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  /**
   * Записывает лог в файл и консоль
   */
  private writeLog(level: LogLevel, message: string): void {
    const formattedMessage = this.formatMessage(level, message);

    // Запись в файл
    if (this.logFile) {
      this.logFile.write(`${formattedMessage}\n`);
    }

    // Вывод в консоль с цветами
    const consoleMessage = formattedMessage;
    switch (level) {
      case LogLevel.INFO:
        console.log(chalk.blue(consoleMessage));
        break;
      case LogLevel.SUCCESS:
        console.log(chalk.green(consoleMessage));
        break;
      case LogLevel.WARNING:
        console.log(chalk.yellow(consoleMessage));
        break;
      case LogLevel.ERROR:
        console.error(chalk.red(consoleMessage));
        break;
    }
  }

  /**
   * Логирует информационное сообщение
   */
  info(message: string): void {
    this.writeLog(LogLevel.INFO, message);
  }

  /**
   * Логирует успешное выполнение
   */
  success(message: string): void {
    this.writeLog(LogLevel.SUCCESS, message);
  }

  /**
   * Логирует предупреждение
   */
  warning(message: string): void {
    this.writeLog(LogLevel.WARNING, message);
  }

  /**
   * Логирует ошибку
   */
  error(message: string, error?: Error): void {
    let errorMessage = message;
    if (error) {
      errorMessage += `: ${error.message}`;
      if (error.stack) {
        errorMessage += `\nStack: ${error.stack}`;
      }
    }
    this.writeLog(LogLevel.ERROR, errorMessage);
  }

  /**
   * Логирует разделитель
   */
  separator(): void {
    const separator = "=".repeat(80);
    this.info(separator);
  }

  /**
   * Логирует заголовок секции
   */
  section(title: string): void {
    this.separator();
    this.info(`  ${title}`);
    this.separator();
  }

  /**
   * Закрывает файл логов
   */
  close(): void {
    if (this.logFile) {
      this.logFile.write(`\n${"=".repeat(80)}\n`);
      this.logFile.write(
        `Migration finished at: ${new Date().toISOString()}\n`
      );
      this.logFile.write(`${"=".repeat(80)}\n\n`);
      this.logFile.end();
      this.logFile = null;
    }
  }

  /**
   * Возвращает путь к файлу логов
   */
  getLogFilePath(): string {
    return this.logFilePath;
  }
}

/**
 * Глобальный экземпляр логгера
 */
let loggerInstance: MigrationLogger | null = null;

/**
 * Получает экземпляр логгера (singleton)
 */
export function getLogger(): MigrationLogger {
  if (!loggerInstance) {
    loggerInstance = new MigrationLogger();
  }
  return loggerInstance;
}

/**
 * Инициализирует логгер
 */
export function initializeLogger(): MigrationLogger {
  if (loggerInstance) {
    loggerInstance.close();
  }
  loggerInstance = new MigrationLogger();
  return loggerInstance;
}

/**
 * Закрывает логгер
 */
export function closeLogger(): void {
  if (loggerInstance) {
    loggerInstance.close();
    loggerInstance = null;
  }
}
