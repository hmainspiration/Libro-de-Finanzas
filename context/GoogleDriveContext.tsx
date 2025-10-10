import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { WeeklyRecord, Donation, Formulas } from '../types';
import { GOOGLE_CLIENT_ID, DRIVE_WEEKLY_REPORTS_FOLDER_ID, DRIVE_MONTHLY_REPORTS_FOLDER_ID } from '../constants';

declare global {
  interface Window {
    XLSX: any;
    google: any;
  }
}

interface GoogleDriveContextType {
    isAuthenticated: boolean;
    isConfigured: boolean;
    user: { name: string; email: string; picture: string } | null;
    signIn: () => void;
    signOut: () => void;
    uploadWeeklyReport: (fileName: string, content: Blob) => Promise<any>;
    loadAndParseWeeklyReports: () => Promise<WeeklyRecord[]>;
    uploadMonthlyReport: (fileName: string, content: Blob) => Promise<any>;
}

const GoogleDriveContext = createContext<GoogleDriveContextType>({
    isAuthenticated: false,
    isConfigured: false,
    user: null,
    signIn: () => {},
    signOut: () => {},
    uploadWeeklyReport: async () => {},
    loadAndParseWeeklyReports: async () => [],
    uploadMonthlyReport: async () => {},
});

export const useDrive = () => useContext(GoogleDriveContext);

export const GoogleDriveProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [tokenClient, setTokenClient] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('driveAccessToken'));
    const isConfigured = GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('PEGA_AQUI');

    const getFreshAccessToken = useCallback(async () => {
        const refreshToken = localStorage.getItem('driveRefreshToken');
        if (!refreshToken) {
            signOut();
            throw new Error("Refresh token not found. Please sign in again.");
        }

        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: GOOGLE_CLIENT_ID,
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token',
                }),
            });

            if (!response.ok) {
                 const errorData = await response.json();
                 console.error("Failed to refresh token:", errorData);
                 signOut(); // Force sign out if refresh fails
                 throw new Error(`Could not refresh access token. ${errorData.error_description || ''}`);
            }

            const data = await response.json();
            const newAccessToken = data.access_token;
            localStorage.setItem('driveAccessToken', newAccessToken);
            setAccessToken(newAccessToken);
            return newAccessToken;

        } catch (error) {
            console.error(error);
            signOut();
            throw error;
        }
    }, []);

    const uploadFile = async (fileName: string, content: Blob, folderId: string) => {
        if (!accessToken) throw new Error("Not authenticated with Google Drive.");

        const tryUpload = async (token: string) => {
             const metadata = { name: fileName, parents: [folderId] };
            
            const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name='${fileName}' and '${folderId}' in parents and trashed=false`)}&fields=files(id)`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!searchResponse.ok) {
                const errorData = await searchResponse.json();
                throw new Error(`File search error: ${errorData.error?.message || 'Unknown search error'}`);
            }

            const searchData = await searchResponse.json();
            const fileId = searchData.files?.[0]?.id;

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', content);

            const uploadUrl = fileId
                ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
                : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
            
            const method = fileId ? 'PATCH' : 'POST';

            const uploadResponse = await fetch(uploadUrl, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: form
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(`File upload error: ${errorData.error?.message || 'Unknown upload error'}`);
            }
            return uploadResponse.json();
        };

        try {
            return await tryUpload(accessToken);
        } catch (error: any) {
            if (error.message.includes('401') || error.message.includes('Invalid Credentials')) {
                console.log('Access token expired, refreshing...');
                const newToken = await getFreshAccessToken();
                return await tryUpload(newToken);
            } else {
                 console.error("Detailed upload error:", error);
                 throw error;
            }
        }
    };

    useEffect(() => {
        if (!isConfigured || !window.google) {
             // Wait for the GSI script to load and populate window.google
            return;
        }

        const client = window.google.accounts.oauth2.initCodeClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive',
            callback: async (response: any) => {
                if (response.code) {
                    try {
                        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: new URLSearchParams({
                                code: response.code,
                                client_id: GOOGLE_CLIENT_ID,
                                redirect_uri: window.location.origin, // Dynamic redirect URI
                                grant_type: 'authorization_code'
                            })
                        });
                        const tokens = await tokenResponse.json();
                        if (tokens.refresh_token) {
                            localStorage.setItem('driveRefreshToken', tokens.refresh_token);
                        }
                        localStorage.setItem('driveAccessToken', tokens.access_token);
                        setAccessToken(tokens.access_token);
                    } catch (error) {
                         console.error("Error exchanging code for token:", error);
                    }
                }
            },
        });
        setTokenClient(client);

        const storedUser = localStorage.getItem('driveUser');
        if (storedUser) setUser(JSON.parse(storedUser));

    }, [isConfigured]);

    useEffect(() => {
        const fetchUserInfo = async () => {
            if (accessToken && !user) {
                try {
                    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                    if (response.ok) {
                        const userInfo = await response.json();
                        setUser(userInfo);
                        localStorage.setItem('driveUser', JSON.stringify(userInfo));
                    } else {
                        throw new Error('Failed to fetch user info');
                    }
                } catch (error) {
                    console.log('Could not fetch user info, trying to refresh token...');
                    try {
                       await getFreshAccessToken(); // This will trigger a re-render and another attempt
                    } catch (refreshError) {
                       console.error("Failed to refresh token for user info fetch:", refreshError);
                       signOut();
                    }
                }
            }
        };
        fetchUserInfo();
    }, [accessToken, user, getFreshAccessToken]);
    
    const signIn = () => {
        if (tokenClient) {
            tokenClient.requestCode();
        }
    };

    const signOut = () => {
        localStorage.removeItem('driveAccessToken');
        localStorage.removeItem('driveRefreshToken');
        localStorage.removeItem('driveUser');
        setAccessToken(null);
        setUser(null);
    };

    const uploadWeeklyReport = (fileName: string, content: Blob) => uploadFile(fileName, content, DRIVE_WEEKLY_REPORTS_FOLDER_ID);
    const uploadMonthlyReport = (fileName: string, content: Blob) => uploadFile(fileName, content, DRIVE_MONTHLY_REPORTS_FOLDER_ID);

    const loadAndParseWeeklyReports = async (): Promise<WeeklyRecord[]> => {
        if (!accessToken) throw new Error("Not authenticated. Cannot sync from Drive.");
        // This function would also need the token refresh logic if it's a long operation
        // For simplicity, assuming token is valid for now.
        // In a real app, wrap API calls in a helper that refreshes tokens automatically.
        const folderId = DRIVE_WEEKLY_REPORTS_FOLDER_ID;
        const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`'${folderId}' in parents and mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' and trashed=false`)}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!response.ok) throw new Error("Could not list files from Drive.");

        const { files } = await response.json();
        const records: WeeklyRecord[] = [];

        for (const file of files) {
            try {
                const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                const arrayBuffer = await fileRes.arrayBuffer();
                
                const wb = window.XLSX.read(arrayBuffer, { type: 'buffer' });
                const summarySheet = wb.Sheets["Resumen"];
                const donationsSheet = wb.Sheets["Detalle de Ofrendas"];

                if (!summarySheet || !donationsSheet) continue;
                
                const dateCell = summarySheet['B3']?.v ?? '0/0/0';
                const [day, month, year] = dateCell.split('/').map(Number);
                const minister = summarySheet['B4']?.v ?? 'N/A';
                
                const donationsJson = window.XLSX.utils.sheet_to_json(donationsSheet);
                const donations: Donation[] = donationsJson.map((d: any, index: number) => ({
                    id: `d-${file.id}-${index}`,
                    memberId: `m-drive-${d.Miembro?.replace(/\s+/g, '') || `unknown${index}`}`,
                    memberName: d.Miembro || 'Miembro Desconocido',
                    category: d.Categoría || 'Sin Categoria',
                    amount: d.Monto || 0,
                }));
                
                const formulas: Formulas = { diezmoPercentage: 10, remanenteThreshold: 5000 };
                const summaryAOA: any[][] = window.XLSX.utils.sheet_to_json(summarySheet, { header: 1 });
                const diezmoRow = summaryAOA.find(r => r[0]?.toString().includes('Diezmo de Diezmo'));
                if (diezmoRow?.[0]) {
                    const match = diezmoRow[0].toString().match(/\((\d+)%\)/);
                    if (match) formulas.diezmoPercentage = parseInt(match[1]);
                }
                const remanenteRow = summaryAOA.find(r => r[0]?.toString().includes('Remanente'));
                if (remanenteRow?.[0]) {
                    const match = remanenteRow[0].toString().match(/Umbral C\$ ([\d,.]+)/);
                    if (match) formulas.remanenteThreshold = parseFloat(match[1].replace(/,/g, ''));
                }

                records.push({
                    id: `wr-drive-${file.id}`,
                    day, month, year, minister,
                    donations,
                    formulas,
                });
            } catch (err) {
                console.error(`Error processing file ${file.name}:`, err);
            }
        }
        return records;
    };
    
    return (
        <GoogleDriveContext.Provider value={{ isAuthenticated: !!accessToken, isConfigured, user, signIn, signOut, uploadWeeklyReport, loadAndParseWeeklyReports, uploadMonthlyReport }}>
            {children}
        </GoogleDriveContext.Provider>
    );
};