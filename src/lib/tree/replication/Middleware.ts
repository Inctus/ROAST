export enum MiddlewareType {
	Error,
	Warning,
}

export type MiddlewareCheck<T> = (value: T) => boolean;

export class Middleware<T> {
	constructor(
		public readonly Name: string,
		private readonly checks: MiddlewareCheck<T>[],
		private readonly type: MiddlewareType,
	) {}

	public check(value: T): boolean {
		return this.checks.every((check) => check(value));
	}

	public fail() {
		switch (this.type) {
			case MiddlewareType.Error:
				error(`Middleware ${this.Name} failed!`);
			case MiddlewareType.Warning:
				warn(`Middleware ${this.Name} failed!`);
		}
	}
}
