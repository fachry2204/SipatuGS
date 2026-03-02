import React from 'react';
import MainDashboardSection from './components/MainDashboardSection';
import WargaMainDashboard from './components/WargaMainDashboard';
import WargaProfileSection from './components/WargaProfileSection';
import ServiceListSection from './components/ServiceListSection';
import ReportListSection from './components/ReportListSection';
import CitizenDashboardSection from './components/CitizenDashboardSection';
import CitizenSection from './components/CitizenSection';
import CitizenStatisticsSection from './components/CitizenStatisticsSection';
import ServiceDashboardSection from './components/ServiceDashboardSection';
import ServiceStatisticsSection from './components/ServiceStatisticsSection';
import ServiceRatingSection from './components/ServiceRatingSection';
import AnjunganMandiriSection from './components/AnjunganMandiriSection';
import DashboardSection from './components/DashboardSection';
import PPSUSection from './components/PPSUSection';
import DutySection from './components/DutySection';
import MapSection from './components/MapSection';
import AttendanceSection from './components/AttendanceSection';
import StatisticsSection from './components/StatisticsSection';
import ReportDashboardSection from './components/ReportDashboardSection';
import ReportMapSection from './components/ReportMapSection';
import ReportStatisticsSection from './components/ReportStatisticsSection';
import SettingsSection from './components/SettingsSection';
import UserManagementSection from './components/UserManagementSection';
import PartnerRTRWSection from './components/PartnerRTRWSection';
import PartnerLMKSection from './components/PartnerLMKSection';
import { User, SystemSettings, Report, Staff, Citizen, ServiceRequest, ServiceRating } from './types';

type Ctx = {
  activeSubmenu: string;
  currentUser: User;
  settings: SystemSettings;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  citizens: Citizen[];
  setCitizens: React.Dispatch<React.SetStateAction<Citizen[]>>;
  staffList: Staff[];
  setStaffList: React.Dispatch<React.SetStateAction<Staff[]>>;
  reports: Report[];
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
  serviceRequests: ServiceRequest[];
  setServiceRequests: React.Dispatch<React.SetStateAction<ServiceRequest[]>>;
  ratings: ServiceRating[];
  setRatings: React.Dispatch<React.SetStateAction<ServiceRating[]>>;
  setActiveSubmenu: (id: string) => void;
  setIsSidebarHidden: (v: boolean) => void;
  staffDashboardRenderer?: () => JSX.Element;
};

export const submenuToPath: Record<string, string> = {
  MAIN_DASHBOARD: '/',
  STAFF_DASHBOARD: '/staff/dashboard',
  DASHBOARD_WARGA: '/citizen/dashboard',
  DATA_WARGA: '/citizen/data',
  STATS_WARGA: '/citizen/stats',
  WARGA_DASHBOARD: '/warga/dashboard',
  WARGA_PROFILE: '/warga/profile',
  WARGA_SURAT: '/warga/surat',
  WARGA_LAPOR: '/warga/lapor',
  SERVICE_DASHBOARD: '/service/dashboard',
  SERVICE_LIST: '/service/list',
  STAFF_SERVICE_LIST: '/staff/service-list',
  SERVICE_STATS: '/service/stats',
  SERVICE_RATING: '/service/rating',
  REPORT_DASHBOARD: '/report/dashboard',
  REPORT_LIST: '/report/list',
  REPORT_HISTORY: '/report/history',
  REPORT_MAP: '/report/map',
  REPORT_STATS: '/report/stats',
  PPSU: '/ppsu',
  MONITORING: '/monitoring',
  MAP_PPSU: '/map/ppsu',
  ABSENSI: '/absensi',
  STATS: '/stats',
  SETTINGS: '/settings',
  USER_MANAGEMENT: '/users',
  PARTNER_RTRW: '/partner/rtrw',
  PARTNER_LMK: '/partner/lmk',
  PARTNER_FKDM: '/partner/fkdm',
  PARTNER_KARANG_TARUNA: '/partner/karang-taruna',
  ANJUNGAN_MANDIRI: '/anjungan-mandiri',
  DASHBOARD: '/dashboard'
};

export function pathToSubmenu(pathname: string): string {
  // Normalize pathname: remove trailing slash if present (unless it's root)
  const normalized = pathname.length > 1 && pathname.endsWith('/') 
    ? pathname.slice(0, -1) 
    : pathname;

  const entry = Object.entries(submenuToPath).find(([, p]) => p === normalized);
  return entry ? entry[0] : 'MAIN_DASHBOARD';
}

export function renderSubmenuContent(ctx: Ctx) {
  const currentCitizen = ctx.currentUser.role === 'Warga'
    ? ctx.citizens.find(c => c.nik === ctx.currentUser.nik)
    : undefined;

  switch (ctx.activeSubmenu) {
    case 'WARGA_DASHBOARD':
      return <WargaMainDashboard citizen={currentCitizen} reports={ctx.reports} requests={ctx.serviceRequests} onNavigate={(menu) => ctx.setActiveSubmenu(menu)} />;
    case 'WARGA_PROFILE':
      return <WargaProfileSection citizen={currentCitizen} />;
    case 'WARGA_SURAT':
      return <ServiceListSection requests={ctx.serviceRequests.filter(req => req.applicantNik === ctx.currentUser.nik)} setRequests={ctx.setServiceRequests} citizens={ctx.citizens} onNavigateToCitizen={() => {}} users={ctx.users} isWargaView={true} userFilter={ctx.currentUser.nik} />;
    case 'WARGA_LAPOR':
      return <ReportListSection type="active" reports={ctx.reports} setReports={ctx.setReports} staffList={ctx.staffList} setStaffList={ctx.setStaffList} users={ctx.users} citizens={ctx.citizens} userFilter={ctx.currentUser.nik} />;
    case 'MAIN_DASHBOARD':
      return <MainDashboardSection user={ctx.currentUser} citizens={ctx.citizens} staffList={ctx.staffList} onNavigate={(menu) => ctx.setActiveSubmenu(menu)} />;
    case 'STAFF_DASHBOARD':
      return ctx.staffDashboardRenderer ? ctx.staffDashboardRenderer() : <MainDashboardSection user={ctx.currentUser} citizens={ctx.citizens} staffList={ctx.staffList} onNavigate={(menu) => ctx.setActiveSubmenu(menu)} />;
    case 'DASHBOARD_WARGA':
      return <CitizenDashboardSection citizens={ctx.citizens} />;
    case 'DATA_WARGA':
      return <CitizenSection users={ctx.users} setUsers={ctx.setUsers} citizens={ctx.citizens} setCitizens={ctx.setCitizens} />;
    case 'STATS_WARGA':
      return <CitizenStatisticsSection citizens={ctx.citizens} />;
    case 'SERVICE_DASHBOARD':
      return <ServiceDashboardSection requests={ctx.serviceRequests} />;
    case 'STAFF_SERVICE_LIST':
    case 'SERVICE_LIST':
      return <ServiceListSection requests={ctx.serviceRequests} setRequests={ctx.setServiceRequests} citizens={ctx.citizens} onNavigateToCitizen={() => ctx.setActiveSubmenu('DATA_WARGA')} users={ctx.users} />;
    case 'SERVICE_STATS':
      return <ServiceStatisticsSection requests={ctx.serviceRequests} />;
    case 'SERVICE_RATING':
      return <ServiceRatingSection ratings={ctx.ratings} />;
    case 'ANJUNGAN_MANDIRI':
      return <AnjunganMandiriSection settings={ctx.settings} citizens={ctx.citizens} requests={ctx.serviceRequests} ratings={ctx.ratings} onSaveRequest={(req) => ctx.setServiceRequests(prev => [req, ...prev])} onSaveRating={(rating) => ctx.setRatings(prev => [rating, ...prev])} onExit={() => { ctx.setActiveSubmenu('MAIN_DASHBOARD'); ctx.setIsSidebarHidden(false); }} />;
    case 'DASHBOARD':
      return <DashboardSection user={ctx.currentUser} onNavigate={(menu) => ctx.setActiveSubmenu(menu)} staffList={ctx.staffList} />;
    case 'PPSU':
      return <PPSUSection user={ctx.currentUser} staffList={ctx.staffList} setStaffList={ctx.setStaffList} />;
    case 'MONITORING':
      return <DutySection user={ctx.currentUser} reports={ctx.reports} setReports={ctx.setReports} staffList={ctx.staffList} setStaffList={ctx.setStaffList} />;
    case 'MAP_PPSU':
      return <MapSection reports={ctx.reports} setReports={ctx.setReports} staffList={ctx.staffList} setStaffList={ctx.setStaffList} />;
    case 'ABSENSI':
      return <AttendanceSection user={ctx.currentUser} />;
    case 'STATS':
      return <StatisticsSection />;
    case 'REPORT_DASHBOARD':
      return <ReportDashboardSection reports={ctx.reports} />;
    case 'REPORT_LIST':
      return <ReportListSection type="active" reports={ctx.reports} setReports={ctx.setReports} staffList={ctx.staffList} setStaffList={ctx.setStaffList} users={ctx.users} citizens={ctx.citizens} />;
    case 'REPORT_HISTORY':
      return <ReportListSection type="history" reports={ctx.reports} setReports={ctx.setReports} staffList={ctx.staffList} setStaffList={ctx.setStaffList} users={ctx.users} citizens={ctx.citizens} />;
    case 'REPORT_MAP':
      return <ReportMapSection reports={ctx.reports} setReports={ctx.setReports} staffList={ctx.staffList} setStaffList={ctx.setStaffList} />;
    case 'REPORT_STATS':
      return <ReportStatisticsSection reports={ctx.reports} setReports={ctx.setReports} staffList={ctx.staffList} setStaffList={ctx.setStaffList} />;
    case 'SETTINGS':
      return <SettingsSection settings={ctx.settings} onUpdate={ctx.setSettings} />;
    case 'USER_MANAGEMENT':
      return <UserManagementSection users={ctx.users} setUsers={ctx.setUsers} initialTab="SEMUA" />;
    case 'PARTNER_RTRW':
      return <PartnerRTRWSection />;
    case 'PARTNER_LMK':
      return <PartnerLMKSection />;
    case 'PARTNER_FKDM':
    case 'PARTNER_KARANG_TARUNA':
      return <UserManagementSection users={ctx.users} setUsers={ctx.setUsers} initialTab="LAINNYA" />;
    default:
      return <MainDashboardSection user={ctx.currentUser} citizens={ctx.citizens} staffList={ctx.staffList} onNavigate={(menu) => ctx.setActiveSubmenu(menu)} />;
  }
}
