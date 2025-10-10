import { Member, Formulas, MonthlyReportFormState } from './types';

// --- ACTION REQUIRED ---
// Paste your Google OAuth 2.0 Client ID here. This is required for the
// administrator to connect their Google account and enable Drive integration.
export const GOOGLE_CLIENT_ID = '641321851743-oelc0tqe0u2fanhun1m5vbjgkgr8r6vl.apps.googleusercontent.com'; // e.g., '1234567890-abcde.apps.googleusercontent.com'


export const INITIAL_MEMBERS: Member[] = [
  { id: 'm-1', name: 'Juan Perez' },
  { id: 'm-2', name: 'Maria Rodriguez' },
  { id: 'm-3', name: 'Carlos Gomez' },
  { id: 'm-4', name: 'Ana Martinez' },
  { id: 'm-5', name: 'Luis Garcia' },
];

export const INITIAL_CATEGORIES: string[] = [
  'Diezmo',
  'Ordinaria',
  'Luz',
  'Agua',
  'Construccion',
  'Especial',
  'Primicias',
  'Ayuda al Encargado',
  'Ceremonial',
];

export const DEFAULT_FORMULAS: Formulas = {
  diezmoPercentage: 10,
  remanenteThreshold: 5000,
};

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const initialMonthlyReportFormState: MonthlyReportFormState = {
    // 1. Información General
    'clave-iglesia': '',
    'nombre-iglesia': '',
    'distrito': '',
    'departamento': '',
    'miembros-activos': '',
    'mes-reporte': '',
    'ano-reporte': '',
    'nombre-ministro': '',
    'grado-ministro': '',
    'tel-ministro': '',
    // 2. Entradas
    'saldo-anterior': '',
    'ing-diezmos': '',
    'ing-ofrendas-ordinarias': '',
    'ing-primicias': '',
    'ing-ayuda-encargado': '',
    'ing-ceremonial': '',
    'ing-ofrenda-especial-sdd': '',
    'ing-evangelizacion': '',
    'ing-santa-cena': '',
    'ing-servicios-publicos': '',
    'ing-arreglos-locales': '',
    'ing-mantenimiento': '',
    'ing-construccion-local': '',
    'ing-muebles': '',
    'ing-viajes-ministro': '',
    'ing-reuniones-ministeriales': '',
    'ing-atencion-ministros': '',
    'ing-viajes-extranjero': '',
    'ing-actividades-locales': '',
    'ing-ciudad-lldm': '',
    'ing-adquisicion-terreno': '',
    // 3. Salidas
    'egr-asignacion': '',
    'egr-gomer': '',
    'egr-ceremonial': '',
    'egr-ofrenda-especial-sdd': '',
    'egr-evangelizacion': '',
    'egr-santa-cena': '',
    'egr-servicios-publicos': '',
    'egr-arreglos-locales': '',
    'egr-mantenimiento': '',
    'egr-traspaso-construccion': '',
    'egr-muebles': '',
    'egr-viajes-ministro': '',
    'egr-reuniones-ministeriales': '',
    'egr-atencion-ministros': '',
    'egr-viajes-extranjero': '',
    'egr-actividades-locales': '',
    'egr-ciudad-lldm': '',
    'egr-adquisicion-terreno': '',
    // 4. Resumen
    'dist-direccion': '',
    'dist-tesoreria': '',
    'dist-pro-construccion': '',
    'dist-otros': '',
    'comision-nombre-1': '',
    'comision-nombre-2': '',
    'comision-nombre-3': '',
};

// These folder IDs are for the administrator's personal Drive account.
// The app will gain access to them after the admin logs in.
export const DRIVE_WEEKLY_REPORTS_FOLDER_ID = '1KZ1NWR8dH1LmpAOgmU-lhUda9aTwa3PW';
export const DRIVE_MONTHLY_REPORTS_FOLDER_ID = '1MTDHnogp-IAAVHazdjgGu4V5-SDJ31hp';
