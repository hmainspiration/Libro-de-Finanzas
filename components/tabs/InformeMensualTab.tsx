import React, { useState, useMemo, useEffect, FC } from 'react';
import { WeeklyRecord, Formulas, MonthlyReport } from '../../types';
import { MONTH_NAMES, initialMonthlyReportFormState } from '../../constants';
import { ArrowUpOnSquareIcon, TrashIcon, ArchiveBoxArrowDownIcon } from '@heroicons/react/24/outline';
import { supabase } from '../Lib/supabase'; // Ajusta la ruta según tu estructura

// ... (el resto de imports y componentes Accordion y CurrencyInput se mantienen igual)

interface InformeMensualTabProps {
    records: WeeklyRecord[];
    formulas: Formulas;
    savedReports: MonthlyReport[];
    setSavedReports: React.Dispatch<React.SetStateAction<MonthlyReport[]>>;
}

const InformeMensualTab: React.FC<InformeMensualTabProps> = ({ records, formulas, savedReports, setSavedReports }) => {
    const [formState, setFormState] = useState(initialMonthlyReportFormState);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);

    // Cargar informes desde Supabase al iniciar
    useEffect(() => {
        loadReportsFromSupabase();
    }, []);

    const loadReportsFromSupabase = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('monthly_reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error cargando informes desde Supabase:', error);
                return;
            }

            if (data && data.length > 0) {
                // Convertir los datos de Supabase al formato de la aplicación
                const supabaseReports: MonthlyReport[] = data.map(item => item.report_data);
                setSavedReports(supabaseReports);
            }
        } catch (error) {
            console.error('Error cargando informes:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveReportToSupabase = async (report: MonthlyReport) => {
        try {
            const reportData = {
                church_id: 'La Empresa', // O obtener del login
                month: report.month,
                year: report.year,
                report_data: report // Guardamos todo el objeto
            };

            const { data, error } = await supabase
                .from('monthly_reports')
                .upsert(reportData, { onConflict: 'report_data->id' });

            if (error) {
                console.error('Error guardando informe en Supabase:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error guardando informe:', error);
            return false;
        }
    };

    const deleteReportFromSupabase = async (reportId: string) => {
        try {
            const { error } = await supabase
                .from('monthly_reports')
                .delete()
                .eq('report_data->id', reportId);

            if (error) {
                console.error('Error eliminando informe de Supabase:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error eliminando informe:', error);
            return false;
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prevState => ({ ...prevState, [name]: value }));
    };

    // ... (las demás funciones getNumericValue, handleLoadData, calculations, formatCurrency, handleClearForm se mantienen igual)

    const handleSaveReport = async () => {
        const reportId = `report-${selectedYear}-${selectedMonth}`;
        const existingReportIndex = savedReports.findIndex(r => r.id === reportId);

        if (existingReportIndex > -1) {
            if (!window.confirm('Ya existe un informe para este mes. ¿Desea sobrescribirlo?')) {
                return;
            }
        }

        const newReport: MonthlyReport = {
            id: reportId,
            month: selectedMonth,
            year: selectedYear,
            formData: formState,
        };

        // Guardar en el estado local
        if (existingReportIndex > -1) {
            const updatedReports = [...savedReports];
            updatedReports[existingReportIndex] = newReport;
            setSavedReports(updatedReports);
        } else {
            setSavedReports(prev => [...prev, newReport]);
        }

        // Guardar en Supabase
        const success = await saveReportToSupabase(newReport);
        if (success) {
            console.log('Informe guardado en Supabase');
        }

        alert('Informe guardado exitosamente.');
    };

    const handleLoadReport = (report: MonthlyReport) => {
        const isDirty = JSON.stringify(formState) !== JSON.stringify(initialMonthlyReportFormState);
        if (isDirty && !window.confirm('¿Está seguro de que desea cargar este informe? Los datos actuales del formulario se perderán.')) {
            return;
        }
        setFormState(report.formData);
        setSelectedMonth(report.month);
        setSelectedYear(report.year);
        alert(`Informe de ${MONTH_NAMES[report.month - 1]} ${report.year} cargado.`);
    };

    const handleDeleteReport = async (reportId: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar este informe guardado?')) {
            // Eliminar del estado local
            setSavedReports(prev => prev.filter(r => r.id !== reportId));
            
            // Eliminar de Supabase
            const success = await deleteReportFromSupabase(reportId);
            if (success) {
                console.log('Informe eliminado de Supabase');
            }
        }
    };

    const sortedReports = useMemo(() => {
        return [...savedReports].sort((a, b) => {
            const dateA = new Date(a.year, a.month - 1);
            const dateB = new Date(b.year, b.month - 1);
            return dateB.getTime() - dateA.getTime();
        });
    }, [savedReports]);

    // ... (la función generatePdf se mantiene exactamente igual)

    return (
        <div className="space-y-6">
            <header className="text-center p-6 bg-white rounded-xl shadow-md">
                <h1 className="text-2xl md:text-3xl font-bold text-blue-800">MINISTERIO DE ADMINISTRACIÓN FINANCIERA</h1>
                <p className="text-lg md:text-xl text-gray-600">Información Financiera Mensual - Jurisdicción Nicaragua, C.A.</p>
            </header>

            <Accordion title="Informes Guardados">
                {loading ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto p-1">
                        {sortedReports.length > 0 ? (
                            sortedReports.map(report => (
                                <div key={report.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg border">
                                    <div>
                                        <p className="font-semibold text-primary">{MONTH_NAMES[report.month - 1]} {report.year}</p>
                                        <p className="text-xs text-gray-500">ID: {report.id}</p>
                                    </div>
                                    <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                                        <button onClick={() => handleLoadReport(report)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors">
                                            <ArrowUpOnSquareIcon className="w-4 h-4" />
                                            Cargar
                                        </button>
                                        <button onClick={() => handleDeleteReport(report.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-danger rounded-md hover:bg-red-600 transition-colors">
                                            <TrashIcon className="w-4 h-4" />
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-2">No hay informes guardados.</p>
                        )}
                    </div>
                )}
            </Accordion>

            {/* ... (el resto del JSX se mantiene EXACTAMENTE igual) */}
            
            <div className="p-6 bg-white rounded-xl shadow-lg space-y-4">
                <h3 className="text-xl font-bold text-primary">Cargar Datos del Sistema</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="reportMonth" className="block text-sm font-medium text-gray-700">Mes</label>
                        <select id="reportMonth" value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                            {MONTH_NAMES.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="reportYear" className="block text-sm font-medium text-gray-700">Año</label>
                        <input type="number" id="reportYear" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <button onClick={handleLoadData} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Cargar Datos del Mes
                    </button>
                </div>
                 <p className="text-xs text-gray-500 mt-2">Nota: Esto llenará automáticamente los campos del informe con los datos de las semanas registradas para el mes seleccionado. Los campos como "Primicias" o "Colectas Especiales" deben llenarse manualmente.</p>
            </div>

            {/* ... (todo el resto del formulario se mantiene EXACTAMENTE igual) */}
        </div>
    );
};

export default InformeMensualTab;
