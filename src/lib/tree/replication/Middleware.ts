export enum MiddlewareType {
	ERROR,
	WARNING,
}

export type MiddlewareCheck<T> = (oldValue: T, newValue: T) => boolean;

export class Middleware<T> {
	constructor(
		public readonly name: string,
		private readonly checks: MiddlewareCheck<T>[],
		private readonly type: MiddlewareType,
	) {}

	public check(oldValue: T, value: T): boolean {
		return this.checks.every((check) => check(oldValue, value));
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
