import React, { useState, useMemo, FC } from 'react';
import { WeeklyRecord, Formulas, MonthlyReport } from '../../types';
import { MONTH_NAMES, initialMonthlyReportFormState } from '../../constants';
import { ArrowUpOnSquareIcon, TrashIcon, ArchiveBoxArrowDownIcon } from '@heroicons/react/24/outline';


interface InformeMensualTabProps {
    records: WeeklyRecord[];
    formulas: Formulas;
    savedReports: MonthlyReport[];
    setSavedReports: React.Dispatch<React.SetStateAction<MonthlyReport[]>>;
}

const Accordion: FC<{ title: string, children: React.ReactNode, initialOpen?: boolean }> = ({ title, children, initialOpen = false }) => {
    const [isOpen, setIsOpen] = useState(initialOpen);

    return (
        <div className="bg-white rounded-xl shadow-md">
            <button
                type="button"
                className="w-full p-5 text-left font-semibold text-lg flex justify-between items-center"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <span>{title}</span>
                <svg className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{ maxHeight: isOpen ? '2000px' : '0' }}
            >
                <div className="px-5 pb-5 pt-4 border-t">
                    {children}
                </div>
            </div>
        </div>
    );
};

const CurrencyInput: FC<{ id: string, placeholder: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ id, placeholder, value, onChange }) => (
    <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">C$</span>
        <input type="number" step="0.01" id={id} name={id} placeholder={placeholder} value={value} onChange={onChange} className="w-full p-2 border rounded-lg pl-10" />
    </div>
);


const InformeMensualTab: React.FC<InformeMensualTabProps> = ({ records, formulas, savedReports, setSavedReports }) => {
    const [formState, setFormState] = useState(initialMonthlyReportFormState);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prevState => ({ ...prevState, [name]: value }));
    };

    const getNumericValue = (key: keyof typeof initialMonthlyReportFormState) => parseFloat(formState[key]) || 0;

    const handleLoadData = () => {
        const filteredRecords = records.filter(r => r.month === selectedMonth && r.year === selectedYear);
        if (filteredRecords.length === 0) {
            alert(`No se encontraron registros para ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}.`);
            return;
        }

        const publicServiceCategories = ["Luz", "Agua"];
        let totalDiezmo = 0, totalOrdinaria = 0, totalServicios = 0, totalGomer = 0, totalDiezmoDeDiezmo = 0;

        filteredRecords.forEach(record => {
            let weeklyDiezmo = 0, weeklyOrdinaria = 0;
            record.donations.forEach(d => {
                if (d.category === "Diezmo") weeklyDiezmo += d.amount;
                if (d.category === "Ordinaria") weeklyOrdinaria += d.amount;
                if (publicServiceCategories.includes(d.category)) totalServicios += d.amount;
            });

            totalDiezmo += weeklyDiezmo;
            totalOrdinaria += weeklyOrdinaria;

            const weeklyTotal = weeklyDiezmo + weeklyOrdinaria;
            const weeklyDiezmoDeDiezmo = Math.round(weeklyTotal * (record.formulas.diezmoPercentage / 100));
            
            totalDiezmoDeDiezmo += weeklyDiezmoDeDiezmo;
            totalGomer += Math.round(weeklyTotal - weeklyDiezmoDeDiezmo);
        });

        setFormState(prev => ({
            ...prev,
            'clave-iglesia': 'NIMT02',
            'nombre-iglesia': 'La Empresa',
            'nombre-ministro': filteredRecords[0]?.minister || '',
            'mes-reporte': MONTH_NAMES[selectedMonth - 1],
            'ano-reporte': selectedYear.toString(),
            'ing-diezmos': totalDiezmo > 0 ? totalDiezmo.toFixed(2) : '',
            'ing-ofrendas-ordinarias': totalOrdinaria > 0 ? totalOrdinaria.toFixed(2) : '',
            'ing-servicios-publicos': totalServicios > 0 ? totalServicios.toFixed(2) : '',
            'egr-servicios-publicos': totalServicios > 0 ? totalServicios.toFixed(2) : '',
            'egr-gomer': totalGomer > 0 ? totalGomer.toFixed(2) : '',
            'dist-direccion': totalDiezmoDeDiezmo > 0 ? totalDiezmoDeDiezmo.toFixed(2) : '',
            'egr-asignacion': formulas.remanenteThreshold.toString(),
        }));
         alert(`Datos cargados para ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}.`);
    };

    const calculations = useMemo(() => {
        const ingOfrendas = ['ing-diezmos', 'ing-ofrendas-ordinarias', 'ing-primicias', 'ing-ayuda-encargado'].reduce((sum, key) => sum + getNumericValue(key as keyof typeof initialMonthlyReportFormState), 0);
        const ingEspeciales = ['ing-ceremonial', 'ing-ofrenda-especial-sdd', 'ing-evangelizacion', 'ing-santa-cena'].reduce((sum, key) => sum + getNumericValue(key as keyof typeof initialMonthlyReportFormState), 0);
        const ingLocales = [
            'ing-servicios-publicos', 'ing-arreglos-locales', 'ing-mantenimiento', 'ing-construccion-local',
            'ing-muebles', 'ing-viajes-ministro', 'ing-reuniones-ministeriales', 'ing-atencion-ministros',
            'ing-viajes-extranjero', 'ing-actividades-locales', 'ing-ciudad-lldm', 'ing-adquisicion-terreno'
        ].reduce((sum, key) => sum + getNumericValue(key as keyof typeof initialMonthlyReportFormState), 0);
        
        const totalIngresos = ingOfrendas + ingEspeciales + ingLocales;
        const saldoAnterior = getNumericValue('saldo-anterior');
        const totalDisponible = saldoAnterior + totalIngresos;

        const totalManutencion = getNumericValue('egr-asignacion') - getNumericValue('egr-gomer');
        const egrEspeciales = ['egr-ceremonial', 'egr-ofrenda-especial-sdd', 'egr-evangelizacion', 'egr-santa-cena'].reduce((sum, key) => sum + getNumericValue(key as keyof typeof initialMonthlyReportFormState), 0);
        const egrLocales = [
            'egr-servicios-publicos', 'egr-arreglos-locales', 'egr-mantenimiento', 'egr-traspaso-construccion',
            'egr-muebles', 'egr-viajes-ministro', 'egr-reuniones-ministeriales', 'egr-atencion-ministros',
            'egr-viajes-extranjero', 'egr-actividades-locales', 'egr-ciudad-lldm', 'egr-adquisicion-terreno'
        ].reduce((sum, key) => sum + getNumericValue(key as keyof typeof initialMonthlyReportFormState), 0);

        const totalSalidas = getNumericValue('egr-gomer') + egrEspeciales + egrLocales;
        const remanente = totalDisponible - totalSalidas;

        return {
            ingOfrendas, ingEspeciales, ingLocales, totalIngresos, saldoAnterior, totalDisponible,
            totalManutencion, egrEspeciales, egrLocales, totalSalidas, remanente
        };
    }, [formState]);

    const formatCurrency = (value: number) => `C$ ${value.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const handleClearForm = () => {
        if (window.confirm('¿Estás seguro de que quieres limpiar todos los campos?')) {
            setFormState(initialMonthlyReportFormState);
        }
    };
    
    const handleSaveReport = () => {
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

        if (existingReportIndex > -1) {
            const updatedReports = [...savedReports];
            updatedReports[existingReportIndex] = newReport;
            setSavedReports(updatedReports);
        } else {
            setSavedReports(prev => [...prev, newReport]);
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

    const handleDeleteReport = (reportId: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar este informe guardado?')) {
            setSavedReports(prev => prev.filter(r => r.id !== reportId));
        }
    };

    const sortedReports = useMemo(() => {
        return [...savedReports].sort((a, b) => {
            const dateA = new Date(a.year, a.month - 1);
            const dateB = new Date(b.year, b.month - 1);
            return dateB.getTime() - dateA.getTime();
        });
    }, [savedReports]);

    const generatePdf = () => {
        setIsGenerating(true);
        setTimeout(() => {
            try {
                const { jsPDF } = (window as any).jspdf;
                const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
                const pageW = doc.internal.pageSize.getWidth();
                const pageH = doc.internal.pageSize.getHeight();
                const margin = 10;
                let startY = margin;

                const getText = (key: keyof typeof initialMonthlyReportFormState) => formState[key] || '';
                const getValue = (key: keyof typeof initialMonthlyReportFormState) => formatCurrency(getNumericValue(key));
                
                // --- HEADER ---
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.text("IGLESIA DEL DIOS VIVO COLUMNA Y APOYO DE LA VERDAD", pageW / 2, startY + 5, { align: 'center' });
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text("La Luz del Mundo", pageW / 2, startY + 10, { align: 'center' });
                doc.setFontSize(10);
                doc.text("MINISTERIO DE ADMINISTRACIÓN FINANCIERA", pageW / 2, startY + 16, { align: 'center' });
                doc.setFont('helvetica', 'bold');
                doc.text("INFORMACIÓN FINANCIERA MENSUAL", pageW / 2, startY + 22, { align: 'center' });
                doc.setFont('helvetica', 'normal');
                doc.text(`Jurisdicción Nicaragua, C.A.`, pageW / 2, startY + 27, { align: 'center' });
                startY += 35;

                const bodyStyle = { fontSize: 8, cellPadding: 1, lineColor: '#000', lineWidth: 0.1 };
                const headStyle = { fontSize: 8, fontStyle: 'bold', fillColor: '#f0f0f0', textColor: '#333', halign: 'center', lineColor: '#000', lineWidth: 0.1 };
                const rightAlign = { halign: 'right' };
                const subheadStyle = { fontStyle: 'bold', fillColor: '#ffffff' };

                // --- DATOS INFORME ---
                doc.autoTable({
                    startY: startY,
                    body: [
                        [{ content: 'DATOS DE ESTE INFORME', colSpan: 4, styles: headStyle }],
                        ['DEL MES DE:', getText('mes-reporte'), 'DEL AÑO:', getText('ano-reporte')],
                        ['CLAVE IGLESIA:', getText('clave-iglesia'), 'NOMBRE IGLESIA:', getText('nombre-iglesia')],
                        ['DISTRITO:', getText('distrito'), 'DEPARTAMENTO:', getText('departamento')],
                        ['NOMBRE MINISTRO:', getText('nombre-ministro'), 'GRADO:', getText('grado-ministro')],
                        ['TELÉFONO:', getText('tel-ministro'), 'MIEMBROS ACTIVOS:', getText('miembros-activos')],
                    ],
                    theme: 'grid', styles: { ...bodyStyle, fontSize: 9, cellPadding: 1.5 }, columnStyles: { 0: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } }
                });
                startY = (doc as any).autoTable.previous.finalY + 3;

                // --- DETALLE DE INGRESOS Y EGRESOS ---
                const ingresosData = [
                    [{ content: 'Ingresos por Ofrendas', styles: subheadStyle }, ''],
                    ['Diezmos', { content: getValue('ing-diezmos'), styles: rightAlign }],
                    ['Ofrendas Ordinarias', { content: getValue('ing-ofrendas-ordinarias'), styles: rightAlign }],
                    ['Primicias', { content: getValue('ing-primicias'), styles: rightAlign }],
                    ['Ayuda al Encargado', { content: getValue('ing-ayuda-encargado'), styles: rightAlign }],
                    [{ content: 'Ingresos por Colectas Especiales', styles: subheadStyle }, ''],
                    ['Ceremonial', { content: getValue('ing-ceremonial'), styles: rightAlign }],
                    ['Ofrenda Especial SdD NJG', { content: getValue('ing-ofrenda-especial-sdd'), styles: rightAlign }],
                    ['Evangelización Mundial', { content: getValue('ing-evangelizacion'), styles: rightAlign }],
                    ['Colecta de Santa Cena', { content: getValue('ing-santa-cena'), styles: rightAlign }],
                    [{ content: 'Ingresos por Colectas Locales', styles: subheadStyle }, ''],
                    ['Pago de Servicios Públicos', { content: getValue('ing-servicios-publicos'), styles: rightAlign }],
                    ['Arreglos Locales', { content: getValue('ing-arreglos-locales'), styles: rightAlign }],
                    ['Mantenimiento y Conservación', { content: getValue('ing-mantenimiento'), styles: rightAlign }],
                    ['Construcción Local', { content: getValue('ing-construccion-local'), styles: rightAlign }],
                    ['Muebles y Artículos', { content: getValue('ing-muebles'), styles: rightAlign }],
                    ['Viajes y viáticos para Ministro', { content: getValue('ing-viajes-ministro'), styles: rightAlign }],
                    ['Reuniones Ministeriales', { content: getValue('ing-reuniones-ministeriales'), styles: rightAlign }],
                    ['Atención a Ministros', { content: getValue('ing-atencion-ministros'), styles: rightAlign }],
                    ['Viajes fuera del País', { content: getValue('ing-viajes-extranjero'), styles: rightAlign }],
                    ['Actividades Locales', { content: getValue('ing-actividades-locales'), styles: rightAlign }],
                    ['Ofrendas para Ciudad LLDM', { content: getValue('ing-ciudad-lldm'), styles: rightAlign }],
                    ['Adquisición Terreno/Edificio', { content: getValue('ing-adquisicion-terreno'), styles: rightAlign }],
                ];
                
                const egresosData = [
                    [{ content: 'Manutención del Ministro', styles: subheadStyle }, ''],
                    ['Asignación Autorizada', { content: getValue('egr-asignacion'), styles: rightAlign }],
                    ['Gomer del Mes', { content: getValue('egr-gomer'), styles: rightAlign }],
                    [{ content: 'Total Manutención (Asignación - Gomer)', styles: { fontStyle: 'bold' } }, { content: formatCurrency(calculations.totalManutencion), styles: { ...rightAlign, fontStyle: 'bold' } }],
                    [{ content: 'Egresos por Colectas Especiales', styles: subheadStyle }, ''],
                    ['Ceremonial', { content: getValue('egr-ceremonial'), styles: rightAlign }],
                    ['Ofrenda Especial SdD NJG', { content: getValue('egr-ofrenda-especial-sdd'), styles: rightAlign }],
                    ['Evangelización Mundial', { content: getValue('egr-evangelizacion'), styles: rightAlign }],
                    ['Colecta de Santa Cena', { content: getValue('egr-santa-cena'), styles: rightAlign }],
                    [{ content: 'Egresos por Colectas Locales', styles: subheadStyle }, ''],
                    ['Pago de Servicios Públicos', { content: getValue('egr-servicios-publicos'), styles: rightAlign }],
                    ['Arreglos Locales', { content: getValue('egr-arreglos-locales'), styles: rightAlign }],
                    ['Mantenimiento y Conservación', { content: getValue('egr-mantenimiento'), styles: rightAlign }],
                    ['Traspaso para Construcción Local', { content: getValue('egr-traspaso-construccion'), styles: rightAlign }],
                    ['Muebles y Artículos', { content: getValue('egr-muebles'), styles: rightAlign }],
                    ['Viajes y viáticos para Ministro', { content: getValue('egr-viajes-ministro'), styles: rightAlign }],
                    ['Reuniones Ministeriales', { content: getValue('egr-reuniones-ministeriales'), styles: rightAlign }],
                    ['Atención a Ministros', { content: getValue('egr-atencion-ministros'), styles: rightAlign }],
                    ['Viajes fuera del País', { content: getValue('egr-viajes-extranjero'), styles: rightAlign }],
                    ['Actividades Locales', { content: getValue('egr-actividades-locales'), styles: rightAlign }],
                    ['Ofrendas para Ciudad LLDM', { content: getValue('egr-ciudad-lldm'), styles: rightAlign }],
                    ['Adquisición Terreno/Edificio', { content: getValue('egr-adquisicion-terreno'), styles: rightAlign }],
                ];
                
                const tableConfig = { theme: 'grid', styles: bodyStyle, headStyles: headStyle };
                
                const tableStartY = startY;
                let finalYIngresos, finalYEgresos;

                doc.autoTable({
                    head: [['ENTRADAS (INGRESOS)', '']],
                    body: ingresosData,
                    startY: tableStartY,
                    ...tableConfig,
                    tableWidth: (pageW / 2) - margin - 1,
                    margin: { left: margin },
                });
                finalYIngresos = (doc as any).autoTable.previous.finalY;
                
                doc.autoTable({
                    head: [['SALIDAS (EGRESOS)', '']],
                    body: egresosData,
                    startY: tableStartY,
                    ...tableConfig,
                    tableWidth: (pageW / 2) - margin - 1,
                    margin: { left: pageW / 2 + 1 },
                });
                finalYEgresos = (doc as any).autoTable.previous.finalY;
                
                startY = Math.max(finalYIngresos, finalYEgresos) + 3;

                // --- RESUMEN ---
                const resumenData = [
                    ['Saldo Inicial del Mes', { content: formatCurrency(calculations.saldoAnterior), styles: rightAlign }],
                    ['Total Ingresos del Mes', { content: formatCurrency(calculations.totalIngresos), styles: rightAlign }],
                    [{ content: 'Total Disponible del Mes', styles: { fontStyle: 'bold' } }, { content: formatCurrency(calculations.totalDisponible), styles: { ...rightAlign, fontStyle: 'bold' } }],
                    ['Total Salidas del Mes', { content: formatCurrency(calculations.totalSalidas), styles: rightAlign }],
                    [{ content: 'Utilidad o Remanente', styles: { fontStyle: 'bold', fillColor: '#e0e7ff' } }, { content: formatCurrency(calculations.remanente), styles: { ...rightAlign, fontStyle: 'bold', fillColor: '#e0e7ff' } }],
                ];
                
                const distribucionData = [
                    ['Dirección General (Diezmos de Diezmos)', { content: getValue('dist-direccion'), styles: rightAlign }],
                    ['Tesorería (Cuenta de Remanentes)', { content: getValue('dist-tesoreria'), styles: rightAlign }],
                    ['Pro-Construcción', { content: getValue('dist-pro-construccion'), styles: rightAlign }],
                    ['Otros', { content: getValue('dist-otros'), styles: rightAlign }],
                ];

                if (startY > pageH - 65) { // Check if there's enough space for summary, if not, new page
                    doc.addPage();
                    startY = margin;
                }
                
                const summaryTableStartY = startY;
                let finalYResumen, finalYDistribucion;

                doc.autoTable({
                    head: [['RESUMEN Y CIERRE', '']],
                    body: resumenData,
                    startY: summaryTableStartY, 
                    ...tableConfig,
                    tableWidth: (pageW / 2) - margin - 1,
                    margin: { left: margin },
                });
                finalYResumen = (doc as any).autoTable.previous.finalY;

                doc.autoTable({
                    head: [['SALDO DEL REMANENTE DISTRIBUIDO A:', '']],
                    body: distribucionData,
                    startY: summaryTableStartY, 
                    ...tableConfig,
                    tableWidth: (pageW / 2) - margin - 1,
                    margin: { left: pageW / 2 + 1 },
                });
                finalYDistribucion = (doc as any).autoTable.previous.finalY;
                
                startY = Math.max(finalYResumen, finalYDistribucion) + 10;
                
                // --- FIRMAS ---
                if (startY > pageH - 55) { // Check for space for signatures
                    doc.addPage();
                    startY = margin;
                }

                doc.autoTable({
                    startY,
                    body: [
                        [{ content: 'Comisión Local de Finanzas:', colSpan: 3, styles: { fontStyle: 'bold', halign: 'center' } }],
                        ['\n\n_________________________', '\n\n_________________________', '\n\n_________________________'],
                        [getText('comision-nombre-1') || 'Firma 1', getText('comision-nombre-2') || 'Firma 2', getText('comision-nombre-3') || 'Firma 3'],
                        [{ content: '', colSpan: 3, styles: { cellPadding: 4 } }], // spacer
                        ['\n\n_________________________', '\n\n_________________________', ''],
                        [`Firma Ministro: ${getText('nombre-ministro')}`, `Firma Tesorero(a) Local`, ''],
                    ],
                    theme: 'plain',
                    styles: { fontSize: 9, halign: 'center' }
                });

                doc.save(`Informe_Financiero_${getText('mes-reporte') || 'Mes'}_${getText('ano-reporte') || 'Año'}.pdf`);

            } catch (error) {
                console.error("Error generating PDF:", error);
                alert("Hubo un error al generar el PDF. Revisa la consola para más detalles.");
            } finally {
                setIsGenerating(false);
            }
        }, 500);
    };

    return (
        <div className="space-y-6">
            <header className="text-center p-6 bg-white rounded-xl shadow-md">
                <h1 className="text-2xl md:text-3xl font-bold text-blue-800">MINISTERIO DE ADMINISTRACIÓN FINANCIERA</h1>
                <p className="text-lg md:text-xl text-gray-600">Información Financiera Mensual - Jurisdicción Nicaragua, C.A.</p>
            </header>

            <Accordion title="Informes Guardados">
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
            </Accordion>

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

            <form id="financial-form" className="space-y-4">
                <Accordion title="1. Información General del Reporte" initialOpen>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <input type="text" id="clave-iglesia" name="clave-iglesia" value={formState['clave-iglesia']} onChange={handleChange} placeholder="Clave Iglesia" className="w-full p-3 border rounded-lg" />
                            <input type="text" id="nombre-iglesia" name="nombre-iglesia" value={formState['nombre-iglesia']} onChange={handleChange} placeholder="Nombre Iglesia Local" className="w-full p-3 border rounded-lg" />
                            <input type="text" id="distrito" name="distrito" value={formState.distrito} onChange={handleChange} placeholder="Distrito" className="w-full p-3 border rounded-lg" />
                            <input type="text" id="departamento" name="departamento" value={formState.departamento} onChange={handleChange} placeholder="Departamento" className="w-full p-3 border rounded-lg" />
                            <input type="number" id="miembros-activos" name="miembros-activos" value={formState['miembros-activos']} onChange={handleChange} placeholder="Miembros Económicamente Activos" className="w-full p-3 border rounded-lg" />
                        </div>
                        <div className="space-y-4">
                            <input type="text" id="mes-reporte" name="mes-reporte" value={formState['mes-reporte']} onChange={handleChange} placeholder="Mes del Reporte (e.g., Junio)" className="w-full p-3 border rounded-lg" />
                            <input type="number" id="ano-reporte" name="ano-reporte" value={formState['ano-reporte']} onChange={handleChange} placeholder="Año del Reporte (e.g., 2024)" className="w-full p-3 border rounded-lg" />
                            <input type="text" id="nombre-ministro" name="nombre-ministro" value={formState['nombre-ministro']} onChange={handleChange} placeholder="Nombre del Ministro" className="w-full p-3 border rounded-lg" />
                            <input type="text" id="grado-ministro" name="grado-ministro" value={formState['grado-ministro']} onChange={handleChange} placeholder="Grado del Ministro" className="w-full p-3 border rounded-lg" />
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">+505</span>
                                <input type="tel" id="tel-ministro" name="tel-ministro" value={formState['tel-ministro']} onChange={handleChange} placeholder="Teléfono / Celular" className="w-full p-3 border rounded-lg pl-14" />
                            </div>
                        </div>
                    </div>
                </Accordion>

                <Accordion title="2. Entradas (Ingresos)">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="md:col-span-2">
                            <label className="font-medium text-gray-700">Saldo del Mes Anterior</label>
                            <div className="relative mt-1">
                                <CurrencyInput id="saldo-anterior" placeholder="0.00" value={formState['saldo-anterior']} onChange={handleChange} />
                            </div>
                        </div>
                        <fieldset className="border rounded-lg p-4 space-y-3">
                            <legend className="font-semibold px-2">2.1 Ingresos por Ofrendas</legend>
                            <CurrencyInput id="ing-diezmos" placeholder="Diezmos" value={formState['ing-diezmos']} onChange={handleChange} />
                            <CurrencyInput id="ing-ofrendas-ordinarias" placeholder="Ofrendas Ordinarias" value={formState['ing-ofrendas-ordinarias']} onChange={handleChange} />
                            <CurrencyInput id="ing-primicias" placeholder="Primicias" value={formState['ing-primicias']} onChange={handleChange} />
                            <CurrencyInput id="ing-ayuda-encargado" placeholder="Ayuda al Encargado" value={formState['ing-ayuda-encargado']} onChange={handleChange} />
                            <div className="p-2 bg-gray-100 rounded-lg text-right font-bold">Total Ofrendas: <span>{formatCurrency(calculations.ingOfrendas)}</span></div>
                        </fieldset>
                        <fieldset className="border rounded-lg p-4 space-y-3">
                            <legend className="font-semibold px-2">2.2 Ingresos por Colectas Especiales</legend>
                            <CurrencyInput id="ing-ceremonial" placeholder="Ceremonial" value={formState['ing-ceremonial']} onChange={handleChange} />
                            <CurrencyInput id="ing-ofrenda-especial-sdd" placeholder="Ofrenda Especial SdD NJG" value={formState['ing-ofrenda-especial-sdd']} onChange={handleChange} />
                            <CurrencyInput id="ing-evangelizacion" placeholder="Evangelización Mundial" value={formState['ing-evangelizacion']} onChange={handleChange} />
                            <CurrencyInput id="ing-santa-cena" placeholder="Colecta de Santa Cena" value={formState['ing-santa-cena']} onChange={handleChange} />
                            <div className="p-2 bg-gray-100 rounded-lg text-right font-bold">Total Colectas Esp.: <span>{formatCurrency(calculations.ingEspeciales)}</span></div>
                        </fieldset>
                        <fieldset className="md:col-span-2 border rounded-lg p-4 space-y-3">
                             <legend className="font-semibold px-2">2.3 Ingresos por Colectas Locales</legend>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <CurrencyInput id="ing-servicios-publicos" placeholder="Pago de Servicios Públicos" value={formState['ing-servicios-publicos']} onChange={handleChange} />
                                <CurrencyInput id="ing-arreglos-locales" placeholder="Arreglos Locales" value={formState['ing-arreglos-locales']} onChange={handleChange} />
                                <CurrencyInput id="ing-mantenimiento" placeholder="Mantenimiento y Conservación" value={formState['ing-mantenimiento']} onChange={handleChange} />
                                <CurrencyInput id="ing-construccion-local" placeholder="Construcción Local" value={formState['ing-construccion-local']} onChange={handleChange} />
                                <CurrencyInput id="ing-muebles" placeholder="Muebles y Artículos" value={formState['ing-muebles']} onChange={handleChange} />
                                <CurrencyInput id="ing-viajes-ministro" placeholder="Viajes y viáticos para Ministro" value={formState['ing-viajes-ministro']} onChange={handleChange} />
                                <CurrencyInput id="ing-reuniones-ministeriales" placeholder="Reuniones Ministeriales" value={formState['ing-reuniones-ministeriales']} onChange={handleChange} />
                                <CurrencyInput id="ing-atencion-ministros" placeholder="Atención a Ministros" value={formState['ing-atencion-ministros']} onChange={handleChange} />
                                <CurrencyInput id="ing-viajes-extranjero" placeholder="Viajes fuera del País" value={formState['ing-viajes-extranjero']} onChange={handleChange} />
                                <CurrencyInput id="ing-actividades-locales" placeholder="Actividades Locales" value={formState['ing-actividades-locales']} onChange={handleChange} />
                                <CurrencyInput id="ing-ciudad-lldm" placeholder="Ofrendas para Ciudad LLDM" value={formState['ing-ciudad-lldm']} onChange={handleChange} />
                                <CurrencyInput id="ing-adquisicion-terreno" placeholder="Adquisición Terreno/Edificio" value={formState['ing-adquisicion-terreno']} onChange={handleChange} />
                             </div>
                             <div className="p-2 bg-gray-100 rounded-lg text-right font-bold">Total Colectas Locales: <span>{formatCurrency(calculations.ingLocales)}</span></div>
                        </fieldset>
                    </div>
                </Accordion>

                <Accordion title="3. Salidas (Egresos)">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <fieldset className="border rounded-lg p-4 space-y-3">
                            <legend className="font-semibold px-2">3.1 Gastos por Manutención del Ministro</legend>
                            <CurrencyInput id="egr-asignacion" placeholder="Asignación Autorizada" value={formState['egr-asignacion']} onChange={handleChange} />
                            <CurrencyInput id="egr-gomer" placeholder="Gomer del Mes" value={formState['egr-gomer']} onChange={handleChange} />
                            <div className="p-2 bg-gray-100 rounded-lg text-right font-bold">Total Manutención: <span>{formatCurrency(calculations.totalManutencion)}</span></div>
                        </fieldset>
                        <fieldset className="border rounded-lg p-4 space-y-3">
                            <legend className="font-semibold px-2">3.2 Egresos por Colectas Especiales</legend>
                            <CurrencyInput id="egr-ceremonial" placeholder="Ceremonial" value={formState['egr-ceremonial']} onChange={handleChange} />
                            <CurrencyInput id="egr-ofrenda-especial-sdd" placeholder="Ofrenda Especial SdD NJG" value={formState['egr-ofrenda-especial-sdd']} onChange={handleChange} />
                            <CurrencyInput id="egr-evangelizacion" placeholder="Evangelización Mundial" value={formState['egr-evangelizacion']} onChange={handleChange} />
                            <CurrencyInput id="egr-santa-cena" placeholder="Colecta de Santa Cena" value={formState['egr-santa-cena']} onChange={handleChange} />
                            <div className="p-2 bg-gray-100 rounded-lg text-right font-bold">Total Colectas Esp.: <span>{formatCurrency(calculations.egrEspeciales)}</span></div>
                        </fieldset>
                        <fieldset className="md:col-span-2 border rounded-lg p-4 space-y-3">
                             <legend className="font-semibold px-2">3.3 Egresos por Colectas Locales</legend>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <CurrencyInput id="egr-servicios-publicos" placeholder="Pago de Servicios Públicos" value={formState['egr-servicios-publicos']} onChange={handleChange} />
                                <CurrencyInput id="egr-arreglos-locales" placeholder="Arreglos Locales" value={formState['egr-arreglos-locales']} onChange={handleChange} />
                                <CurrencyInput id="egr-mantenimiento" placeholder="Mantenimiento y Conservación" value={formState['egr-mantenimiento']} onChange={handleChange} />
                                <CurrencyInput id="egr-traspaso-construccion" placeholder="Traspaso para Construcción Local" value={formState['egr-traspaso-construccion']} onChange={handleChange} />
                                <CurrencyInput id="egr-muebles" placeholder="Muebles y Artículos" value={formState['egr-muebles']} onChange={handleChange} />
                                <CurrencyInput id="egr-viajes-ministro" placeholder="Viajes y viáticos para Ministro" value={formState['egr-viajes-ministro']} onChange={handleChange} />
                                <CurrencyInput id="egr-reuniones-ministeriales" placeholder="Reuniones Ministeriales" value={formState['egr-reuniones-ministeriales']} onChange={handleChange} />
                                <CurrencyInput id="egr-atencion-ministros" placeholder="Atención a Ministros" value={formState['egr-atencion-ministros']} onChange={handleChange} />
                                <CurrencyInput id="egr-viajes-extranjero" placeholder="Viajes fuera del País" value={formState['egr-viajes-extranjero']} onChange={handleChange} />
                                <CurrencyInput id="egr-actividades-locales" placeholder="Actividades Locales" value={formState['egr-actividades-locales']} onChange={handleChange} />
                                <CurrencyInput id="egr-ciudad-lldm" placeholder="Ofrendas para Ciudad LLDM" value={formState['egr-ciudad-lldm']} onChange={handleChange} />
                                <CurrencyInput id="egr-adquisicion-terreno" placeholder="Adquisición Terreno/Edificio" value={formState['egr-adquisicion-terreno']} onChange={handleChange} />
                             </div>
                             <div className="p-2 bg-gray-100 rounded-lg text-right font-bold">Total Colectas Locales: <span>{formatCurrency(calculations.egrLocales)}</span></div>
                        </fieldset>
                    </div>
                </Accordion>
                
                <Accordion title="4. Resumen y Cierre">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                            <h3 className="font-bold text-lg text-blue-800">Resumen Flujo de Efectivo</h3>
                            <div className="flex justify-between"><span>Saldo Inicial del Mes:</span> <span className="font-semibold">{formatCurrency(calculations.saldoAnterior)}</span></div>
                            <div className="flex justify-between"><span>Total Ingresos del Mes:</span> <span className="font-semibold">{formatCurrency(calculations.totalIngresos)}</span></div>
                            <hr />
                            <div className="flex justify-between font-bold"><span>Total Disponible del Mes:</span> <span className="text-green-600">{formatCurrency(calculations.totalDisponible)}</span></div>
                            <div className="flex justify-between"><span>Total Salidas del Mes:</span> <span className="font-semibold text-red-600">{formatCurrency(calculations.totalSalidas)}</span></div>
                            <hr />
                            <div className="flex justify-between font-bold text-xl"><span>Utilidad o Remanente:</span> <span className="text-blue-800">{formatCurrency(calculations.remanente)}</span></div>
                        </div>
                        <div className="space-y-3 bg-green-50 p-4 rounded-lg">
                            <h3 className="font-bold text-lg text-green-800">Saldo del Remanente Distribuido A:</h3>
                             <CurrencyInput id="dist-direccion" placeholder="Dirección General (Diezmos de Diezmos)" value={formState['dist-direccion']} onChange={handleChange} />
                            <CurrencyInput id="dist-tesoreria" placeholder="Tesorería (Cuenta de Remanentes)" value={formState['dist-tesoreria']} onChange={handleChange} />
                            <CurrencyInput id="dist-pro-construccion" placeholder="Pro-Construcción" value={formState['dist-pro-construccion']} onChange={handleChange} />
                            <CurrencyInput id="dist-otros" placeholder="Otros (Especificar en PDF)" value={formState['dist-otros']} onChange={handleChange} />
                        </div>
                        <div className="md:col-span-2 space-y-3 bg-gray-50 p-4 rounded-lg">
                             <h3 className="font-bold text-lg text-gray-800">Comisión Local de Finanzas</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input type="text" id="comision-nombre-1" name="comision-nombre-1" placeholder="Nombre 1" value={formState['comision-nombre-1']} onChange={handleChange} className="w-full p-2 border rounded" />
                                <input type="text" id="comision-nombre-2" name="comision-nombre-2" placeholder="Nombre 2" value={formState['comision-nombre-2']} onChange={handleChange} className="w-full p-2 border rounded" />
                                <input type="text" id="comision-nombre-3" name="comision-nombre-3" placeholder="Nombre 3" value={formState['comision-nombre-3']} onChange={handleChange} className="w-full p-2 border rounded" />
                             </div>
                        </div>
                    </div>
                </Accordion>
                
                <div className="flex flex-col md:flex-row gap-4 pt-4">
                    <button type="button" onClick={handleClearForm} className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">Limpiar Formulario</button>
                    <button type="button" onClick={handleSaveReport} className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
                        <ArchiveBoxArrowDownIcon className="w-5 h-5"/>
                        <span>Guardar Informe</span>
                    </button>
                    <button type="button" onClick={generatePdf} disabled={isGenerating} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex-grow flex items-center justify-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed">
                        <span>{isGenerating ? 'Generando...' : 'Generar Reporte en PDF'}</span>
                        {isGenerating && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InformeMensualTab;