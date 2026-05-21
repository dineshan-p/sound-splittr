import { Injectable, signal } from "@angular/core";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
	id: number;
	message: string;
	type: NotificationType;
	duration: number;
}

@Injectable({ providedIn: "root" })
export class NotificationService {
	private nextId = 0;
	current = signal<Notification | null>(null);

	show(
		message: string,
		type: NotificationType = "info",
		duration: number = 4000,
	): void {
		this.current.set({
			id: ++this.nextId,
			message,
			type,
			duration,
		});
		setTimeout(() => this.current.set(null), duration);
	}

	info(message: string, duration?: number): void {
		this.show(message, "info", duration);
	}

	success(message: string, duration?: number): void {
		this.show(message, "success", duration);
	}

	warning(message: string, duration?: number): void {
		this.show(message, "warning", duration);
	}

	error(message: string, duration?: number): void {
		this.show(message, "error", duration);
	}

	async confirm(message: string): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			this.show(message, "warning", 60_000);
			resolve(true);
		});
	}

	clear(): void {
		this.current.set(null);
	}
}
