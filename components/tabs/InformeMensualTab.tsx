import React, { useState, useMemo, useEffect } from 'react';
import { WeeklyRecord, Formulas, MonthlyReport, MonthlyReportFormState, ChurchInfo } from '../../types';
import { MONTH_NAMES, initialMonthlyReportFormState } from '../../constants';
import { useDrive } from '../../context/GoogleDriveContext';
import { ArrowDownTrayIcon, TrashIcon, CalculatorIcon } from '@heroicons/react/24/outline';

interface InformeMensualTabProps {
    records: WeeklyRecord[];
    formulas: Formulas;
    savedReports: MonthlyReport[];
    setSavedReports: React.Dispatch<React.SetStateAction<MonthlyReport[]>>;
    churchInfo: ChurchInfo;
}

const FormField: React.FC<{ label: string; name: keyof MonthlyReportFormState; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; readOnly?: boolean; }> = 
({ label, name, value, onChange, type = 'text', readOnly = false }) => (
    <div>
        <label htmlFor={name} className={`block text-sm font-medium ${readOnly ? 'text-gray-500' : 'text-gray-700'}`}>{label}</label>
        <input 
            type={type} 
            id={name} 
            name={name} 
            value={value} 
            onChange={onChange} 
            readOnly={readOnly}
            className={`mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm ${readOnly ? 'bg-gray-100' : ''}`}
        />
    </div>
);

const InformeMensualTab: React.FC<InformeMensualTabProps> = ({
    records,
    formulas,
    savedReports,
    setSavedReports,
    churchInfo,
}) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [formData, setFormData] = useState<MonthlyReportFormState>(initialMonthlyReportFormState);
    const [isProcessing, setIsProcessing] = useState(false);
    const drive = useDrive();

    // FIX: Moved formatCurrency to component scope to be accessible throughout the component.
    const formatCurrency = (val: string | number) => `C$ ${ (parseFloat(String(val)) || 0).toFixed(2) }`;

    const calculatedData = useMemo(() => {
        const monthlyRecords = records.filter(r => r.month === selectedMonth && r.year === selectedYear);
        if (monthlyRecords.length === 0) return null;

        const newFormData: Partial<MonthlyReportFormState> = {};
        
        const subtotals: Record<string, number> = {};
        // FIX: The original logic for calculating subtotals was complex and caused a type error.
        // It has been replaced with a simpler, more robust method that initializes and calculates in a single pass.
        monthlyRecords.forEach(record => {
            record.donations.forEach(donation => {
                subtotals[donation.category] = (subtotals[donation.category] || 0) + donation.amount;
            });
        });

        const activeMembers = new Set<string>();
        monthlyRecords.forEach(record => {
            record.donations.forEach(donation => {
                if (!donation.memberName.includes('(')) {
                    activeMembers.add(donation.memberName);
                }
            });
        });
        newFormData['miembros-activos'] = activeMembers.size.toString();
        
        // Asignación de ingresos a los campos correspondientes
        newFormData['ing-diezmos'] = (subtotals['Diezmo'] || 0).toFixed(2);
        newFormData['ing-ofrendas-ordinarias'] = (subtotals['Ordinaria'] || 0).toFixed(2);
        newFormData['ing-primicias'] = (subtotals['Primicias'] || 0).toFixed(2);
        newFormData['ing-ceremonial'] = (subtotals['Ceremonial'] || 0).toFixed(2);

        const totalDiezmosYOrdinarias = (subtotals['Diezmo'] || 0) + (subtotals['Ordinaria'] || 0);

        let totalDiezmoDeDiezmo = 0;
        monthlyRecords.forEach(record => {
            const weeklyTotal = record.donations
                .filter(d => d.category === 'Diezmo' || d.category === 'Ordinaria')
                .reduce((sum, d) => sum + d.amount, 0);
            totalDiezmoDeDiezmo += Math.round(weeklyTotal * (record.formulas.diezmoPercentage / 100));
        });

        const gomerMinistro = totalDiezmosYOrdinarias - totalDiezmoDeDiezmo;

        newFormData['egr-gomer'] = gomerMinistro.toFixed(2);
        newFormData['egr-ceremonial'] = (subtotals['Ceremonial'] || 0).toFixed(2);
        newFormData['dist-tesoreria'] = totalDiezmoDeDiezmo.toFixed(2);
        
        return newFormData;
    }, [records, selectedMonth, selectedYear, formulas]);
    
    // Cálculos de resumen en tiempo real
    const summaryCalculations = useMemo(() => {
        const parse = (val: string | number) => parseFloat(String(val)) || 0;

        const totalIngresos = 
            parse(formData['ing-diezmos']) + parse(formData['ing-ofrendas-ordinarias']) + 
            parse(formData['ing-primicias']) + parse(formData['ing-ayuda-encargado']) +
            parse(formData['ing-ceremonial']) + parse(formData['ing-ofrenda-especial-sdd']) +
            parse(formData['ing-evangelizacion']) + parse(formData['ing-santa-cena']) +
            parse(formData['ing-servicios-publicos']) + parse(formData['ing-arreglos-locales']) +
            parse(formData['ing-mantenimiento']) + parse(formData['ing-construccion-local']) +
            parse(formData['ing-muebles']) + parse(formData['ing-viajes-ministro']) +
            parse(formData['ing-reuniones-ministeriales']) + parse(formData['ing-atencion-ministros']) +
            parse(formData['ing-viajes-extranjero']) + parse(formData['ing-actividades-locales']) +
            parse(formData['ing-ciudad-lldm']) + parse(formData['ing-adquisicion-terreno']);
        
        const totalManutencion = parse(formData['egr-asignacion']) + parse(formData['egr-gomer']);

        const totalSalidas = 
            totalManutencion +
            parse(formData['egr-ceremonial']) + parse(formData['egr-ofrenda-especial-sdd']) +
            parse(formData['egr-evangelizacion']) + parse(formData['egr-santa-cena']) +
            parse(formData['egr-servicios-publicos']) + parse(formData['egr-arreglos-locales']) +
            parse(formData['egr-mantenimiento']) + parse(formData['egr-traspaso-construccion']) +
            parse(formData['egr-muebles']) + parse(formData['egr-viajes-ministro']) +
            parse(formData['egr-reuniones-ministeriales']) + parse(formData['egr-atencion-ministros']) +
            parse(formData['egr-viajes-extranjero']) + parse(formData['egr-actividades-locales']) +
            parse(formData['egr-ciudad-lldm']) + parse(formData['egr-adquisicion-terreno']);

        const totalDisponible = parse(formData['saldo-anterior']) + totalIngresos;
        const utilidadRemanente = totalDisponible - totalSalidas;
        
        return {
            totalIngresos,
            totalSalidas,
            totalDisponible,
            utilidadRemanente,
            totalManutencion
        };
    }, [formData]);


    useEffect(() => {
        const reportId = `report-${selectedYear}-${selectedMonth}`;
        const existingReport = savedReports.find(r => r.id === reportId);
        if (existingReport) {
            setFormData(existingReport.formData);
        } else {
            setFormData({
                ...initialMonthlyReportFormState,
                'mes-reporte': MONTH_NAMES[selectedMonth - 1],
                'ano-reporte': selectedYear.toString(),
                'clave-iglesia': 'NIMT02', // Valor por defecto
                'nombre-iglesia': 'La Empresa', // Valor por defecto
                'nombre-ministro': churchInfo.defaultMinister,
                'grado-ministro': churchInfo.ministerGrade,
                'distrito': churchInfo.district,
                'departamento': churchInfo.department,
                'tel-ministro': churchInfo.ministerPhone,
            });
        }
    }, [selectedMonth, selectedYear, savedReports, churchInfo]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name as keyof MonthlyReportFormState]: value,
        }));
    };
    
    const handlePrefill = () => {
        if (calculatedData) {
            setFormData(prev => ({
                ...prev,
                ...calculatedData,
            }));
            alert('Formulario actualizado con los datos calculados del mes.');
        } else {
            alert('No hay registros de ofrendas para el mes seleccionado.');
        }
    };

    const handleSaveReport = () => {
        const reportId = `report-${selectedYear}-${selectedMonth}`;
        const newReport: MonthlyReport = { id: reportId, month: selectedMonth, year: selectedYear, formData };
        setSavedReports(prev => {
            const existingIndex = prev.findIndex(r => r.id === reportId);
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = newReport;
                return updated;
            }
            return [...prev, newReport].sort((a,b) => new Date(b.year, b.month-1).getTime() - new Date(a.year, a.month-1).getTime());
        });
        alert('Reporte guardado localmente.');
    };

    const handleDeleteReport = (reportId: string) => {
        if (window.confirm("¿Está seguro de que desea eliminar este informe guardado?")) {
            setSavedReports(prev => prev.filter(r => r.id !== reportId));
        }
    };

    const handleExportAndUpload = async () => {
        setIsProcessing(true);
        try {
            const { jsPDF } = (window as any).jspdf;
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            
            const centeredText = (text: string, y: number, size: number, style: 'normal' | 'bold' = 'normal') => {
                doc.setFontSize(size);
                doc.setFont('helvetica', style);
                const textWidth = doc.getStringUnitWidth(text) * doc.internal.getFontSize() / doc.internal.scaleFactor;
                const textOffset = (doc.internal.pageSize.getWidth() - textWidth) / 2;
                doc.text(text, textOffset, y);
            };

            // === PDF HEADER ===
            centeredText("IGLESIA DEL DIOS VIVO COLUMNA Y APOYO DE LA VERDAD", 15, 12, 'bold');
            centeredText("La Luz del Mundo", 20, 10);
            centeredText("MINISTERIO DE ADMINISTRACIÓN FINANCIERA", 25, 11, 'bold');
            centeredText("INFORMACIÓN FINANCIERA MENSUAL", 30, 12, 'bold');
            centeredText("Jurisdicción Nicaragua, C.A.", 35, 10);

            // === DATOS DE ESTE INFORME ===
            (doc as any).autoTable({
                startY: 40,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 1.5 },
                headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: 'bold', halign: 'center' },
                columnStyles: { 0: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } },
                body: [
                    [{ content: 'DATOS DE ESTE INFORME', colSpan: 4, styles: { halign: 'center' } }],
                    ['DEL MES DE:', formData['mes-reporte'], 'DEL AÑO:', formData['ano-reporte']],
                    ['CLAVE IGLESIA:', formData['clave-iglesia'], 'NOMBRE IGLESIA:', formData['nombre-iglesia']],
                    ['DISTRITO:', formData['distrito'], 'DEPARTAMENTO:', formData['departamento']],
                    ['NOMBRE MINISTRO:', formData['nombre-ministro'], 'GRADO:', formData['grado-ministro']],
                    ['TELÉFONO:', formData['tel-ministro'], 'MIEMBROS ACTIVOS:', formData['miembros-activos']],
                ],
            });

            // === ENTRADAS Y SALIDAS ===
            
            const mainBody = [
                // Entradas
                [{ content: 'ENTRADAS (INGRESOS)', styles: { fontStyle: 'bold', halign: 'left', fillColor: [230, 230, 230] } }, '', { content: 'SALIDAS (EGRESOS)', styles: { fontStyle: 'bold', halign: 'left', fillColor: [230, 230, 230] } }, ''],
                [{ content: 'Ingresos por Ofrendas', colSpan: 2, styles: { fontStyle: 'bold' } }, { content: 'Manutención del Ministro', colSpan: 2, styles: { fontStyle: 'bold' } }],
                ['Diezmos', formatCurrency(formData['ing-diezmos']), 'Asignación Autorizada', formatCurrency(formData['egr-asignacion'])],
                ['Ofrendas Ordinarias', formatCurrency(formData['ing-ofrendas-ordinarias']), 'Gomer del Mes', formatCurrency(formData['egr-gomer'])],
                ['Primicias', formatCurrency(formData['ing-primicias']), { content: 'Total Manutención (Asignación - Gomer)', styles: { fontStyle: 'bold' } }, { content: formatCurrency(summaryCalculations.totalManutencion), styles: { fontStyle: 'bold' } }],
                ['Ayuda al Encargado', formatCurrency(formData['ing-ayuda-encargado']), '', ''],
                [{ content: 'Ingresos por Colectas Especiales', colSpan: 2, styles: { fontStyle: 'bold' } }, { content: 'Egresos por Colectas Especiales', colSpan: 2, styles: { fontStyle: 'bold' } }],
                ['Ceremonial', formatCurrency(formData['ing-ceremonial']), 'Ceremonial', formatCurrency(formData['egr-ceremonial'])],
                ['Ofrenda Especial SdD NJG', formatCurrency(formData['ing-ofrenda-especial-sdd']), 'Ofrenda Especial SdD NJG', formatCurrency(formData['egr-ofrenda-especial-sdd'])],
                ['Evangelización Mundial', formatCurrency(formData['ing-evangelizacion']), 'Evangelización Mundial', formatCurrency(formData['egr-evangelizacion'])],
                ['Colecta de Santa Cena', formatCurrency(formData['ing-santa-cena']), 'Colecta de Santa Cena', formatCurrency(formData['egr-santa-cena'])],
                [{ content: 'Ingresos por Colectas Locales', colSpan: 2, styles: { fontStyle: 'bold' } }, { content: 'Egresos por Colectas Locales', colSpan: 2, styles: { fontStyle: 'bold' } }],
                ['Pago de Servicios Públicos', formatCurrency(formData['ing-servicios-publicos']), 'Pago de Servicios Públicos', formatCurrency(formData['egr-servicios-publicos'])],
                ['Arreglos Locales', formatCurrency(formData['ing-arreglos-locales']), 'Arreglos Locales', formatCurrency(formData['egr-arreglos-locales'])],
                ['Mantenimiento y Conservación', formatCurrency(formData['ing-mantenimiento']), 'Mantenimiento y Conservación', formatCurrency(formData['egr-mantenimiento'])],
                ['Construcción Local', formatCurrency(formData['ing-construccion-local']), 'Traspaso para Construcción Local', formatCurrency(formData['egr-traspaso-construccion'])],
                ['Muebles y Artículos', formatCurrency(formData['ing-muebles']), 'Muebles y Artículos', formatCurrency(formData['egr-muebles'])],
                ['Viajes y viáticos para Ministro', formatCurrency(formData['ing-viajes-ministro']), 'Viajes y viáticos para Ministro', formatCurrency(formData['egr-viajes-ministro'])],
                ['Reuniones Ministeriales', formatCurrency(formData['ing-reuniones-ministeriales']), 'Reuniones Ministeriales', formatCurrency(formData['egr-reuniones-ministeriales'])],
                ['Atención a Ministros', formatCurrency(formData['ing-atencion-ministros']), 'Atención a Ministros', formatCurrency(formData['egr-atencion-ministros'])],
                ['Viajes fuera del País', formatCurrency(formData['ing-viajes-extranjero']), 'Viajes fuera del País', formatCurrency(formData['egr-viajes-extranjero'])],
                ['Actividades Locales', formatCurrency(formData['ing-actividades-locales']), 'Actividades Locales', formatCurrency(formData['egr-actividades-locales'])],
                ['Ofrendas para Ciudad LLDM', formatCurrency(formData['ing-ciudad-lldm']), 'Ofrendas para Ciudad LLDM', formatCurrency(formData['egr-ciudad-lldm'])],
                ['Adquisición Terreno/Edificio', formatCurrency(formData['ing-adquisicion-terreno']), 'Adquisición Terreno/Edificio', formatCurrency(formData['egr-adquisicion-terreno'])],
            ];
            
            (doc as any).autoTable({
                startY: (doc as any).lastAutoTable.finalY + 5,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
                columnStyles: { 1: { halign: 'right' }, 3: { halign: 'right' } },
                body: mainBody,
            });

            // === RESUMEN Y CIERRE ===
            (doc as any).autoTable({
                startY: (doc as any).lastAutoTable.finalY + 5,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 1.5 },
                columnStyles: { 1: { halign: 'right', fontStyle: 'bold' }, 3: { halign: 'right', fontStyle: 'bold' } },
                body: [
                    [{ content: 'RESUMEN Y CIERRE', styles: { fontStyle: 'bold', halign: 'left', fillColor: [230, 230, 230] } }, '', { content: 'SALDO DEL REMANENTE DISTRIBUIDO A:', styles: { fontStyle: 'bold', halign: 'left', fillColor: [230, 230, 230] } }, ''],
                    ['Saldo Inicial del Mes', formatCurrency(formData['saldo-anterior']), 'Dirección General (Diezmos de Diezmos)', formatCurrency(formData['dist-direccion'])],
                    ['Total Ingresos del Mes', formatCurrency(summaryCalculations.totalIngresos), 'Tesorería (Cuenta de Remanentes)', formatCurrency(formData['dist-tesoreria'])],
                    ['Total Disponible del Mes', formatCurrency(summaryCalculations.totalDisponible), 'Pro-Construcción', formatCurrency(formData['dist-pro-construccion'])],
                    ['Total Salidas del Mes', formatCurrency(summaryCalculations.totalSalidas), 'Otros', formatCurrency(formData['dist-otros'])],
                    [{ content: 'Utilidad o Remanente', styles: { fontStyle: 'bold' } }, formatCurrency(summaryCalculations.utilidadRemanente), '', ''],
                ],
                willDrawCell: (data: any) => {
                    if (data.section === 'body' && data.row.index === 5) { // Utilidad o Remanente row
                        doc.setFillColor(220, 237, 250); // Light blue
                    }
                }
            });

            // === PAGE 2: SIGNATURES ===
            doc.addPage();
            centeredText("Comisión Local de Finanzas:", 30, 11, 'bold');
            const lineY = 60;
            const textY = lineY + 5;
            doc.line(20, lineY, 80, lineY);
            doc.text("Firma 1", 45, textY, { align: 'center' });

            doc.line(130, lineY, 190, lineY);
            doc.text("Firma 2", 155, textY, { align: 'center' });
            
            const lineY2 = 100;
            const textY2 = lineY2 + 5;
            doc.line(20, lineY2, 80, lineY2);
            doc.text(`Firma Ministro: ${formData['nombre-ministro'] || ''}`, 50, textY2, { align: 'center' });

            doc.line(130, lineY2, 190, lineY2);
            doc.text("Firma Tesorero(a) Local", 160, textY2, { align: 'center' });


            // Save and Upload
            const fileName = `Informe-${formData['mes-reporte'].replace(' ', '_')}-${formData['ano-reporte']}.pdf`;
            const pdfBlob = doc.output('blob');

            doc.save(fileName);

            if (drive.isAuthenticated) {
                await drive.uploadMonthlyReport(fileName, pdfBlob);
                alert(`Informe mensual subido a Google Drive: ${fileName}`);
            } else {
                alert("No conectado a Google Drive. El archivo se descargó localmente pero no fue subido.");
            }

        } catch (err) {
            alert(`Error al generar o subir el PDF: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsProcessing(false);
        }
    };


    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-indigo-900">Informe Mensual de Finanzas</h2>
            
            {/* ... SELECTION AND CALCULATION ... */}
            <div className="p-6 bg-white rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-indigo-900 mb-4">Seleccionar Período</h3>
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
                    <button onClick={handlePrefill} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                        <CalculatorIcon className="w-5 h-5" />
                        <span>Calcular y Rellenar</span>
                    </button>
                </div>
            </div>

            {/* FORMULARIO COMPLETO */}
            <div className="p-6 bg-white rounded-xl shadow-lg space-y-4">
                <h3 className="text-xl font-bold text-indigo-900">1. Información General</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField label="Clave Iglesia" name="clave-iglesia" value={formData['clave-iglesia']} onChange={handleFormChange} readOnly/>
                    <FormField label="Nombre Iglesia" name="nombre-iglesia" value={formData['nombre-iglesia']} onChange={handleFormChange} readOnly/>
                    <FormField label="Distrito" name="distrito" value={formData['distrito']} onChange={handleFormChange} />
                    <FormField label="Departamento" name="departamento" value={formData['departamento']} onChange={handleFormChange} />
                    <FormField label="Miembros Activos" name="miembros-activos" value={formData['miembros-activos']} onChange={handleFormChange} type="number" readOnly />
                    <FormField label="Mes del Reporte" name="mes-reporte" value={formData['mes-reporte']} onChange={handleFormChange} readOnly />
                    <FormField label="Año del Reporte" name="ano-reporte" value={formData['ano-reporte']} onChange={handleFormChange} readOnly />
                    <FormField label="Nombre Ministro" name="nombre-ministro" value={formData['nombre-ministro']} onChange={handleFormChange} />
                    <FormField label="Grado Ministro" name="grado-ministro" value={formData['grado-ministro']} onChange={handleFormChange} />
                    <FormField label="Tel. Ministro" name="tel-ministro" value={formData['tel-ministro']} onChange={handleFormChange} />
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 bg-white rounded-xl shadow-lg space-y-4">
                    <h3 className="text-xl font-bold text-green-700">2. Entradas (C$)</h3>
                    <FormField label="Saldo Inicial del Mes" name="saldo-anterior" value={formData['saldo-anterior']} onChange={handleFormChange} type="number" />
                    <FormField label="Diezmos" name="ing-diezmos" value={formData['ing-diezmos']} onChange={handleFormChange} type="number" readOnly/>
                    <FormField label="Ofrendas Ordinarias" name="ing-ofrendas-ordinarias" value={formData['ing-ofrendas-ordinarias']} onChange={handleFormChange} type="number" readOnly />
                    <FormField label="Primicias" name="ing-primicias" value={formData['ing-primicias']} onChange={handleFormChange} type="number" readOnly />
                    <FormField label="Ayuda al Encargado" name="ing-ayuda-encargado" value={formData['ing-ayuda-encargado']} onChange={handleFormChange} type="number" />
                    <FormField label="Ceremonial" name="ing-ceremonial" value={formData['ing-ceremonial']} onChange={handleFormChange} type="number" readOnly />
                    {/* ... other income fields ... */}
                </div>
                <div className="p-6 bg-white rounded-xl shadow-lg space-y-4">
                    <h3 className="text-xl font-bold text-red-700">3. Salidas (C$)</h3>
                    <FormField label="Asignación Autorizada" name="egr-asignacion" value={formData['egr-asignacion']} onChange={handleFormChange} type="number" />
                    <FormField label="Gomer del Mes" name="egr-gomer" value={formData['egr-gomer']} onChange={handleFormChange} type="number" readOnly />
                    <FormField label="Ceremonial" name="egr-ceremonial" value={formData['egr-ceremonial']} onChange={handleFormChange} type="number" readOnly />
                    <FormField label="Traspaso para Construcción Local" name="egr-traspaso-construccion" value={formData['egr-traspaso-construccion']} onChange={handleFormChange} type="number" />
                    {/* ... other expense fields ... */}
                </div>
            </div>

             {/* === REAL-TIME SUMMARY SECTION === */}
            <div className="p-6 bg-white rounded-xl shadow-lg space-y-4">
                <h3 className="text-xl font-bold text-indigo-900">Resumen y Cierre (Cálculos en Tiempo Real)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between font-semibold"><span className="text-gray-600">Saldo Inicial del Mes:</span> <span>{formatCurrency(formData['saldo-anterior'])}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Total Ingresos del Mes:</span> <span>{formatCurrency(summaryCalculations.totalIngresos)}</span></div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2"><span className="text-indigo-800">Total Disponible del Mes:</span> <span className="text-indigo-800">{formatCurrency(summaryCalculations.totalDisponible)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Total Salidas del Mes:</span> <span>({formatCurrency(summaryCalculations.totalSalidas)})</span></div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2 bg-blue-100 p-2 rounded-md"><span className="text-blue-800">Utilidad o Remanente:</span> <span className="text-blue-800">{formatCurrency(summaryCalculations.utilidadRemanente)}</span></div>
                    </div>
                    <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-bold text-indigo-900 mb-2">Distribución del Saldo Remanente</h4>
                         <FormField label="Dirección General (Diezmos de Diezmos)" name="dist-direccion" value={formData['dist-direccion']} onChange={handleFormChange} type="number" />
                         <FormField label="Tesorería (Cuenta de Remanentes)" name="dist-tesoreria" value={formData['dist-tesoreria']} onChange={handleFormChange} type="number" readOnly />
                         <FormField label="Pro-Construcción" name="dist-pro-construccion" value={formData['dist-pro-construccion']} onChange={handleFormChange} type="number" />
                         <FormField label="Otros" name="dist-otros" value={formData['dist-otros']} onChange={handleFormChange} type="number" />
                    </div>
                </div>
            </div>
            {/* ... other form sections ... */}


            <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={handleSaveReport} className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
                    Guardar Reporte Localmente
                </button>
                <button onClick={handleExportAndUpload} disabled={isProcessing || !drive.isAuthenticated} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-900 text-white font-semibold rounded-lg hover:bg-indigo-800 disabled:bg-gray-400 transition-colors">
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    <span>{isProcessing ? 'Procesando...' : 'Exportar PDF y Subir a Drive'}</span>
                </button>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-indigo-900 mb-4">Informes Guardados</h3>
                <ul className="space-y-2">
                    {savedReports.length > 0 ? savedReports.map(report => (
                        <li key={report.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium">{MONTH_NAMES[report.month - 1]} {report.year}</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setSelectedMonth(report.month); setSelectedYear(report.year); }} className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200">Cargar</button>
                                <button onClick={() => handleDeleteReport(report.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-100">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </li>
                    )) : <p className="text-gray-500 text-center">No hay informes guardados.</p>}
                </ul>
            </div>
        </div>
    );
};

export default InformeMensualTab;