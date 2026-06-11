import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

// המכולה חיה פעם אחת בשלד. aria-live="polite" מקריא הודעות חדשות
// לקוראי מסך בלי לקטוע את מה שבאמצע.
@Component({
  selector: 'tf-toast-container',
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.scss',
})
export class ToastContainer {
  protected readonly toastSvc = inject(ToastService);
}
