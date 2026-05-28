/**
 * Notification toast component — displays the active notification from
 * NotificationService as a floating card in the top-right corner.
 *
 * The toast auto-dismisses after the configured duration (set by the
 * service); the user can also dismiss it manually via the × button.
 * Only one notification is shown at a time — a new one replaces the
 * current toast.
 */
import { Component, inject } from "@angular/core";
import { NotificationService } from "../../core/services/notification.service";

@Component({
	selector: "app-notification-toast",
	standalone: true,
	template: `
		@if (notification()) {
		<div class="toast" [class]="toastClass">
			<span class="toast-message">{{ notification()?.message }}</span>
			<button class="toast-dismiss" (click)="dismiss()">×</button>
		</div>
		}
	`,
	styles: `
		.toast {
			position: fixed;
			top: 72px;
			right: 24px;
			z-index: 1000;
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 12px 16px;
			border-radius: 8px;
			font-size: 0.875rem;
			font-weight: 500;
			max-width: 360px;
			background-color: rgba(15, 23, 42, 0.95);
			border: 1px solid var(--color-border, #4a5568);
			animation: slide-in 0.3s ease;

			.toast-message {
				flex: 1;
				line-height: 1.4;
			}

			.toast-dismiss {
				padding: 2px 6px;
				font-size: 1rem;
				color: inherit;
				opacity: 0.6;
				cursor: pointer;
				border: none;
				background: transparent;
				transition: opacity 0.15s ease;

				&:hover {
					opacity: 1;
				}
			}

			&.type-info {
				background-color: rgba(108, 99, 255, 0.15);
				border: 1px solid rgba(108, 99, 255, 0.3);
				color: var(--color-accent, #6c63ff);
			}

			&.type-success {
				background-color: rgba(72, 187, 120, 0.15);
				border: 1px solid rgba(72, 187, 120, 0.3);
				color: var(--color-success, #48bb78);
			}

			&.type-warning {
				background-color: rgba(236, 201, 75, 0.15);
				border: 1px solid rgba(236, 201, 75, 0.3);
				color: var(--color-warning, #ecc94b);
			}

			&.type-error {
				background-color: rgba(252, 129, 129, 0.15);
				border: 1px solid rgba(252, 129, 129, 0.3);
				color: var(--color-error, #fc8181);
			}
		}

		@keyframes slide-in {
			from {
				opacity: 0;
				transform: translateX(20px);
			}
			to {
				opacity: 1;
				transform: translateX(0);
			}
		}

		@media (max-width: 768px) {
			.toast {
				top: 64px;
				right: 16px;
				left: 16px;
				max-width: none;
			}
		}
	`,
})
export class NotificationToastComponent {
	private notifications = inject(NotificationService);
	notification = this.notifications.current;

	/** Build the CSS class for the toast's color theme (e.g. "type-error"). */
	get toastClass(): string {
		return `type-${this.notification()?.type ?? "info"}`;
	}

	dismiss(): void {
		this.notifications.clear();
	}
}
