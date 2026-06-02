/**
 * Notification service — shows toast messages to the user.
 *
 * Manages a single active notification at a time (stacking would be a
 * future enhancement).  Messages auto-dismiss after a configurable
 * duration (default 4 seconds).
 */
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

	/**
	 * Show a toast notification.
	 * @param message — text to display
	 * @param type — visual style (info/success/warning/error)
	 * @param duration — auto-dismiss time in ms (default 4000)
	 */
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
		// Schedule auto-dismiss; if a new notification arrives first,
		// the old one is simply overwritten by the signal setter.
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

	/**
	 * Placeholder for a confirmation dialog.
	 * Currently always resolves to true — a real modal would be added later.
	 */
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
