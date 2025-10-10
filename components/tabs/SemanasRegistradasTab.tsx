import React, { useState, useMemo, useEffect } from 'react';
import { WeeklyRecord, Member, Donation } from '../../types';
import { PencilIcon, TrashIcon, XMarkIcon, PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { MONTH_NAMES } from '../../constants';

// Copied from RegistroOfrendasTab, to be used inside the modal
interface AutocompleteInputProps {
  members: Member[];
  onSelect: (member: Member) => void;
  selectedMemberName: string;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ members, onSelect, selectedMemberName }) => {
  const [inputValue, setInputValue] = useState(selimport React, { useState, useMemo, useEffect } from 'react';
import { WeeklyRecord, Member, Donation } from '../../types';
import { PencilIcon, TrashIcon, XMarkIcon, PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { MONTH_NAMES } from '../../constants';
import { supabase } from '../Lib/supabase'; // Ajusta la ruta según tu estructura

// ... (el código de AutocompleteInput se mantiene igual)

interface SemanasRegistradasTabProps {
  records: WeeklyRecord[];
  setRecords: React.Dispatch<React.SetStateAction<WeeklyRecord[]>>;
  members: Member[];
  categories: string[];
}

const SemanasRegistradasTab: React.FC<SemanasRegistradasTabProps> = ({ records, setRecords, members, categories }) => {
  const [editingRecord, setEditingRecord] = useState<WeeklyRecord | null>(null);
  const [tempRecord, setTempRecord] = useState<WeeklyRecord | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal form state
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0] || '');

  // Cargar registros desde Supabase al iniciar
  useEffect(() => {
    loadRecordsFromSupabase();
  }, []);

  const loadRecordsFromSupabase = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('weekly_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando desde Supabase:', error);
        return;
      }

      if (data && data.length > 0) {
        // Convertir los datos de Supabase al formato de la aplicación
        const supabaseRecords: WeeklyRecord[] = data.map(item => item.record_data);
        setRecords(supabaseRecords);
      }
    } catch (error) {
      console.error('Error cargando registros:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveRecordToSupabase = async (record: WeeklyRecord) => {
    try {
      // Calcular el total de ofrendas
      const totalOfferings = record.donations
        .filter(d => d.category === 'Diezmo' || d.category === 'Ordinaria')
        .reduce((sum, d) => sum + d.amount, 0);

      const recordData = {
        church_id: 'La Empresa', // O puedes obtenerlo del login
        week_number: calculateWeekNumber(record),
        start_date: new Date(record.year, record.month - 1, record.day).toISOString().split('T')[0],
        end_date: new Date(record.year, record.month - 1, record.day + 6).toISOString().split('T')[0],
        total_offerings: totalOfferings,
        record_data: record // Guardamos todo el objeto
      };

      const { data, error } = await supabase
        .from('weekly_records')
        .upsert(recordData, { onConflict: 'record_data->id' });

      if (error) {
        console.error('Error guardando en Supabase:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error guardando registro:', error);
      return false;
    }
  };

  const deleteRecordFromSupabase = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('weekly_records')
        .delete()
        .eq('record_data->id', recordId);

      if (error) {
        console.error('Error eliminando de Supabase:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error eliminando registro:', error);
      return false;
    }
  };

  const calculateWeekNumber = (record: WeeklyRecord): number => {
    // Función simple para calcular número de semana
    const date = new Date(record.year, record.month - 1, record.day);
    const firstDayOfYear = new Date(record.year, 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  useEffect(() => {
    if (editingRecord) {
      setTempRecord(JSON.parse(JSON.stringify(editingRecord)));
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

  const handleSaveChanges = async () => {
    if (tempRecord) {
      // Actualizar en el estado local
      setRecords(prevRecords => prevRecords.map(r => r.id === tempRecord.id ? tempRecord : r));
      
      // Guardar en Supabase
      const success = await saveRecordToSupabase(tempRecord);
      if (success) {
        console.log('Registro guardado en Supabase');
      }
      
      handleCloseModal();
    }
  };

  const handleDelete = async (recordId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta semana registrada? Esta acción no se puede deshacer.')) {
      // Eliminar del estado local
      setRecords(prevRecords => prevRecords.filter(r => r.id !== recordId));
      
      // Eliminar de Supabase
      const success = await deleteRecordFromSupabase(recordId);
      if (success) {
        console.log('Registro eliminado de Supabase');
      }
    }
  };

  // ... (las funciones handleModalInputChange, handleAddDonation, handleRemoveDonation, handleExportExcel se mantienen igual)

  const selectedMemberName = useMemo(() => selectedMember?.name || '', [selectedMember]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6 text-center bg-white rounded-xl shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Cargando semanas registradas...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6 text-center bg-white rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-700">No hay semanas registradas</h3>
        <p className="mt-2 text-gray-500">Los resúmenes de las semanas que guarde aparecerán aquí.</p>
      </div>
    );
  }

  // ... (el resto del JSX se mantiene igual, solo cambian las funciones handleSaveChanges y handleDelete)
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary">Semanas Registradas</h2>
        <button 
          onClick={loadRecordsFromSupabase}
          className="px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Actualizar
        </button>
      </div>
      
      {/* El resto del JSX permanece exactamente igual */}
      {sortedRecords.map(record => {
        // ... (código de renderizado de cada record)
      })}

      {/* Modal de edición (se mantiene igual) */}
      {editingRecord && tempRecord && (
        // ... (todo el modal permanece igual)
      )}
    </div>
  );
};

export default SemanasRegistradasTab;
};

export default SemanasRegistradasTab;
