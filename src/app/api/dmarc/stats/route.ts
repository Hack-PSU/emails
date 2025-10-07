import { NextRequest, NextResponse } from 'next/server';
import { DmarcFirestoreService } from '@/common/dmarc/firestore';
import { DmarcAnalyzer } from '@/common/dmarc/analyzer';

const firestoreService = new DmarcFirestoreService();
const analyzer = new DmarcAnalyzer();

// GET: Get analytics and statistics for DMARC reports
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get reports
    let reports;
    if (startDate && endDate) {
      reports = await firestoreService.getReportsByDateRange(
        new Date(startDate),
        new Date(endDate)
      );
    } else {
      reports = await firestoreService.getAllReports();
    }

    // Analyze reports
    const stats = analyzer.analyzeReports(reports);
    const domainSummary = analyzer.getSourceDomainSummary(reports);

    return NextResponse.json({
      stats,
      domainSummary,
      reportCount: reports.length,
    });
  } catch (error) {
    console.error('Error generating stats:', error);
    return NextResponse.json(
      { error: 'Failed to generate statistics' },
      { status: 500 }
    );
  }
}
