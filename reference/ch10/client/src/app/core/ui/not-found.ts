import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// עמוד ה-404: ה-wildcard ** תופס כל URL שאף נתיב לא התאים לו.
// קומפוננטה קטנה מספיק לקובץ אחד — template ו-styles inline.
@Component({
  selector: 'tf-not-found',
  imports: [RouterLink],
  template: `
    <section class="nf">
      <h2>404 — this anvil is empty</h2>
      <p>The page you were looking for does not exist.</p>
      <a routerLink="/">Back to the forge</a>
    </section>
  `,
  styles: `
    .nf {
      text-align: center;
      padding-block: var(--sp-6);

      a {
        color: var(--ember);
      }
    }
  `,
})
export class NotFound {}
