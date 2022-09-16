export enum MiddlewareType {
	ERROR,
	WARNING,
}

export type MiddlewareCheck<T> = (old: T | undefined, newValue: T) => boolean;

export class Middleware<T> {
	constructor(
		public readonly name: string,
		private readonly checks: MiddlewareCheck<T>[],
		private readonly type: MiddlewareType,
	) {}

	public check(old: T | undefined, value: T): boolean {
		return this.checks.every((check) => check(old, value));
	}

	public fail() {
		switch (this.type) {
			case MiddlewareType.ERROR:
				error(`Middleware ${this.name} failed!`);
			case MiddlewareType.WARNING:
				warn(`Middleware ${this.name} failed!`);
		}
	}
}
