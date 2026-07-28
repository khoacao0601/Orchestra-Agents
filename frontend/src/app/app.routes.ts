import { Routes } from '@angular/router';
import { ReaderPortalComponent } from './features/reader-portal/reader-portal.component';
import { AdminControlComponent } from './features/admin-control/admin-control.component';

export const routes: Routes = [
  { path: '', component: ReaderPortalComponent },
  { path: 'admin', component: AdminControlComponent },
  { path: '**', redirectTo: '' }
];
