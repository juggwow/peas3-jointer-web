import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RecordFormComponent } from './components/record-form/record-form.component';
import { RecordDetailComponent } from './components/record-detail/record-detail.component';
import { RecordListComponent } from './components/record-list/record-list.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'records', component: RecordListComponent },
  { path: 'record/new', component: RecordFormComponent },
  { path: 'record/:id', component: RecordDetailComponent },
  { path: '**', redirectTo: '' }
];
