import { NextRequest, NextResponse } from 'next/server';
import { DmarcFirestoreService } from '@/common/dmarc/firestore';
import { DmarcAnalyzer } from '@/common/dmarc/analyzer';

const firestoreService = new DmarcFirestoreService();
const analyzer = new DmarcAnalyzer();

// GET: Retrieve DMARC reports with optional filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const reportId = searchParams.get('reportId');

    // Get specific report by ID
    if (reportId) {
      const report = await firestoreService.getReportById(reportId);
      if (!report) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ report });
    }

    // Get reports by date range
    let reports;
    if (startDate && endDate) {
      reports = await firestoreService.getReportsByDateRange(
        new Date(startDate),
        new Date(endDate)
      );
    } else {
      reports = await firestoreService.getAllReports();
    }

    return NextResponse.json({
      reports,
      count: reports.length,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific report
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    await firestoreService.deleteReport(reportId);

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
