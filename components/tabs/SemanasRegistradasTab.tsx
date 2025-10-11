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
        className="w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
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
    // FIX: Corrected typo 'a' to 'any' and completed the function logic.
    const wsSummary = (window as any).XLSX.utils.aoa_to_sheet(summaryData);
    (window as any).XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");
    
    const wsDonations = (window as any).XLSX.utils.json_to_sheet(donationsData);
    (window as any).XLSX.utils.book_append_sheet(wb, wsDonations, "Detalle de Ofrendas");

    const fileName = `Semana-${record.day}-${record.month}-${record.year}.xlsx`;
    const excelBuffer = (window as any).XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    if (drive.isAuthenticated) {
        try {
            setIsSyncing(true);
            await drive.uploadWeeklyReport(fileName, blob);
            alert(`Reporte semanal guardado exitosamente en Google Drive: ${fileName}`);
        } catch(err) {
            alert(`Error al subir a Drive: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsSyncing(false);
        }
    } else {
        alert("El guardado en Google Drive está deshabilitado. Por favor, cargue las credenciales en el Panel de Administración.");
    }
  };

  // FIX: Added return statement with JSX to render the component UI.
  return (
    <div className="space-y-6">
        <div className="p-6 bg-white rounded-xl shadow-lg flex justify-between items-center">
            <h2 className="text-2xl font-bold text-indigo-900">Semanas Registradas</h2>
            <button
                onClick={async () => {
                    if (!drive.isAuthenticated) {
                        alert("Conecte con Google Drive en el panel de Admin primero.");
                        return;
                    }
                    if (!window.confirm("Esto reemplazará los registros locales con los de Google Drive. ¿Continuar?")) return;
                    setIsSyncing(true);
                    try {
                        const driveRecords = await drive.loadAndParseWeeklyReports();
                        const localIds = new Set(records.map(r => r.id));
                        const newRecords = driveRecords.filter(dr => !localIds.has(dr.id));
                        setRecords(prev => [...prev, ...newRecords].sort((a,b) => new Date(b.year, b.month-1, b.day).getTime() - new Date(a.year, a.month-1, a.day).getTime()));
                        alert(`${newRecords.length} nuevos registros cargados desde Google Drive.`);
                    } catch (e) {
                        alert(`Error al sincronizar: ${e instanceof Error ? e.message : String(e)}`);
                    } finally {
                        setIsSyncing(false);
                    }
                }}
                disabled={isSyncing || !drive.isAuthenticated}
                className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
                {isSyncing ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <ArrowDownTrayIcon className="w-5 h-5" />}
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar con Drive'}</span>
            </button>
        </div>

        <div className="space-y-4">
            {records.length > 0 ? (
                records
                    .sort((a, b) => new Date(b.year, b.month - 1, b.day).getTime() - new Date(a.year, a.month - 1, a.day).getTime())
                    .map(record => (
                        <div key={record.id} className="p-4 bg-white rounded-xl shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div>
                                <p className="font-bold text-lg text-indigo-900">{`Semana del ${record.day} de ${MONTH_NAMES[record.month - 1]} de ${record.year}`}</p>
                                <p className="text-sm text-gray-500">Ministro: {record.minister}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <button onClick={() => handleOpenEditModal(record)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-yellow-500 rounded-md hover:bg-yellow-600">
                                    <PencilIcon className="w-4 h-4" /> Editar
                                </button>
                                <button onClick={() => handleDelete(record.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                                    <TrashIcon className="w-4 h-4" /> Eliminar
                                </button>
                                <button onClick={() => handleExportAndSave(record)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                                    <ArrowDownTrayIcon className="w-4 h-4" /> Exportar/Subir
                                </button>
                            </div>
                        </div>
                    ))
            ) : (
                <div className="p-6 text-center bg-white rounded-xl shadow-lg">
                    <p>No hay semanas registradas. Comience en la pestaña 'Registro'.</p>
                </div>
            )}
        </div>

        {editingRecord && tempRecord && (
            <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex justify-center items-start overflow-y-auto p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 relative">
                    <div className="sticky top-0 bg-white p-6 border-b rounded-t-2xl z-10">
                         <h3 className="text-2xl font-bold text-indigo-900">Editando Semana</h3>
                         <p className="text-gray-500">{`${tempRecord.day} de ${MONTH_NAMES[tempRecord.month - 1]} de ${tempRecord.year}`}</p>
                        <button onClick={handleCloseModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                            <XMarkIcon className="w-8 h-8"/>
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Día</label>
                                <input type="number" name="day" value={tempRecord.day} onChange={handleModalInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mes</label>
                                <select name="month" value={tempRecord.month} onChange={handleModalInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                    {MONTH_NAMES.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Año</label>
                                <input type="number" name="year" value={tempRecord.year} onChange={handleModalInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Ministro</label>
                                <input type="text" name="minister" value={tempRecord.minister} onChange={handleModalInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                            </div>
                        </div>

                        <div className="p-4 border-t space-y-4">
                            <h4 className="text-lg font-semibold text-indigo-900">Agregar Nueva Donación</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="md:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">Miembro</label>
                                    <AutocompleteInput members={members} onSelect={setSelectedMember} selectedMemberName={selectedMember?.name || ''} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Categoría</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 w-full p-3 border border-gray-300 rounded-lg">
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="mt-1 w-full p-3 border border-gray-300 rounded-lg" />
                                </div>
                                <button onClick={handleAddDonation} className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    <PlusIcon className="w-5 h-5"/> Agregar
                                </button>
                            </div>
                        </div>
                        
                        <div className="max-h-60 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded-lg">
                             <h4 className="text-lg font-semibold text-indigo-900 mb-2 px-2">Donaciones Registradas</h4>
                            {tempRecord.donations.length > 0 ? tempRecord.donations.map(donation => (
                                <div key={donation.id} className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm">
                                    <div>
                                        <p className="font-medium">{donation.memberName}</p>
                                        <p className="text-sm text-gray-500">{donation.category} - C$ {donation.amount.toFixed(2)}</p>
                                    </div>
                                    <button onClick={() => handleRemoveDonation(donation.id)} className="text-red-500 hover:text-red-700">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            )) : <p className="text-center text-gray-500 py-4">No hay donaciones en este registro.</p>}
                        </div>

                    </div>
                    <div className="sticky bottom-0 bg-gray-50 p-4 border-t rounded-b-2xl flex justify-end gap-3">
                        <button onClick={handleCloseModal} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button onClick={handleSaveChanges} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">Guardar Cambios</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SemanasRegistradasTab;
