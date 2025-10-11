import React, { useState } from 'react';
import { Member, Formulas, ChurchInfo } from '../../types';
import { useDrive } from '../../context/GoogleDriveContext';
import { UserPlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';


const DriveStatusIndicator: React.FC = () => {
    const { isAuthenticated, isInitializing, error } = useDrive();

    if (isInitializing) {
        return <div className="p-3 text-sm text-center text-yellow-800 bg-yellow-100 border border-yellow-200 rounded-lg">Inicializando conexión con Google Drive...</div>;
    }

    if (error) {
        return <div className="p-3 text-sm text-center text-red-800 bg-red-100 border border-red-200 rounded-lg">Error de conexión: {error}</div>;
    }

    if (isAuthenticated) {
        return <div className="p-3 text-sm text-center text-green-800 bg-green-100 border border-green-200 rounded-lg">Conectado a Google Drive exitosamente.</div>;
    }

    return <div className="p-3 text-sm text-center text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">No conectado. Verifique las credenciales.</div>;
};


const AdminPanelTab: React.FC<{
    members: Member[];
    setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
    categories: string[];
    setCategories: React.Dispatch<React.SetStateAction<string[]>>;
    formulas: Formulas;
    setFormulas: React.Dispatch<React.SetStateAction<Formulas>>;
    churchInfo: ChurchInfo;
    setChurchInfo: React.Dispatch<React.SetStateAction<ChurchInfo>>;
}> = ({
    members, setMembers, categories, setCategories, formulas, setFormulas, churchInfo, setChurchInfo
}) => {
    const [newMemberName, setNewMemberName] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [tempFormulas, setTempFormulas] = useState<Formulas>(formulas);
    const [tempChurchInfo, setTempChurchInfo] = useState<ChurchInfo>(churchInfo);
    const [editingMember, setEditingMember] = useState<Member | null>(null);

    const handleAddMember = () => {
        if (newMemberName.trim() && !members.some(m => m.name.toLowerCase() === newMemberName.trim().toLowerCase())) {
            const newMember = { id: `m-${Date.now()}`, name: newMemberName.trim() };
            setMembers(prev => [...prev, newMember].sort((a,b) => a.name.localeCompare(b.name)));
            setNewMemberName('');
        } else {
            alert('El nombre del miembro no puede estar vacío o ya existe.');
        }
    };

    const handleStartEdit = (member: Member) => {
        setEditingMember(JSON.parse(JSON.stringify(member))); // Create a copy for editing
    };

    const handleSaveEdit = () => {
        if (editingMember) {
            setMembers(prev => prev.map(m => m.id === editingMember.id ? editingMember : m));
            setEditingMember(null);
        }
    };

    const handleDeleteMember = (id: string) => {
        if (window.confirm("¿Seguro que quiere eliminar este miembro?")) {
            setMembers(prev => prev.filter(m => m.id !== id));
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
        if (window.confirm("¿Seguro que quiere eliminar esta categoría?")) {
            setCategories(prev => prev.filter(c => c !== catToDelete));
        }
    };

    const handleFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTempFormulas(prev => ({...prev, [name]: parseFloat(value) }));
    };

    const handleSaveFormulas = () => {
        setFormulas(tempFormulas);
        alert("Fórmulas guardadas.");
    };

    const handleChurchInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTempChurchInfo(prev => ({...prev, [name]: value }));
    };

    const handleSaveChurchInfo = () => {
        setChurchInfo(tempChurchInfo);
        alert("Información predeterminada guardada.");
    };

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-indigo-900">Panel de Administración</h2>

            <div className="p-6 bg-white rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-indigo-900 mb-4">Estado de Google Drive</h3>
                <p className="text-sm text-gray-600 mb-4">
                    La aplicación se conectará automáticamente a Google Drive al iniciar.
                    A continuación se muestra el estado de la conexión.
                </p>
                <DriveStatusIndicator />
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-indigo-900 mb-4">Información Predeterminada</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="defaultMinister" value={tempChurchInfo.defaultMinister} onChange={handleChurchInfoChange} placeholder="Nombre Ministro Predeterminado" className="p-2 border border-gray-300 rounded-md shadow-sm"/>
                    <input type="text" name="ministerGrade" value={tempChurchInfo.ministerGrade} onChange={handleChurchInfoChange} placeholder="Grado Ministro" className="p-2 border border-gray-300 rounded-md shadow-sm"/>
                    <input type="text" name="district" value={tempChurchInfo.district} onChange={handleChurchInfoChange} placeholder="Distrito" className="p-2 border border-gray-300 rounded-md shadow-sm"/>
                    <input type="text" name="department" value={tempChurchInfo.department} onChange={handleChurchInfoChange} placeholder="Departamento" className="p-2 border border-gray-300 rounded-md shadow-sm"/>
                    <input type="text" name="ministerPhone" value={tempChurchInfo.ministerPhone} onChange={handleChurchInfoChange} placeholder="Tel. Ministro" className="p-2 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                <button onClick={handleSaveChurchInfo} className="mt-4 w-full sm:w-auto px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors">
                    Guardar Información
                </button>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-indigo-900 mb-4">Gestionar Miembros</h3>
                <div className="flex gap-2 mb-4">
                    <input type="text" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="Nuevo miembro" className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm"/>
                    <button onClick={handleAddMember} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                        <UserPlusIcon className="w-5 h-5" />
                    </button>
                </div>
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {members.map(m => (
                        <li key={m.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                            {editingMember?.id === m.id ? (
                                <>
                                    <input 
                                        type="text"
                                        value={editingMember.name}
                                        onChange={(e) => setEditingMember({...editingMember, name: e.target.value})}
                                        className="flex-grow p-1 border border-blue-400 rounded-md"
                                        autoFocus
                                    />
                                    <div className="flex items-center gap-2 ml-2">
                                        <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800"><CheckIcon className="w-5 h-5"/></button>
                                        <button onClick={() => setEditingMember(null)} className="text-red-600 hover:text-red-800"><XMarkIcon className="w-5 h-5"/></button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span>{m.name}</span>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handleStartEdit(m)} className="text-blue-600 hover:text-blue-800"><PencilIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteMember(m.id)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-indigo-900 mb-4">Gestionar Categorías</h3>
                <div className="flex gap-2 mb-4">
                    <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Nueva categoría" className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm"/>
                    <button onClick={handleAddCategory} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                        <UserPlusIcon className="w-5 h-5" />
                    </button>
                </div>
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {categories.map(c => <li key={c} className="flex justify-between items-center p-2 bg-gray-50 rounded-md"><span>{c}</span><button onClick={() => handleDeleteCategory(c)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button></li>)}
                </ul>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-indigo-900 mb-4">Gestionar Fórmulas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="diezmoPercentage" className="block text-sm font-medium text-gray-700">Porcentaje Diezmo de Diezmo (%)</label>
                        <input type="number" name="diezmoPercentage" id="diezmoPercentage" value={tempFormulas.diezmoPercentage} onChange={handleFormulaChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label htmlFor="remanenteThreshold" className="block text-sm font-medium text-gray-700">Umbral Remanente (C$)</label>
                        <input type="number" name="remanenteThreshold" id="remanenteThreshold" value={tempFormulas.remanenteThreshold} onChange={handleFormulaChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                </div>
                <button onClick={handleSaveFormulas} className="mt-4 w-full sm:w-auto px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors">
                    Guardar Fórmulas
                </button>
            </div>
            
        </div>
    );
};

export default AdminPanelTab;