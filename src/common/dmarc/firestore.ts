import { initializeApp as initializeClientApp, getApps as getClientApps } from 'firebase/app';
import { getFirestore as getClientFirestore, collection, doc, getDoc, setDoc, getDocs, deleteDoc, query, where, orderBy, Timestamp, limit } from 'firebase/firestore';
import { ParsedDmarcReport } from './types';
import { getEnvironment } from '../config/environment';

// Use client-side Firebase for simplicity
let db: ReturnType<typeof getClientFirestore> | null = null;

function getFirestoreDB() {
  if (!db) {
    const config = getEnvironment();

    if (!getClientApps().length) {
      initializeClientApp(config);
    }

    db = getClientFirestore();
  }

  return db;
}

export class DmarcFirestoreService {
  private reportsCollection = 'dmarc_reports';
  private configCollection = 'dmarc_config';

  /**
   * Remove undefined values from an object recursively
   */
  private removeUndefined(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefined(item));
    }

    if (typeof obj === 'object' && !(obj instanceof Date)) {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          cleaned[key] = this.removeUndefined(obj[key]);
        }
      }
      return cleaned;
    }

    return obj;
  }

  /**
   * Save a parsed DMARC report to Firestore
   */
  async saveReport(report: ParsedDmarcReport): Promise<void> {
    try {
      const db = getFirestoreDB();
      const docId = String(report.id); // Ensure ID is a string
      const docRef = doc(db, this.reportsCollection, docId);

      // Clean the report data to remove undefined values
      const cleanedReport = this.removeUndefined({
        ...report,
        id: docId, // Store as string
        processedAt: Timestamp.fromDate(report.processedAt),
      });

      await setDoc(docRef, cleanedReport);

      console.log(`Saved report ${docId} to Firestore`);
    } catch (error) {
      console.error('Error saving report to Firestore:', error);
      throw error;
    }
  }

  /**
   * Convert Firestore Timestamp to Date
   */
  private toDate(timestamp: any): Date {
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    if (timestamp && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    return new Date();
  }

  /**
   * Get all reports
   */
  async getAllReports(): Promise<ParsedDmarcReport[]> {
    try {
      const db = getFirestoreDB();
      const reportsRef = collection(db, this.reportsCollection);
      const q = query(reportsRef, orderBy('processedAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          ...data,
          processedAt: this.toDate(data.processedAt),
        } as ParsedDmarcReport;
      });
    } catch (error) {
      console.error('Error fetching reports from Firestore:', error);
      throw error;
    }
  }

  /**
   * Get reports within a date range
   */
  async getReportsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<ParsedDmarcReport[]> {
    try {
      const db = getFirestoreDB();
      const reportsRef = collection(db, this.reportsCollection);
      const q = query(
        reportsRef,
        where('processedAt', '>=', Timestamp.fromDate(startDate)),
        where('processedAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('processedAt', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          ...data,
          processedAt: this.toDate(data.processedAt),
        } as ParsedDmarcReport;
      });
    } catch (error) {
      console.error('Error fetching reports by date range:', error);
      throw error;
    }
  }

  /**
   * Get a specific report by ID
   */
  async getReportById(reportId: string): Promise<ParsedDmarcReport | null> {
    try {
      const db = getFirestoreDB();
      const docId = String(reportId); // Ensure ID is a string
      const docRef = doc(db, this.reportsCollection, docId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        ...data,
        processedAt: this.toDate(data.processedAt),
      } as ParsedDmarcReport;
    } catch (error) {
      console.error('Error fetching report by ID:', error);
      throw error;
    }
  }

  /**
   * Check if report already exists
   */
  async reportExists(reportId: string): Promise<boolean> {
    try {
      const db = getFirestoreDB();
      const docId = String(reportId); // Ensure ID is a string
      const docRef = doc(db, this.reportsCollection, docId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('Error checking report existence:', error);
      return false;
    }
  }

  /**
   * Delete a report
   */
  async deleteReport(reportId: string): Promise<void> {
    try {
      const db = getFirestoreDB();
      const docId = String(reportId); // Ensure ID is a string
      const docRef = doc(db, this.reportsCollection, docId);
      await deleteDoc(docRef);
      console.log(`Deleted report ${docId} from Firestore`);
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  /**
   * Save Gmail configuration
   */
  async saveGmailConfig(config: {
    email: string;
    appPassword: string;
    label: string;
  }): Promise<void> {
    try {
      const db = getFirestoreDB();
      const docRef = doc(db, this.configCollection, 'gmail');
      await setDoc(docRef, {
        ...config,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error saving Gmail config:', error);
      throw error;
    }
  }

  /**
   * Get Gmail configuration
   */
  async getGmailConfig(): Promise<{
    email: string;
    appPassword: string;
    label: string;
  } | null> {
    try {
      const db = getFirestoreDB();
      const docRef = doc(db, this.configCollection, 'gmail');
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        email: data.email,
        appPassword: data.appPassword,
        label: data.label,
      };
    } catch (error) {
      console.error('Error fetching Gmail config:', error);
      throw error;
    }
  }

  /**
   * Get report count
   */
  async getReportCount(): Promise<number> {
    try {
      const db = getFirestoreDB();
      const reportsRef = collection(db, this.reportsCollection);
      const snapshot = await getDocs(reportsRef);
      return snapshot.size;
    } catch (error) {
      console.error('Error fetching report count:', error);
      return 0;
    }
  }
}
