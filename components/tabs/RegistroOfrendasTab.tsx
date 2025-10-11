import React, { useState, useMemo, useEffect } from 'react';
import { Member, WeeklyRecord, Donation, Formulas, ChurchInfo } from '../../types';
import { PlusIcon, UserPlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { MONTH_NAMES } from '../../constants';

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
        <ul className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg max-h-60">
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


interface RegistroOfrendasTabProps {
  currentRecord: WeeklyRecord | null;
  setCurrentRecord: React.Dispatch<React.SetStateAction<WeeklyRecord | null>>;
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  onSaveRecord: () => void;
  onStartNew: () => void;
  defaultFormulas: Formulas;
  weeklyRecords: WeeklyRecord[];
  churchInfo: ChurchInfo;
}

const RegistroOfrendasTab: React.FC<RegistroOfrendasTabProps> = ({
  currentRecord, setCurrentRecord, members, setMembers, categories, setCategories, onSaveRecord, onStartNew, defaultFormulas, weeklyRecords, churchInfo
}) => {
  const [dateInfo, setDateInfo] = useState({
    day: new Date().getDate().toString(),
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
    minister: churchInfo.defaultMinister || ''
  });
  
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0] || '');
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');


  useEffect(() => {
    if (currentRecord) {
        setDateInfo({
            day: currentRecord.day.toString(),
            month: currentRecord.month.toString(),
            year: currentRecord.year.toString(),
            minister: currentRecord.minister
        });
    } else {
        // Pre-fill minister name from defaults when starting a new record
        setDateInfo(prev => ({ ...prev, minister: churchInfo.defaultMinister || '' }));
    }
  }, [currentRecord, churchInfo.defaultMinister]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDateInfo({ ...dateInfo, [e.target.name]: e.target.value });
  };
  
  const handleCreateRecord = () => {
    if (!dateInfo.day || !dateInfo.month || !dateInfo.year || !dateInfo.minister) {
      alert('Por favor, complete todos los campos de fecha y ministro.');
      return;
    }

    const day = parseInt(dateInfo.day);
    const month = parseInt(dateInfo.month);
    const year = parseInt(dateInfo.year);

    const existingRecord = weeklyRecords.find(r => r.day === day && r.month === month && r.year === year);
    if (existingRecord) {
        if (!window.confirm('Ya existe un registro para esta fecha. ¿Desea continuar y crear uno nuevo de todas formas? Se recomienda editar el existente desde la pestaña "Semanas".')) {
            return;
        }
    }

    const newRecord: WeeklyRecord = {
      id: `wr-${Date.now()}`,
      day: day,
      month: month,
      year: year,
      minister: dateInfo.minister,
      donations: [],
      formulas: defaultFormulas,
    };
    setCurrentRecord(newRecord);
  };
  
  const handleAddOfrenda = () => {
    if (!currentRecord) {
      alert('Por favor, guarde la fecha primero.');
      return;
    }
    
    const parsedAmount = parseFloat(amount);
    
    // Robust validation for member and amount
    if (!selectedMember || !amount.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
        alert('Para agregar una ofrenda, por favor asegúrese de haber seleccionado un miembro válido y de haber ingresado una cantidad numérica positiva.');
        return;
    }

    const newDonation: Donation = {
        id: `d-${Date.now()}`,
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        category: category,
        amount: parsedAmount,
    };

    setCurrentRecord(prev => prev ? { ...prev, donations: [...prev.donations, newDonation] } : null);
    setAmount('');
    setSelectedMember(null);
  };

  const handleAddNewCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
        setCategories(prev => [...prev, newCategory]);
        setCategory(newCategory);
    }
    setNewCategory('');
    setIsAddingCategory(false);
  }

  const handleAddNewMember = () => {
    if (newMemberName.trim() && !members.some(m => m.name.toLowerCase() === newMemberName.trim().toLowerCase())) {
        const newMember = { id: `m-${Date.now()}`, name: newMemberName.trim() };
        setMembers(prev => [...prev, newMember].sort((a,b) => a.name.localeCompare(b.name)));
        setNewMemberName('');
        setIsAddingMember(false);
    } else {
        alert('El nombre del miembro no puede estar vacío o ya existe.');
    }
  };

  const selectedMemberName = useMemo(() => selectedMember?.name || '', [selectedMember]);

  return (
    <div className="space-y-6">
        {!currentRecord ? (
            <div className="p-6 bg-white rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-indigo-900 mb-4">Información de la Semana</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label htmlFor="day" className="block text-sm font-medium text-gray-700">Día</label>
                        <input type="number" name="day" id="day" value={dateInfo.day} onChange={handleDateChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label htmlFor="month" className="block text-sm font-medium text-gray-700">Mes</label>
                        <select name="month" id="month" value={dateInfo.month} onChange={handleDateChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                            {MONTH_NAMES.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="year" className="block text-sm font-medium text-gray-700">Año</label>
                        <input type="number" name="year" id="year" value={dateInfo.year} onChange={handleDateChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                     <div>
                        <label htmlFor="minister" className="block text-sm font-medium text-gray-700">Ministro</label>
                        <input type="text" name="minister" id="minister" value={dateInfo.minister} onChange={handleDateChange} placeholder="Nombre del ministro" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Clave</label>
                        <input type="text" value="NIMT02" readOnly className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"/>
                    </div>
                </div>
                <button onClick={handleCreateRecord} className="w-full mt-6 py-3 font-semibold text-white transition duration-300 rounded-lg bg-blue-600 hover:bg-blue-700">
                    Guardar Fecha
                </button>
            </div>
        ) : (
             <div className="p-6 bg-white rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-indigo-900">Registrando Ofrendas</h2>
                        <p className="text-gray-500">{`Semana del ${currentRecord.day} de ${MONTH_NAMES[currentRecord.month - 1]} de ${currentRecord.year}`}</p>
                    </div>
                    <button onClick={onStartNew} className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                        Empezar Nueva Semana
                    </button>
                </div>
                
                <div className="p-4 my-4 space-y-4 border rounded-lg bg-gray-50">
                    <h3 className="text-lg font-semibold text-indigo-900">Agregar Donación</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Miembro</label>
                            <AutocompleteInput members={members} onSelect={setSelectedMember} selectedMemberName={selectedMemberName} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">&nbsp;</label>
                            <button onClick={() => setIsAddingMember(true)} className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200">
                                <UserPlusIcon className="w-5 h-5" />
                                <span>Agregar Nuevo Miembro</span>
                            </button>
                        </div>
                    </div>
                    {isAddingMember && (
                        <div className="flex gap-2 p-2 border rounded-md">
                            <input type="text" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="Nombre completo" className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm"/>
                            <button onClick={handleAddNewMember} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">Guardar</button>
                            <button onClick={() => setIsAddingMember(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancelar</button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Categoría</label>
                            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 mt-1 bg-white border border-gray-300 rounded-lg">
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Cantidad (C$)</label>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full p-3 mt-1 bg-white border border-gray-300 rounded-lg" />
                        </div>
                        <div className="self-end">
                            <button onClick={handleAddOfrenda} className="flex items-center justify-center w-full gap-2 px-4 py-3 font-semibold text-white transition duration-300 bg-blue-600 rounded-lg hover:bg-blue-700">
                                <PlusIcon className="w-5 h-5" />
                                <span>Agregar</span>
                            </button>
                        </div>
                    </div>

                    <button onClick={() => setIsAddingCategory(true)} className="text-sm text-blue-600 hover:underline">
                        + Agregar nueva categoría
                    </button>
                    {isAddingCategory && (
                         <div className="flex gap-2 p-2 border rounded-md">
                            <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Nombre de categoría" className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm"/>
                            <button onClick={handleAddNewCategory} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">Guardar</button>
                            <button onClick={() => setIsAddingCategory(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancelar</button>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    {currentRecord.donations.length > 0 ? (
                        currentRecord.donations.map(donation => (
                            <div key={donation.id} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                                <div>
                                    <p className="font-medium">{donation.memberName}</p>
                                    <p className="text-sm text-gray-500">{donation.category} - C$ {donation.amount.toFixed(2)}</p>
                                </div>
                                <button
                                    onClick={() => setCurrentRecord(prev => prev ? {...prev, donations: prev.donations.filter(d => d.id !== donation.id)} : null)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500">Aún no hay ofrendas registradas para esta semana.</p>
                    )}
                </div>
                <button onClick={onSaveRecord} className="w-full mt-6 py-3 font-semibold text-white transition duration-300 bg-green-600 rounded-lg hover:bg-green-700">
                    Guardar Semana y Ver Resumen
                </button>
            </div>
        )}
    </div>
  );
};

export default RegistroOfrendasTab;
