import React, { useState, useEffect, useCallback } from 'react';
import { Tab, WeeklyRecord, Member, Formulas, MonthlyReport, ChurchInfo } from '../types';
import { INITIAL_MEMBERS, INITIAL_CATEGORIES, DEFAULT_FORMULAS, DEFAULT_CHURCH_INFO } from '../constants';
import Header from '../components/layout/Header';
import BottomNav from '../components/layout/BottomNav';
import RegistroOfrendasTab from '../components/tabs/RegistroOfrendasTab';
import ResumenFinancieroTab from '../components/tabs/ResumenFinancieroTab';
import SemanasRegistradasTab from '../components/tabs/SemanasRegistradasTab';
import ResumenMensualTab from '../components/tabs/ResumenMensualTab';
import AdminPanelTab from '../components/tabs/AdminPanelTab';
import InformeMensualTab from '../components/tabs/InformeMensualTab';

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
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [churchInfo, setChurchInfo] = useState<ChurchInfo>(DEFAULT_CHURCH_INFO);

  useEffect(() => {
    const loadSafe = <T,>(key: string, fallback: T): T => {
      try {
        const item = localStorage.getItem(key);
        if (item === null) {
          return fallback;
        }
        
        const parsed = JSON.parse(item);
        
        if (parsed === null) {
           console.warn(`Parsed null from localStorage for key '${key}'. Using fallback to prevent crash.`);
           return fallback;
        }
        
        return parsed;
      } catch (error) {
        console.error(`Error parsing data for '${key}' from localStorage. Clearing corrupted data.`, error);
        localStorage.removeItem(key);
        return fallback;
      }
    };

    setMembers(loadSafe<Member[]>('churchMembers', INITIAL_MEMBERS));
    setCategories(loadSafe<string[]>('churchCategories', INITIAL_CATEGORIES));
    setWeeklyRecords(loadSafe<WeeklyRecord[]>('churchWeeklyRecords', []));
    setFormulas(loadSafe<Formulas>('churchFormulas', DEFAULT_FORMULAS));
    setMonthlyReports(loadSafe<MonthlyReport[]>('churchMonthlyReports', []));
    setChurchInfo(loadSafe<ChurchInfo>('churchInfo', DEFAULT_CHURCH_INFO));
  }, []);

  const persistData = useCallback(<T,>(key: string, data: T) => {
    localStorage.setItem(key, JSON.stringify(data));
  }, []);

  useEffect(() => { persistData('churchMembers', members) }, [members, persistData]);
  useEffect(() => { persistData('churchCategories', categories) }, [categories, persistData]);
  useEffect(() => { persistData('churchWeeklyRecords', weeklyRecords) }, [weeklyRecords, persistData]);
  useEffect(() => { persistData('churchFormulas', formulas) }, [formulas, persistData]);
  useEffect(() => { persistData('churchMonthlyReports', monthlyReports) }, [monthlyReports, persistData]);
  useEffect(() => { persistData('churchInfo', churchInfo) }, [churchInfo, persistData]);


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
            churchInfo={churchInfo}
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
      case 'informe':
        return <InformeMensualTab 
                    records={weeklyRecords} 
                    formulas={formulas} 
                    savedReports={monthlyReports}
                    setSavedReports={setMonthlyReports}
                    churchInfo={churchInfo}
                />;
      case 'admin':
        return (
          <AdminPanelTab
            members={members}
            setMembers={setMembers}
            categories={categories}
            setCategories={setCategories}
            formulas={formulas}
            setFormulas={setFormulas}
            churchInfo={churchInfo}
            setChurchInfo={setChurchInfo}
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