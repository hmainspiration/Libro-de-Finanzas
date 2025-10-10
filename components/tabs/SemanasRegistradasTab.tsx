import React, { useState, useMemo, useEffect } from 'react';
import { WeeklyRecord, Member, Donation } from '../../types';
import { PencilIcon, TrashIcon, XMarkIcon, PlusIcon, ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { MONTH_NAMES } from '../../constants';
import { useDrive } from '../../context/GoogleDriveContext';

// Copied from RegistroOfrendasTab, to be used inside the modal
interface AutocompleteInputProps {
  members: Member[];
  onSelect: (member: Member) => void;
  selectedMemberName: string;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ members, onSelect, selectedMemberName }) => {
  const [inputValue, setInputValue] = useState(selectedMemberName);
  const [suggestions, setSuggestions] = useState<Member[]>([]);

  useEffect(() => {
    setInputValue(selectedMemberName);
  }, [selectedMemberName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (value) {
      setSuggestions(
        members.filter(m => m.name.toLowerCase().includes(value.toLowerCase())).slice(0, 5)
      );
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = (member: Member) => {
    onSelect(member);
    setInputValue(member.name);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="Escriba el nombre del miembro..."
        className="w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-secondary focus:border-transparent"
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg max-h-60">
          {suggestions.map(member => (
            <li
              key={member.id}
              onClick={() => handleSelect(member)}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
            >
              {member.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


interface SemanasRegistradasTabProps {
  records: WeeklyRecord[];
  setRecords: React.Dispatch<React.SetStateAction<WeeklyRecord[]>>;
  members: Member[];
  categories: string[];
}

const SemanasRegistradasTab: React.FC<SemanasRegistradasTabProps> = ({ records, setRecords, members, categories }) => {
  const [editingRecord, setEditingRecord] = useState<WeeklyRecord | null>(null);
  const [tempRecord, setTempRecord] = useState<WeeklyRecord | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const drive = useDrive();

  // Modal form state
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0] || '');

  useEffect(() => {
    if (editingRecord) {
      setTempRecord(JSON.parse(JSON.stringify(editingRecord))); // Deep copy
    } else {
      setTempRecord(null);
    }
  }, [editingRecord]);

  const handleOpenEditModal = (record: WeeklyRecord) => {
    setEditingRecord(record);
  };

  const handleCloseModal = () => {
    setEditingRecord(null);
  };

  const handleSaveChanges = () => {
    if (tempRecord) {
      setRecords(prevRecords => prevRecords.map(r => r.id === tempRecord.id ? tempRecord : r));
      handleCloseModal();
    }
  };

  const handleDelete = (recordId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta semana registrada? Esta acción no se puede deshacer.')) {
        setRecords(prevRecords => prevRecords.filter(r => r.id !== recordId));
    }
  };

  const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (tempRecord) {
      const { name, value } = e.target;
      const isNumeric = ['day', 'month', 'year'].includes(name);
      setTempRecord({ ...tempRecord, [name]: isNumeric ? parseInt(value) : value });
    }
  };

  const handleAddDonation = () => {
    if (!tempRecord || !selectedMember || !amount || parseFloat(amount) <= 0) {
      alert('Por favor, seleccione un miembro e ingrese una cantidad válida.');
      return;
    }
    const newDonation: Donation = {
        id: `d-${Date.now()}`,
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        category: category,
        amount: parseFloat(amount),
    };
    setTempRecord({ ...tempRecord, donations: [...tempRecord.donations, newDonation] });
    setSelectedMember(null);
    setAmount('');
  };

  const handleRemoveDonation = (donationId: string) => {
    if(tempRecord) {
      setTempRecord({ ...tempRecord, donations: tempRecord.donations.filter(d => d.id !== donationId)});
    }
  };
  
  const handleExportAndSave = async (record: WeeklyRecord) => {
    const subtotals: Record<string, number> = {};
    categories.forEach(cat => { subtotals[cat] = 0; });
    record.donations.forEach(d => {
        if (subtotals[d.category] !== undefined) {
            subtotals[d.category] += d.amount;
        }
    });
    const total = (subtotals['Diezmo'] || 0) + (subtotals['Ordinaria'] || 0);
    const diezmoDeDiezmo = Math.round(total * (record.formulas.diezmoPercentage / 100));
    const remanente = total > record.formulas.remanenteThreshold ? Math.round(total - record.formulas.remanenteThreshold) : 0;
    const gomerMinistro = Math.round(total - diezmoDeDiezmo);

    const summaryData = [
        ["Resumen Semanal"], [], ["Fecha:", `${record.day}/${record.month}/${record.year}`], ["Ministro:", record.minister], [],
        ["Concepto", "Monto (C$)"], ...categories.map(cat => [cat, subtotals[cat] || 0]), [],
        ["Cálculos Finales", ""], ["TOTAL (Diezmo + Ordinaria)", total], [`Diezmo de Diezmo (${record.formulas.diezmoPercentage}%)`, diezmoDeDiezmo],
        [`Remanente (Umbral C$ ${record.formulas.remanenteThreshold})`, remanente], ["Gomer del Ministro", gomerMinistro]
    ];
    const donationsData = record.donations.map(d => ({ Miembro: d.memberName, Categoría: d.category, Monto: d.amount, }));

    const wb = (window as any).XLSX.utils.book_new();
    const wsSummary = (window as any).XLSX.utils.aoa_to_sheet(summaryData);
    (window as any).XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");
    const wsDonations = (window as any).XLSX.utils.json_to_sheet(donationsData);
    (window as any).XLSX.utils.book_append_sheet(wb, wsDonations, "Detalle de Ofrendas");

    const fileName = `Semana-NIMT02-${record.day}-${record.month}-${record.year}.xlsx`;
    
    (window as any).XLSX.writeFile(wb, fileName);

    if (drive.isAuthenticated) {
        try {
            const excelBlob = new Blob([
                (window as any).XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
            ], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

            await drive.uploadWeeklyReport(fileName, excelBlob);
            alert(`Reporte semanal guardado exitosamente en Google Drive: ${fileName}`);
        } catch (error) {
            console.error("Error uploading to Google Drive:", error);
            alert(`Error al guardar en Google Drive: ${error instanceof Error ? error.message : String(error)}`);
        }
    } else {
        alert("El guardado en Google Drive está deshabilitado. Por favor, cargue las credenciales en el Panel de Administración.");
    }
  };

  const handleSyncFromDrive = async () => {
    if (!drive.isAuthenticated) {
        alert("Por favor, cargue las credenciales en el Panel de Administración para habilitar la sincronización.");
        return;
    }
    if (!window.confirm("¿Sincronizar con Google Drive? Esto reemplazará todos los datos locales de semanas registradas con los archivos encontrados en Drive. Se recomienda guardar cualquier cambio local primero.")) {
        return;
    }
    setIsSyncing(true);
    try {
        const weeklyRecordsFromDrive = await drive.loadAndParseWeeklyReports();
        setRecords(weeklyRecordsFromDrive);
        alert(`Sincronización completa. Se cargaron ${weeklyRecordsFromDrive.length} registros desde Google Drive.`);
    } catch (error) {
        console.error("Sync failed:", error);
        alert(`Falló la sincronización con Google Drive: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        setIsSyncing(false);
    }
  };

  const selectedMemberName = useMemo(() => selectedMember?.name || '', [selectedMember]);

  const sortedRecords = [...records].sort((a, b) => {
    const dateA = new Date(a.year, a.month - 1, a.day);
    const dateB = new Date(b.year, b.month - 1, b.day);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-4">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-primary">Semanas Registradas</h2>
            <button 
                onClick={handleSyncFromDrive} 
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 font-semibold text-white transition duration-300 rounded-lg bg-secondary hover:bg-blue-600 disabled:bg-gray-400"
                disabled={!drive.isAuthenticated || isSyncing}
                title={!drive.isAuthenticated ? "Cargue las credenciales en Admin para habilitar" : "Sincronizar con Google Drive"}
            >
                {isSyncing ? (
                    <>
                        <span className="animate-spin h-5 w-5 mr-3">
                            <ArrowPathIcon className="w-5 h-5"/>
                        </span>
                        Sincronizando...
                    </>
                ) : (
                    <>
                        <ArrowPathIcon className="w-5 h-5"/>
                        Sincronizar con Drive
                    </>
                )}
            </button>
        </div>
       
      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 p-6 text-center bg-white rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-700">No hay semanas registradas</h3>
            <p className="mt-2 text-gray-500">Los resúmenes de las semanas que guarde aparecerán aquí. Pruebe a sincronizar con Google Drive para cargar registros existentes.</p>
        </div>
        ) : (
            sortedRecords.map(record => {
            const total = record.donations
                .filter(d => d.category === 'Diezmo' || d.category === 'Ordinaria')
                .reduce((sum, d) => sum + d.amount, 0);

            return (
                <div key={record.id} className="p-4 bg-white rounded-xl shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-grow">
                        <p className="font-bold text-lg text-primary">{record.day}/{record.month}/{record.year}</p>
                        <p className="text-sm text-gray-600">Ministro: {record.minister}</p>
                        <p className="text-sm text-gray-600 mt-1">Total (Diezmo + Ord.): <span className="font-semibold">C$ {total.toFixed(2)}</span></p>
                    </div>
                    <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                        <button onClick={() => handleExportAndSave(record)} className="p-2 text-white bg-success rounded-full hover:bg-green-600 transition disabled:bg-gray-400" title="Exportar y Guardar en Drive" disabled={!drive.isAuthenticated}>
                            <ArrowDownTrayIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={() => handleOpenEditModal(record)} className="p-2 text-white bg-secondary rounded-full hover:bg-blue-600 transition" title="Editar">
                            <PencilIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={() => handleDelete(record.id)} className="p-2 text-white bg-danger rounded-full hover:bg-red-600 transition" title="Eliminar">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            );
            })
        )
      }

      {editingRecord && tempRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-bold text-primary">Editar Semana Registrada</h3>
              <button onClick={handleCloseModal} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                <XMarkIcon className="w-6 h-6 text-gray-700" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-semibold text-lg text-primary mb-3">Información General</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                      <label htmlFor="day" className="block text-sm font-medium text-gray-700">Día</label>
                      <input type="number" name="day" id="day" value={tempRecord.day} onChange={handleModalInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                  </div>
                  <div>
                      <label htmlFor="month" className="block text-sm font-medium text-gray-700">Mes</label>
                      <select name="month" id="month" value={tempRecord.month} onChange={handleModalInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                          {MONTH_NAMES.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
                      </select>
                  </div>
                  <div>
                      <label htmlFor="year" className="block text-sm font-medium text-gray-700">Año</label>
                      <input type="number" name="year" id="year" value={tempRecord.year} onChange={handleModalInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                  </div>
                  <div className="md:col-span-3">
                      <label htmlFor="minister" className="block text-sm font-medium text-gray-700">Ministro</label>
                      <input type="text" name="minister" id="minister" value={tempRecord.minister} onChange={handleModalInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border">
                 <h4 className="font-semibold text-lg text-primary mb-3">Agregar Ofrenda</h4>
                 <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Miembro</label>
                        <AutocompleteInput members={members} onSelect={setSelectedMember} selectedMemberName={selectedMemberName} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="amountModal" className="block text-sm font-medium text-gray-700">Cantidad (C$)</label>
                            <input type="number" id="amountModal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="mt-1 w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm" />
                        </div>
                        <div>
                            <label htmlFor="categoryModal" className="block text-sm font-medium text-gray-700">Categoría</label>
                            <select id="categoryModal" value={category} onChange={e => setCategory(e.target.value)} className="mt-1 w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm">
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                    </div>
                    <button onClick={handleAddDonation} className="w-full py-3 font-semibold text-white transition duration-300 rounded-lg bg-primary hover:bg-gray-700 flex items-center justify-center">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Agregar a la Semana
                    </button>
                 </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg text-primary mb-3">Ofrendas de la Semana</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-lg border">
                  {tempRecord.donations.length > 0 ? tempRecord.donations.map(donation => (
                    <div key={donation.id} className="flex items-center justify-between p-2 bg-white rounded-md shadow-sm">
                        <div>
                            <p className="font-medium">{donation.memberName}</p>
                            <p className="text-sm text-gray-600">{donation.category} - <span className="font-semibold">C$ {donation.amount.toFixed(2)}</span></p>
                        </div>
                        <button onClick={() => handleRemoveDonation(donation.id)} className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 transition-colors">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                  )) : (
                    <p className="text-center text-gray-500 py-4">No hay ofrendas registradas.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end p-4 border-t bg-gray-50 rounded-b-xl">
                <button onClick={handleCloseModal} className="px-6 py-2 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 mr-2 transition-colors">Cancelar</button>
                <button onClick={handleSaveChanges} className="px-6 py-2 font-semibold text-white bg-success rounded-lg hover:bg-green-600 transition-colors">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SemanasRegistradasTab;
