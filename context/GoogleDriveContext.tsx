import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { WeeklyRecord, Donation } from '../types';

declare global {
    interface Window {
        XLSX: any;
        jspdf: any;
    }
}

interface GoogleDriveContextType {
    isAuthenticated: boolean;
    isInitializing: boolean;
    error: string | null;
    uploadWeeklyReport: (fileName: string, blob: Blob) => Promise<void>;
    loadAndParseWeeklyReports: () => Promise<WeeklyRecord[]>;
    uploadMonthlyReport: (fileName: string, blob: Blob) => Promise<void>;
}

const GoogleDriveContext = createContext<GoogleDriveContextType | undefined>(undefined);

export const useDrive = (): GoogleDriveContextType => {
    const context = useContext(GoogleDriveContext);
    if (!context) {
        throw new Error('useDrive must be used within a GoogleDriveProvider');
    }
    return context;
};

export const GoogleDriveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getAccessToken = useCallback(async () => {
        setError(null);
        
        const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
        const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
        const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
            setError("Credenciales de Google Drive no configuradas en las variables de entorno.");
            setIsInitializing(false);
            return;
        }

        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: GOOGLE_CLIENT_ID,
                    client_secret: GOOGLE_CLIENT_SECRET,
                    refresh_token: GOOGLE_REFRESH_TOKEN,
                    grant_type: 'refresh_token',
                }),
            });
            const data = await response.json();
            if (data.access_token) {
                setAccessToken(data.access_token);
            } else {
                throw new Error(data.error_description || 'No se pudo obtener el token de acceso.');
            }
        } catch (err) {
            console.error("Error getting access token:", err);
            setError(err instanceof Error ? err.message : 'Error desconocido de autenticación.');
        } finally {
            setIsInitializing(false);
        }
    }, []);

    useEffect(() => {
        getAccessToken();
    }, [getAccessToken]);

    const uploadFile = async (fileName: string, blob: Blob, folderId: string | undefined) => {
        if (!accessToken) throw new Error("No autenticado. No se puede subir el archivo.");
        if (!folderId) throw new Error("El ID de la carpeta de destino no está configurado en las variables de entorno.");


        const metadata = { name: fileName, parents: [folderId] };
        
        // Check if file exists to update it
        const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(fileName)}'+and+'${folderId}'+in+parents+and+trashed=false`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const searchResult = await searchResponse.json();
        
        const fileExists = searchResult.files && searchResult.files.length > 0;
        const fileId = fileExists ? searchResult.files[0].id : null;
        
        const url = fileExists
            ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
            : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);

        const response = await fetch(url, {
            method: fileExists ? 'PATCH' : 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` },
            body: form,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error en subida de archivo: ${errorData.error.message}`);
        }
    };

    const uploadWeeklyReport = (fileName: string, blob: Blob) => uploadFile(fileName, blob, process.env.DRIVE_WEEKLY_REPORTS_FOLDER_ID);
    const uploadMonthlyReport = (fileName: string, blob: Blob) => uploadFile(fileName, blob, process.env.DRIVE_MONTHLY_REPORTS_FOLDER_ID);

    const loadAndParseWeeklyReports = async (): Promise<WeeklyRecord[]> => {
        if (!accessToken) throw new Error("No autenticado. No se pueden cargar los archivos.");
        
        const DRIVE_WEEKLY_REPORTS_FOLDER_ID = process.env.DRIVE_WEEKLY_REPORTS_FOLDER_ID;
        if (!DRIVE_WEEKLY_REPORTS_FOLDER_ID) throw new Error("El ID de la carpeta de reportes semanales no está configurado.");


        const response = await fetch(`https://www.googleapis.com/drive/v3/files?q='${DRIVE_WEEKLY_REPORTS_FOLDER_ID}'+in+parents+and+mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'+and+trashed=false&fields=files(id,name,createdTime)`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const fileList = await response.json();

        if (!fileList.files) return [];

        const parsedRecords: WeeklyRecord[] = [];

        for (const file of fileList.files) {
            try {
                const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                const fileBuffer = await fileResponse.arrayBuffer();
                const workbook = window.XLSX.read(fileBuffer, { type: 'buffer' });
                const detailSheet = workbook.Sheets["Detalle de Ofrendas"];
                if (!detailSheet) continue;

                const donationsJson: { Miembro: string; Categoría: string; Monto: number }[] = window.XLSX.utils.sheet_to_json(detailSheet);
                const donations: Donation[] = donationsJson.map((d, index) => ({
                    id: `d-${file.id}-${index}`,
                    memberId: `m-drive-${d.Miembro}`, // Placeholder ID
                    memberName: d.Miembro,
                    category: d.Categoría,
                    amount: d.Monto,
                }));
                
                const nameParts = file.name.replace('.xlsx', '').split('-');
                const day = parseInt(nameParts[2]);
                const month = parseInt(nameParts[3]);
                const year = parseInt(nameParts[4]);
                
                const summarySheet = workbook.Sheets["Resumen"];
                const minister = summarySheet['B4'] ? summarySheet['B4'].v : 'N/A';
                
                parsedRecords.push({
                    id: file.id, day, month, year, minister, donations,
                    formulas: { diezmoPercentage: 10, remanenteThreshold: 5000 } // Use default or parse from sheet if available
                });
            } catch(e) {
                console.error(`Error parsing file ${file.name}:`, e);
                // Continue to next file
            }
        }
        return parsedRecords;
    };

    const value = {
        isAuthenticated: !!accessToken,
        isInitializing,
        error,
        uploadWeeklyReport,
        loadAndParseWeeklyReports,
        uploadMonthlyReport,
    };

    return (
        <GoogleDriveContext.Provider value={value}>
            {children}
        </GoogleDriveContext.Provider>
    );
};