import { initializeApp as initializeClientApp, getApps as getClientApps } from 'firebase/app';
import { getFirestore as getClientFirestore, collection, doc, getDoc, setDoc, getDocs, deleteDoc, query, where, orderBy, Timestamp, writeBatch } from 'firebase/firestore';
import { GmailCursor, ParsedDmarcReport } from './types';
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
  private removeUndefined(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefined(item));
    }

    if (typeof obj === 'object' && !(obj instanceof Date)) {
      const cleaned: Record<string, unknown> = {};
      const objectWithIndex = obj as Record<string, unknown>;
      for (const key in objectWithIndex) {
        if (objectWithIndex[key] !== undefined) {
          cleaned[key] = this.removeUndefined(objectWithIndex[key]);
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
   * Save the reports that are not already stored, in one batched write.
   * Existence checks run in parallel rather than one round trip per report.
   */
  async saveNewReports(reports: ParsedDmarcReport[]): Promise<{ saved: number; skipped: number }> {
    // A report can arrive twice in one batch (e.g. a resent email); keep the first.
    const unique = [...new Map(reports.map((r) => [String(r.id), r])).values()];
    const exists = await Promise.all(unique.map((r) => this.reportExists(r.id)));
    const fresh = unique.filter((_, i) => !exists[i]);

    const db = getFirestoreDB();
    // Firestore caps a batch at 500 writes.
    for (let i = 0; i < fresh.length; i += 500) {
      const batch = writeBatch(db);
      for (const report of fresh.slice(i, i + 500)) {
        const docId = String(report.id);
        batch.set(
          doc(db, this.reportsCollection, docId),
          this.removeUndefined({
            ...report,
            id: docId,
            processedAt: Timestamp.fromDate(report.processedAt),
          }) as Record<string, unknown>
        );
      }
      await batch.commit();
    }

    return { saved: fresh.length, skipped: reports.length - fresh.length };
  }

  /**
   * Get the Gmail cursor: the last IMAP UID ingested.
   */
  async getCursor(): Promise<GmailCursor | null> {
    const db = getFirestoreDB();
    const docSnap = await getDoc(doc(db, this.configCollection, 'cursor'));
    if (!docSnap.exists()) {
      return null;
    }
    const data = docSnap.data();
    return { uidValidity: data.uidValidity, lastUid: data.lastUid };
  }

  /**
   * Advance the Gmail cursor.
   */
  async saveCursor(cursor: GmailCursor): Promise<void> {
    const db = getFirestoreDB();
    await setDoc(doc(db, this.configCollection, 'cursor'), {
      ...cursor,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Convert Firestore Timestamp to Date
   */
  private toDate(timestamp: unknown): Date {
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
      return (timestamp as { toDate: () => Date }).toDate();
    }
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
      return new Date((timestamp as { seconds: number }).seconds * 1000);
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
