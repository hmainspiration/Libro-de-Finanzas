
import { Member, Formulas } from './types';

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
