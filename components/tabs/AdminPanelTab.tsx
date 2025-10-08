
import React, { useState, useEffect } from 'react';
import { Member, Formulas } from '../../types';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface AdminPanelTabProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  formulas: Formulas;
  setFormulas: React.Dispatch<React.SetStateAction<Formulas>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
}

const AdminPanelTab: React.FC<AdminPanelTabProps> = ({ members, setMembers, formulas, setFormulas, categories, setCategories }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [newMemberName, setNewMemberName] = useState('');
  const [editingMember, setEditingMember] = useState<{id: string; name: string} | null>(null);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{oldName: string; newName: string} | null>(null);
  
  const [tempFormulas, setTempFormulas] = useState<Formulas>(formulas);

  useEffect(() => {
    setTempFormulas(formulas);
  }, [formulas]);

  const handleAuth = () => {
    if (password === 'NIMT02') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Clave incorrecta.');
    }
  };

  const handleAddMember = () => {
    if (newMemberName.trim() && !members.some(m => m.name.toLowerCase() === newMemberName.trim().toLowerCase())) {
      setMembers(prev => [...prev, { id: `m-${Date.now()}`, name: newMemberName.trim() }]);
      setNewMemberName('');
    }
  };
  
  const handleDeleteMember = (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este miembro?')) {
        setMembers(prev => prev.filter(m => m.id !== id));
    }
  };
  
  const handleEditMember = (id: string, newName: string) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, name: newName } : m));
    setEditingMember(null);
  };
  
    const handleAddCategory = () => {
    if (newCategoryName.trim() && !categories.some(c => c.toLowerCase() === newCategoryName.trim().toLowerCase())) {
        setCategories(prev => [...prev, newCategoryName.trim()]);
        setNewCategoryName('');
    }
  };

  const handleDeleteCategory = (name: string) => {
      if (window.confirm(`¿Está seguro de que desea eliminar la categoría "${name}"? Esta acción no se puede deshacer.`)) {
          setCategories(prev => prev.filter(c => c !== name));
      }
  };

  const handleEditCategory = (oldName: string, newName: string) => {
      if (newName.trim() && !categories.some(c => c.toLowerCase() === newName.trim().toLowerCase())) {
          setCategories(prev => prev.map(c => c === oldName ? newName.trim() : c));
          setEditingCategory(null);
      } else {
          alert("El nuevo nombre de categoría no puede estar vacío o ya existe.");
      }
  };

  const handleSaveFormulas = () => {
    setFormulas(tempFormulas);
    alert('Configuración de fórmulas guardada. Esto aplicará para los nuevos registros de semana.');
  };

  if (!isAuthenticated) {
    return (
        <div className="p-6 mx-auto mt-10 max-w-md bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-primary mb-4">Acceso de Administrador</h2>
            <p className="text-gray-600 mb-4">Por favor, ingrese la clave para acceder al panel de administración.</p>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Clave de administrador"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button onClick={handleAuth} className="w-full mt-4 py-2 text-white bg-secondary rounded-lg hover:bg-blue-600">
                Acceder
            </button>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-primary">Panel de Administración</h2>
      
      <div className="p-6 bg-white rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-primary mb-4">Gestión de Miembros</h3>
        <div className="flex space-x-2 mb-4">
          <input 
            type="text"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            placeholder="Nombre del nuevo miembro"
            className="flex-grow p-2 border border-gray-300 rounded-md"
          />
          <button onClick={handleAddMember} className="px-4 py-2 text-white bg-success rounded-lg hover:bg-green-600">Añadir</button>
        </div>
        <ul className="space-y-2 max-h-96 overflow-y-auto">
          {members.map(member => (
            <li key={member.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100">
              {editingMember?.id === member.id ? (
                <input 
                    type="text" 
                    value={editingMember.name} 
                    onChange={(e) => setEditingMember({...editingMember, name: e.target.value})}
                    className="flex-grow p-1 border border-gray-300 rounded-md"
                    autoFocus
                />
              ) : (
                <span>{member.name}</span>
              )}
              <div className="flex space-x-2">
                 {editingMember?.id === member.id ? (
                     <>
                        <button onClick={() => handleEditMember(member.id, editingMember.name)} className="p-2 text-green-600 hover:text-green-800"><CheckIcon className="w-5 h-5"/></button>
                        <button onClick={() => setEditingMember(null)} className="p-2 text-gray-500 hover:text-gray-700"><XMarkIcon className="w-5 h-5"/></button>
                     </>
                 ) : (
                    <button onClick={() => setEditingMember({id: member.id, name: member.name})} className="p-2 text-blue-500 hover:text-blue-700"><PencilIcon className="w-5 h-5"/></button>
                 )}
                <button onClick={() => handleDeleteMember(member.id)} className="p-2 text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-6 bg-white rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-primary mb-4">Gestión de Categorías</h3>
        <div className="flex space-x-2 mb-4">
            <input 
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nombre de la nueva categoría"
                className="flex-grow p-2 border border-gray-300 rounded-md"
            />
            <button onClick={handleAddCategory} className="px-4 py-2 text-white bg-success rounded-lg hover:bg-green-600">Añadir</button>
        </div>
        <ul className="space-y-2 max-h-96 overflow-y-auto">
            {categories.map(cat => (
                <li key={cat} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100">
                {editingCategory?.oldName === cat ? (
                    <input 
                        type="text" 
                        value={editingCategory.newName} 
                        onChange={(e) => setEditingCategory({...editingCategory, newName: e.target.value})}
                        className="flex-grow p-1 border border-gray-300 rounded-md"
                        autoFocus
                    />
                ) : (
                    <span>{cat}</span>
                )}
                <div className="flex space-x-2">
                    {editingCategory?.oldName === cat ? (
                        <>
                            <button onClick={() => handleEditCategory(cat, editingCategory.newName)} className="p-2 text-green-600 hover:text-green-800"><CheckIcon className="w-5 h-5"/></button>
                            <button onClick={() => setEditingCategory(null)} className="p-2 text-gray-500 hover:text-gray-700"><XMarkIcon className="w-5 h-5"/></button>
                        </>
                    ) : (
                        <button onClick={() => setEditingCategory({oldName: cat, newName: cat})} className="p-2 text-blue-500 hover:text-blue-700"><PencilIcon className="w-5 h-5"/></button>
                    )}
                    <button onClick={() => handleDeleteCategory(cat)} className="p-2 text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                </div>
                </li>
            ))}
        </ul>
      </div>

      <div className="p-6 bg-white rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-primary mb-4">Configuración de Fórmulas</h3>
         <p className="text-sm text-gray-500 mb-4">Estos valores se usarán por defecto para las nuevas semanas que registre. El umbral de remanente para una semana ya guardada no cambiará.</p>
        <div className="space-y-4">
            <div>
                <label htmlFor="diezmoPercentage" className="block text-sm font-medium text-gray-700">Porcentaje para Diezmo de Diezmo (%)</label>
                <input 
                    type="number"
                    id="diezmoPercentage"
                    value={formulas.diezmoPercentage}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                    readOnly
                />
            </div>
             <div>
                <label htmlFor="remanenteThreshold" className="block text-sm font-medium text-gray-700">Umbral para Remanente (C$)</label>
                <input 
                    type="number"
                    id="remanenteThreshold"
                    value={tempFormulas.remanenteThreshold}
                    onChange={(e) => setTempFormulas({...tempFormulas, remanenteThreshold: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
            </div>
            <button onClick={handleSaveFormulas} className="w-full mt-4 py-2 text-white bg-secondary rounded-lg hover:bg-blue-600">
                Guardar Configuración
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanelTab;
