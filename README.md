# Mediasoup SDK

SDK для работы с WebRTC на основе библиотеки Mediasoup.

## Описание

Этот SDK предоставляет удобный интерфейс для работы с WebRTC через Mediasoup, позволяя легко интегрировать видеозвонки и аудио-видео коммуникации в ваши приложения.
(тестовое задание)

## Структура проекта

```
src/
├── __tests__/     # Тесты
├── features/      # Основные функциональные модули
├── entities/      # Бизнес-сущности
└── shared/        # Общие утилиты и типы
```

## Использование

```typescript
import { VideoCallClient } from "mediasoup-sdk";

// Создаем клиент с указанием URL сигнального сервера
const client = new VideoCallClient("ws://your-signaling-server.com");

// Создаем новую комнату для звонка
const call = client.createCall();

// Подключаемся к комнате
await client.joinCall(call.id, "user123");

// Слушаем события подключения
client.on("connected", () => {
  console.log("Подключено к сигнальному серверу");
});

// Слушаем события добавления продюсера (новый участник начал передачу медиа)
client.on("producerAdded", ({ producerId, kind }) => {
  console.log(`Новый ${kind} поток от участника ${producerId}`);
});

// Слушаем события присоединения участников
client.on("joined", (participant) => {
  console.log(`Участник ${participant.id} присоединился к звонку`);
});

// Завершение звонка
call.endCall();
```

## Предложения по улучшению

### Архитектурные улучшения

1. **Управление состоянием с MobX**

   - Создание централизованного стора для хранения состояния WebSocket соединения
   - Хранение массива активных звонков (`calls`) и их участников (`callParticipants`) в сторе
   - Реализация паттерна Singleton для WebSocket соединения
   - Вынесение бизнес-логики в MobX actions

2. **Оптимизация WebSocket**
   - Создание отдельного класса для работы с WebSocket
   - Перенос WebSocket в Shadow Worker для оптимизации производительности
   - Реализация механизма переподключения и обработки ошибок

### Архитектура Feature-Sliced Design (FSD)

Проект частично следует методологии FSD, что видно из структуры директорий:

- `features/` - основные функциональные модули
- `entities/` - бизнес-сущности
- `shared/` - общие утилиты и типы

### Тестирование

Текущая реализация включает:

- Моки для WebSocket, Device, Transport и MediaStream
- Тесты для основных компонентов SDK
- Отсутствие реального серверного окружения

Предлагаемые улучшения:

1. Добавление интеграционных тестов
2. Создание тестового серверного окружения
3. Расширение покрытия unit-тестами

## Разработка

1. Клонируйте репозиторий:

```bash
git clone https://github.com/SiritosKon/Mediasoup-sdk.git
```

2. Установите зависимости:

```bash
npm install
```

3. Запустите тесты:

```bash
npm test
```

## Автор

[SiritosKon](https://github.com/SiritosKon)
