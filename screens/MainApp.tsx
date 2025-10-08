import React, { useState, useEffect, useCallback } from 'react';
import { Tab, WeeklyRecord, Member, Formulas } from '../types';
import { INITIAL_MEMBERS, INITIAL_CATEGORIES, DEFAULT_FORMULAS } from '../constants';
import Header from '../components/layout/Header';
import BottomNav from '../components/layout/BottomNav';
import RegistroOfrendasTab from '../components/tabs/RegistroOfrendasTab';
import ResumenFinancieroTab from '../components/tabs/ResumenFinancieroTab';
import SemanasRegistradasTab from '../components/tabs/SemanasRegistradasTab';
import ResumenMensualTab from '../components/tabs/ResumenMensualTab';
import AdminPanelTab from '../components/tabs/AdminPanelTab';

interface MainAppProps {
  onLogout: () => void;
}

const MainApp: React.FC<MainAppProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('register');
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [weeklyRecords, setWeeklyRecords] = useState<WeeklyRecord[]>([]);
  const [currentRecord, setCurrentRecord] = useState<WeeklyRecord | null>(null);
  const [formulas, setFormulas] = useState<Formulas>(DEFAULT_FORMULAS);

  useEffect(() => {
    const savedMembers = localStorage.getItem('churchMembers');
    setMembers(savedMembers ? JSON.parse(savedMembers) : INITIAL_MEMBERS);

    const savedCategories = localStorage.getItem('churchCategories');
    setCategories(savedCategories ? JSON.parse(savedCategories) : INITIAL_CATEGORIES);

    const savedRecords = localStorage.getItem('churchWeeklyRecords');
    setWeeklyRecords(savedRecords ? JSON.parse(savedRecords) : []);

    const savedFormulas = localStorage.getItem('churchFormulas');
    setFormulas(savedFormulas ? JSON.parse(savedFormulas) : DEFAULT_FORMULAS);
  }, []);

  const persistData = useCallback(<T,>(key: string, data: T) => {
    localStorage.setItem(key, JSON.stringify(data));
  }, []);

  useEffect(() => { persistData('churchMembers', members) }, [members, persistData]);
  useEffect(() => { persistData('churchCategories', categories) }, [categories, persistData]);
  useEffect(() => { persistData('churchWeeklyRecords', weeklyRecords) }, [weeklyRecords, persistData]);
  useEffect(() => { persistData('churchFormulas', formulas) }, [formulas, persistData]);

  const handleSaveCurrentRecord = () => {
    if (!currentRecord) return;

    const existingIndex = weeklyRecords.findIndex(r => r.id === currentRecord.id);
    if (existingIndex > -1) {
      const updatedRecords = [...weeklyRecords];
      updatedRecords[existingIndex] = currentRecord;
      setWeeklyRecords(updatedRecords);
    } else {
      setWeeklyRecords(prev => [...prev, currentRecord]);
    }
    setCurrentRecord(null);
    setActiveTab('history');
  };

  const startNewRecord = () => {
    setCurrentRecord(null);
    setActiveTab('register');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'register':
        return (
          <RegistroOfrendasTab
            currentRecord={currentRecord}
            setCurrentRecord={setCurrentRecord}
            members={members}
            setMembers={setMembers}
            categories={categories}
            setCategories={setCategories}
            onSaveRecord={handleSaveCurrentRecord}
            onStartNew={startNewRecord}
            defaultFormulas={formulas}
            weeklyRecords={weeklyRecords}
          />
        );
      case 'summary':
        return <ResumenFinancieroTab currentRecord={currentRecord} categories={categories} />;
      case 'history':
        return <SemanasRegistradasTab 
                    records={weeklyRecords} 
                    setRecords={setWeeklyRecords}
                    members={members}
                    categories={categories}
                />;
      case 'monthly':
        return <ResumenMensualTab records={weeklyRecords} categories={categories} />;
      case 'admin':
        return (
          <AdminPanelTab
            members={members}
            setMembers={setMembers}
            categories={categories}
            setCategories={setCategories}
            formulas={formulas}
            setFormulas={setFormulas}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header onLogout={onLogout} />
      <main className="flex-grow p-4 pb-24 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
         {renderContent()}
        </div>
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default MainApp;