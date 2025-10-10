import React, { useState, useEffect } from 'react';
import { Member, Formulas } from '../../types';
import { UserPlusIcon, TrashIcon, PencilIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import GoogleAuth from '../auth/GoogleAuth';

interface AdminPanelTabProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  formulas: Formulas;
  setFormulas: React.Dispatch<React.SetStateAction<Formulas>>;
}

const AdminPanelTab: React.FC<AdminPanelTabProps> = ({
  members, setMembers, categories, setCategories, formulas, setFormulas
}) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingMemberName, setEditingMemberName] = useState('');

  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  
  const [tempFormulas, setTempFormulas] = useState<Formulas>(formulas);
  
  useEffect(() => {
    setTempFormulas(formulas);
  }, [formulas]);

  const handleAddMember = () => {
    if (newMemberName.trim() && !members.some(m => m.name.toLowerCase() === newMemberName.trim().toLowerCase())) {
        const newMember = { id: `m-${Date.now()}`, name: newMemberName.trim() };
        setMembers(prev => [...prev, newMember].sort((a,b) => a.name.localeCompare(b.name)));
        setNewMemberName('');
    } else {
        alert('El nombre del miembro no puede estar vacío o ya existe.');
    }
  };

  const handleDeleteMember = (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar a este miembro?')) {
        setMembers(prev => prev.filter(m => m.id !== id));
    }
  };
  
  const handleStartEditMember = (member: Member) => {
    setEditingMember(member);
    setEditingMemberName(member.name);
  };
  
  const handleSaveEditMember = () => {
    if (editingMember && editingMemberName.trim()) {
        setMembers(prev => prev.map(m => m.id === editingMember.id ? { ...m, name: editingMemberName.trim() } : m)
                                .sort((a,b) => a.name.localeCompare(b.name)));
        setEditingMember(null);
        setEditingMemberName('');
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories(prev => [...prev, newCategory.trim()].sort());
      setNewCategory('');
    } else {
      alert('La categoría no puede estar vacía o ya existe.');
    }
  };
  
  const handleDeleteCategory = (catToDelete: string) => {
    if (window.confirm(`¿Está seguro de que desea eliminar la categoría "${catToDelete}"?`)) {
        setCategories(prev => prev.filter(c => c !== catToDelete));
    }
  };
  
  const handleStartEditCategory = (category: string) => {
    setEditingCategory(category);
    setEditingCategoryName(category);
  };
  
  const handleSaveEditCategory = () => {
    if (editingCategory && editingCategoryName.trim()) {
        setCategories(prev => prev.map(c => c === editingCategory ? editingCategoryName.trim() : c).sort());
        setEditingCategory(null);
        setEditingCategoryName('');
    }
  };
  
  const handleFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempFormulas(prev => ({ ...prev, [e.target.name]: parseFloat(e.target.value) || 0 }));
  };

  const handleSaveFormulas = () => {
    setFormulas(tempFormulas);
    alert('Fórmulas guardadas.');
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-primary">Panel de Administración</h2>

      {/* Google Drive Connection Management */}
       <div className="p-6 bg-white rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-primary mb-2">Conexión con Google Drive</h3>
        <p className="text-sm text-gray-600 mb-4">
          Como administrador, conecta tu cuenta de Google para habilitar el guardado y la sincronización de archivos para todos los usuarios. Esta acción solo es necesaria una vez por sesión o hasta que limpies los datos de tu navegador.
        </p>
        <GoogleAuth />
      </div>

      {/* Members Management */}
      <div className="p-6 bg-white rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-primary mb-4">Gestionar Miembros</h3>
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="text"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            placeholder="Nuevo miembro"
            className="flex-grow p-2 border border-gray-300 rounded-lg"
          />
          <button onClick={handleAddMember} className="p-3 bg-secondary text-white rounded-lg hover:bg-blue-600">
            <UserPlusIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {members.map(member => (
            <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              {editingMember?.id === member.id ? (
                <input type="text" value={editingMemberName} onChange={e => setEditingMemberName(e.target.value)} className="flex-grow p-1 border border-secondary rounded-md" autoFocus />
              ) : (
                <span>{member.name}</span>
              )}
              <div className="flex items-center space-x-2">
                {editingMember?.id === member.id ? (
                    <>
                        <button onClick={handleSaveEditMember} className="p-2 text-green-500 hover:text-green-700"><CheckIcon className="w-5 h-5"/></button>
                        <button onClick={() => setEditingMember(null)} className="p-2 text-red-500 hover:text-red-700"><XMarkIcon className="w-5 h-5"/></button>
                    </>
                ) : (
                    <>
                        <button onClick={() => handleStartEditMember(member)} className="p-2 text-blue-500 hover:text-blue-700"><PencilIcon className="w-5 h-5"/></button>
                        <button onClick={() => handleDeleteMember(member.id)} className="p-2 text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                    </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Categories Management */}
      <div className="p-6 bg-white rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-primary mb-4">Gestionar Categorías</h3>
         <div className="flex items-center space-x-2 mb-4">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nueva categoría"
            className="flex-grow p-2 border border-gray-300 rounded-lg"
          />
          <button onClick={handleAddCategory} className="p-3 bg-secondary text-white rounded-lg hover:bg-blue-600">
            <UserPlusIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {categories.map(cat => (
            <div key={cat} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              {editingCategory === cat ? (
                <input type="text" value={editingCategoryName} onChange={e => setEditingCategoryName(e.target.value)} className="flex-grow p-1 border border-secondary rounded-md" autoFocus />
              ) : (
                <span>{cat}</span>
              )}
              <div className="flex items-center space-x-2">
                 {editingCategory === cat ? (
                    <>
                        <button onClick={handleSaveEditCategory} className="p-2 text-green-500 hover:text-green-700"><CheckIcon className="w-5 h-5"/></button>
                        <button onClick={() => setEditingCategory(null)} className="p-2 text-red-500 hover:text-red-700"><XMarkIcon className="w-5 h-5"/></button>
                    </>
                ) : (
                    <>
                        <button onClick={() => handleStartEditCategory(cat)} className="p-2 text-blue-500 hover:text-blue-700"><PencilIcon className="w-5 h-5"/></button>
                        <button onClick={() => handleDeleteCategory(cat)} className="p-2 text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                    </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Formulas Management */}
      <div className="p-6 bg-white rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-primary mb-4">Gestionar Fórmulas</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="diezmoPercentage" className="block text-sm font-medium text-gray-700">Porcentaje de Diezmo de Diezmo (%)</label>
            <input
              type="number"
              id="diezmoPercentage"
              name="diezmoPercentage"
              value={tempFormulas.diezmoPercentage}
              onChange={handleFormulaChange}
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="remanenteThreshold" className="block text-sm font-medium text-gray-700">Umbral de Remanente (C$)</label>
            <input
              type="number"
              id="remanenteThreshold"
              name="remanenteThreshold"
              value={tempFormulas.remanenteThreshold}
              onChange={handleFormulaChange}
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button onClick={handleSaveFormulas} className="w-full mt-2 py-2 font-semibold text-white transition duration-300 rounded-lg bg-success hover:bg-green-600">
            Guardar Fórmulas
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanelTab;