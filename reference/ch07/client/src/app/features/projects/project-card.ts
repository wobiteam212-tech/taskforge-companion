import { Component, input, output } from '@angular/core';
import { ProjectSummary } from '../../core/models/project.model';

// #region step-7.10
// קומפוננטה "טיפשה": כל מה שהיא יודעת נכנס דרך input,
// כל מה שיש לה לומר יוצא דרך output. אפס הזרקות, אפס ידע על העולם.
@Component({
  selector: 'tf-project-card',
  templateUrl: './project-card.html',
  styleUrl: './project-card.scss',
})
export class ProjectCard {
  /** required: בלי project אין כרטיס — המהדר אוכף את זה על כל שימוש */
  readonly project = input.required<ProjectSummary>();

  /** הכרטיס לא מנווט בעצמו — הוא מודיע, וההורה מחליט */
  readonly open = output<number>();
}
// #endregion
