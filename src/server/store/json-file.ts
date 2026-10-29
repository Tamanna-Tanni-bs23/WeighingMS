import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/** Small synchronous JSON document store with atomic writes (temp file → rename). */
export class JsonFile<T> {
  private readonly path: string;

  constructor(dataDir: string, name: string, private readonly initial: () => T) {
    this.path = join(dataDir, name);
  }

  read(): T {
    try {
      return JSON.parse(readFileSync(this.path, 'utf8')) as T;
    } catch {
      return this.initial();
    }
  }

  write(value: T): void {
    mkdirSync(dirname(this.path), { recursive: true });
    const tmp = `${this.path}.tmp`;
    writeFileSync(tmp, JSON.stringify(value, null, 2));
    renameSync(tmp, this.path);
  }

  update(fn: (value: T) => T): T {
    const next = fn(this.read());
    this.write(next);
    return next;
  }
}
