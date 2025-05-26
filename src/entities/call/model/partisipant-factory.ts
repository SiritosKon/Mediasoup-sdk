// Фабрика для генерации имен участников
export class ParticipantNameFactory {
  private static names = [
    "Алексей",
    "Мария",
    "Иван",
    "Анна",
    "Дмитрий",
    "Елена",
    "Сергей",
    "Ольга",
    "Андрей",
    "Наталья",
    "Максим",
    "Юлия",
  ];
  private static usedNames = new Set<string>();

  static generateName(): string {
    const availableNames = this.names.filter(
      (name) => !this.usedNames.has(name)
    );
    if (availableNames.length === 0) {
      // Если все имена использованы, добавляем номер
      const baseName =
        this.names[Math.floor(Math.random() * this.names.length)];
      let counter = 1;
      while (this.usedNames.has(`${baseName} ${counter}`)) {
        counter++;
      }
      const name = `${baseName} ${counter}`;
      this.usedNames.add(name);
      return name;
    }

    const name =
      availableNames[Math.floor(Math.random() * availableNames.length)];
    this.usedNames.add(name);
    return name;
  }

  static releaseName(name: string): void {
    this.usedNames.delete(name);
  }
}
