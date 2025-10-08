
import React, { useMemo } from 'react';
import { WeeklyRecord, Donation } from '../../types';

interface ResumenFinancieroTabProps {
  currentRecord: WeeklyRecord | null;
  categories: string[];
}

const ResumenFinancieroTab: React.FC<ResumenFinancieroTabProps> = ({ currentRecord, categories }) => {
  const donationsByMember = useMemo(() => {
    if (!currentRecord) return {};
    return currentRecord.donations.reduce((acc, donation) => {
      if (!acc[donation.memberName]) {
        acc[donation.memberName] = {};
      }
      acc[donation.memberName][donation.category] = (acc[donation.memberName][donation.category] || 0) + donation.amount;
      return acc;
    }, {} as Record<string, Record<string, number>>);
  }, [currentRecord]);

  const memberNames = useMemo(() => {
    if (!currentRecord) return [];
    return [...new Set(currentRecord.donations.map(d => d.memberName))].sort();
  }, [currentRecord]);

  const totals = useMemo(() => {
    if (!currentRecord) return null;

    const subtotals: Record<string, number> = {};
    categories.forEach(cat => {
      subtotals[cat] = 0;
    });

    currentRecord.donations.forEach(d => {
      if (subtotals[d.category] !== undefined) {
        subtotals[d.category] += d.amount;
      }
    });

    const total = (subtotals['Diezmo'] || 0) + (subtotals['Ordinaria'] || 0);
    const diezmoDeDiezmo = Math.round(total * (currentRecord.formulas.diezmoPercentage / 100));
    const remanente = total > currentRecord.formulas.remanenteThreshold ? Math.round(total - currentRecord.formulas.remanenteThreshold) : 0;
    const gomerMinistro = Math.round(total - diezmoDeDiezmo);
    
    return { subtotals, total, diezmoDeDiezmo, remanente, gomerMinistro };
  }, [currentRecord, categories]);


  if (!currentRecord) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6 text-center bg-white rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-700">No hay una semana activa</h3>
        <p className="mt-2 text-gray-500">Por favor, inicie un nuevo registro en la pestaña 'Registro' para ver el resumen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-primary mb-4">Resumen Financiero Semanal</h2>
        <p className="text-gray-600">Fecha: {currentRecord.day}/{currentRecord.month}/{currentRecord.year}</p>
        <p className="text-gray-600">Ministro: {currentRecord.minister}</p>
        
        <div className="overflow-x-auto mt-6">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-white uppercase bg-primary">
              <tr>
                <th scope="col" className="px-6 py-3">Nombre</th>
                {categories.map(cat => <th key={cat} scope="col" className="px-6 py-3 text-right">{cat}</th>)}
              </tr>
            </thead>
            <tbody>
              {memberNames.map(name => (
                <tr key={name} className="bg-white border-b hover:bg-gray-50">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{name}</th>
                  {categories.map(cat => (
                    <td key={cat} className="px-6 py-4 text-right">
                      {donationsByMember[name]?.[cat]?.toFixed(2) || '–'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {totals && (
        <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-primary mb-4">Totales y Cálculos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 space-y-2 bg-blue-50 rounded-lg">
              <h4 className="font-bold text-blue-800">Sub-totales por Categoría</h4>
              {categories.map(cat => (
                <div key={cat} className="flex justify-between">
                  <span>{cat}:</span>
                  <span className="font-semibold">C$ {totals.subtotals[cat]?.toFixed(2) || '0.00'}</span>
                </div>
              ))}
            </div>
            <div className="p-4 space-y-2 bg-green-50 rounded-lg">
              <h4 className="font-bold text-green-800">Cálculos Finales</h4>
               <div className="flex justify-between font-bold text-lg border-b pb-2">
                  <span>TOTAL (Diezmo + Ordinaria):</span>
                  <span>C$ {totals.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Diezmo de Diezmo ({currentRecord.formulas.diezmoPercentage}%):</span>
                  <span className="font-semibold">C$ {totals.diezmoDeDiezmo.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                  <span>Remanente (Umbral C$ {currentRecord.formulas.remanenteThreshold.toFixed(2)}):</span>
                  <span className="font-semibold">C$ {totals.remanente.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                  <span>Gomer del Ministro:</span>
                  <span className="font-semibold">C$ {totals.gomerMinistro.toFixed(2)}</span>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumenFinancieroTab;
