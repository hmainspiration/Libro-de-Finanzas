export interface Member {
  id: string;
  name: string;
}

export interface Donation {
  id: string;
  memberId: string;
  memberName: string;
  category: string;
  amount: number;
}

export interface Formulas {
  diezmoPercentage: number;
  remanenteThreshold: number;
}

export interface WeeklyRecord {
  id: string;
  day: number;
  month: number;
  year: number;
  minister: string;
  donations: Donation[];
  formulas: Formulas;
}

export type Tab = 'register' | 'summary' | 'history' | 'monthly' | 'informe' | 'admin';

// This will be a map of string keys to string values, based on the form structure.
// Fix: Changed from a generic map to a specific type to ensure type safety.
export type MonthlyReportFormState = {
    // 1. Información General
    'clave-iglesia': string;
    'nombre-iglesia': string;
    'distrito': string;
    'departamento': string;
    'miembros-activos': string;
    'mes-reporte': string;
    'ano-reporte': string;
    'nombre-ministro': string;
    'grado-ministro': string;
    'tel-ministro': string;
    // 2. Entradas
    'saldo-anterior': string;
    'ing-diezmos': string;
    'ing-ofrendas-ordinarias': string;
    'ing-primicias': string;
    'ing-ayuda-encargado': string;
    'ing-ceremonial': string;
    'ing-ofrenda-especial-sdd': string;
    'ing-evangelizacion': string;
    'ing-santa-cena': string;
    'ing-servicios-publicos': string;
    'ing-arreglos-locales': string;
    'ing-mantenimiento': string;
    'ing-construccion-local': string;
    'ing-muebles': string;
    'ing-viajes-ministro': string;
    'ing-reuniones-ministeriales': string;
    'ing-atencion-ministros': string;
    'ing-viajes-extranjero': string;
    'ing-actividades-locales': string;
    'ing-ciudad-lldm': string;
    'ing-adquisicion-terreno': string;
    // 3. Salidas
    'egr-asignacion': string;
    'egr-gomer': string;
    'egr-ceremonial': string;
    'egr-ofrenda-especial-sdd': string;
    'egr-evangelizacion': string;
    'egr-santa-cena': string;
    'egr-servicios-publicos': string;
    'egr-arreglos-locales': string;
    'egr-mantenimiento': string;
    'egr-traspaso-construccion': string;
    'egr-muebles': string;
    'egr-viajes-ministro': string;
    'egr-reuniones-ministeriales': string;
    'egr-atencion-ministros': string;
    'egr-viajes-extranjero': string;
    'egr-actividades-locales': string;
    'egr-ciudad-lldm': string;
    'egr-adquisicion-terreno': string;
    // 4. Resumen
    'dist-direccion': string;
    'dist-tesoreria': string;
    'dist-pro-construccion': string;
    'dist-otros': string;
    'comision-nombre-1': string;
    'comision-nombre-2': string;
    'comision-nombre-3': string;
};

export interface MonthlyReport {
  id: string; // e.g., 'report-2024-7'
  month: number;
  year: number;
  formData: MonthlyReportFormState;
}