

import { Member, Formulas, MonthlyReportFormState } from './types';

export const INITIAL_MEMBERS: Member[] = [
    "Elmer Ocampo", "Rubén Ocampo", "Santos Pichardo", "Adilia Martínez", 
    "Salía Ocampo", "Janny Morales", "Hilda Morales Ocampo", "Reina Matamoros", 
    "Anny Blanchard Ocampo", "Marta García", "Victorina Matamoros", "María Campo", 
    "Neli Ocampo (Apartada)", "Damaris Ortiz (Esposa de ministro)", 
    "Katerin Blanchard Ocampo (Apartada)", "Miurel Blanchard Ocampo (Apartada)", 
    "Fernando Pichardo Ocampo", "Nain Alvarez", "Libni Alvarez"
].map((name, index) => ({ id: `m-${index}-${Date.now()}`, name }));

export const INITIAL_CATEGORIES: string[] = [
    "Diezmo", "Ordinaria", "Luz", "Agua", "Ofrenda Especial"
];

export const DEFAULT_FORMULAS: Formulas = {
  diezmoPercentage: 10,
  remanenteThreshold: 4500
};

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const initialMonthlyReportFormState: MonthlyReportFormState = {
    // 1. Información General
    'clave-iglesia': '', 'nombre-iglesia': '', 'distrito': '', 'departamento': '',
    'miembros-activos': '', 'mes-reporte': '', 'ano-reporte': '', 'nombre-ministro': '',
    'grado-ministro': '', 'tel-ministro': '',
    // 2. Entradas
    'saldo-anterior': '', 'ing-diezmos': '', 'ing-ofrendas-ordinarias': '', 'ing-primicias': '',
    'ing-ayuda-encargado': '', 'ing-ceremonial': '', 'ing-ofrenda-especial-sdd': '',
    'ing-evangelizacion': '', 'ing-santa-cena': '', 'ing-servicios-publicos': '',
    'ing-arreglos-locales': '', 'ing-mantenimiento': '', 'ing-construccion-local': '',
    'ing-muebles': '', 'ing-viajes-ministro': '', 'ing-reuniones-ministeriales': '',
    'ing-atencion-ministros': '', 'ing-viajes-extranjero': '', 'ing-actividades-locales': '',
    'ing-ciudad-lldm': '', 'ing-adquisicion-terreno': '',
    // 3. Salidas
    'egr-asignacion': '', 'egr-gomer': '', 'egr-ceremonial': '', 'egr-ofrenda-especial-sdd': '',
    'egr-evangelizacion': '', 'egr-santa-cena': '', 'egr-servicios-publicos': '',
    'egr-arreglos-locales': '', 'egr-mantenimiento': '', 'egr-traspaso-construccion': '',
    'egr-muebles': '', 'egr-viajes-ministro': '', 'egr-reuniones-ministeriales': '',
    'egr-atencion-ministros': '', 'egr-viajes-extranjero': '', 'egr-actividades-locales': '',
    'egr-ciudad-lldm': '', 'egr-adquisicion-terreno': '',
    // 4. Resumen
    'dist-direccion': '', 'dist-tesoreria': '', 'dist-pro-construccion': '', 'dist-otros': '',
    'comision-nombre-1': '', 'comision-nombre-2': '', 'comision-nombre-3': '',
};