import { Component, input, output } from '@angular/core';
import { ProjectSummary } from '../../core/models/project.model';
import { TfBadge } from '../../shared/ui/badge/badge';
import { TfButton } from '../../shared/ui/button/button';

// #region step-7.10
// קומפוננטה "טיפשה": כל מה שהיא יודעת נכנס דרך input,
// כל מה שיש לה לומר יוצא דרך output. אפס הזרקות, אפס ידע על העולם.
// מפרק 09 היא צורכת את הערכה המשותפת — אבל החוזה שלה לא השתנה.
@Component({
  selector: 'tf-project-card',
  imports: [TfBadge, TfButton],
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
