
import React, { useState, useMemo, useEffect } from 'react';
import { Member, WeeklyRecord, Donation, Formulas } from '../../types';
import { PlusIcon, UserPlusIcon } from '@heroicons/react/24/outline';
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
        className="w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-secondary focus:border-transparent"
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
}

const RegistroOfrendasTab: React.FC<RegistroOfrendasTabProps> = ({
  currentRecord, setCurrentRecord, members, setMembers, categories, setCategories, onSaveRecord, onStartNew, defaultFormulas, weeklyRecords
}) => {
  const [dateInfo, setDateInfo] = useState({
    day: new Date().getDate().toString(),
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
    minister: ''
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
    }
  }, [currentRecord]);

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
    if (!selectedMember) {
      alert('Por favor, seleccione un miembro.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      alert('Por favor, ingrese una cantidad válida.');
      return;
    }
    const newDonation: Donation = {
        id: `d-${Date.now()}`,
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        category: category,
        amount: parseFloat(amount),
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
                <h2 className="text-2xl font-bold text-primary mb-4">Información de la Semana</h2>
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
                <button onClick={handleCreateRecord} className="w-full mt-6 py-3 font-semibold text-white transition duration-300 rounded-lg bg-secondary hover:bg-blue-600">
                    Guardar Fecha
                </button>
            </div>
        ) : (
             <div className="p-6 bg-white rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-primary">Semana Actual</h2>
                    <button onClick={onStartNew} className="px-4 py-2 text-sm font-semibold text-white transition duration-300 bg-green-500 rounded-lg hover:bg-green-600">
                        Nueva Fecha
                    </button>
                </div>
                <p className="text-gray-600">Fecha: {currentRecord.day}/{currentRecord.month}/{currentRecord.year}</p>
                <p className="text-gray-600">Ministro: {currentRecord.minister}</p>
            </div>
        )}

        {currentRecord && (
            <>
            <div className="p-6 bg-white rounded-xl shadow-lg space-y-4">
                <h3 className="text-xl font-bold text-primary">Registrar Ofrenda</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Miembro</label>
                    <div className="flex items-center space-x-2">
                        <div className="flex-grow">
                            <AutocompleteInput members={members} onSelect={setSelectedMember} selectedMemberName={selectedMemberName} />
                        </div>
                        <button onClick={() => setIsAddingMember(true)} className="p-3.5 bg-secondary text-white rounded-lg hover:bg-blue-600 transition-all duration-300" aria-label="Añadir nuevo miembro">
                            <UserPlusIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Cantidad (C$)</label>
                        <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="mt-1 w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm" />
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoría</label>
                         <select id="category" value={category} onChange={e => setCategory(e.target.value)} className="mt-1 w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm">
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                     <button onClick={handleAddOfrenda} className="flex-grow py-3 font-semibold text-white transition duration-300 rounded-lg bg-primary hover:bg-gray-700 flex items-center justify-center">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Agregar Ofrenda
                    </button>
                     <button onClick={() => setIsAddingCategory(prev => !prev)} className="py-3 px-4 font-semibold text-white transition duration-300 bg-yellow-500 rounded-lg hover:bg-yellow-600">
                        <UserPlusIcon className="w-5 h-5" />
                    </button>
                </div>
                {isAddingCategory && (
                    <div className="flex items-center space-x-2 pt-2">
                        <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Nueva categoría" className="flex-grow p-2 border border-gray-300 rounded-lg"/>
                        <button onClick={handleAddNewCategory} className="px-4 py-2 bg-success text-white rounded-lg">Guardar</button>
                    </div>
                )}
            </div>

            <button onClick={onSaveRecord} className="w-full mt-6 py-3 font-semibold text-white transition duration-300 rounded-lg bg-success hover:bg-green-600">
                Guardar Semana y Ver Resumen
            </button>
            </>
        )}
        {isAddingMember && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" role="dialog" aria-modal="true">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                    <h3 className="text-lg font-bold mb-4 text-primary">Añadir Nuevo Miembro</h3>
                    <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="Nombre completo del miembro"
                        className="w-full p-2 border border-gray-300 rounded-md mb-4"
                        autoFocus
                    />
                    <div className="flex justify-end space-x-2">
                        <button onClick={() => setIsAddingMember(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors">Cancelar</button>
                        <button onClick={handleAddNewMember} className="px-4 py-2 bg-success text-white rounded-md hover:bg-green-600 transition-colors">Guardar</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default RegistroOfrendasTab;
