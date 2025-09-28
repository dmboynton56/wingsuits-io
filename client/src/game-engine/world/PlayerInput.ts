type Listener = (event: KeyboardEvent) => void;

export class PlayerInput {
  private keys = new Set<string>();
  private keydownHandler: Listener;
  private keyupHandler: Listener;

  constructor() {
    this.keydownHandler = (event) => {
      const key = event.key;
      if (!key) return;
      this.keys.add(key.toLowerCase());
    };

    this.keyupHandler = (event) => {
      const key = event.key;
      if (!key) return;
      this.keys.delete(key.toLowerCase());
    };

    document.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('keyup', this.keyupHandler);
  }

  isDown(key: string) {
    return this.keys.has(key);
  }

  dispose() {
    document.removeEventListener('keydown', this.keydownHandler);
    document.removeEventListener('keyup', this.keyupHandler);
    this.keys.clear();
  }
}

