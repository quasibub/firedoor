import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import API_ENDPOINTS from '../../config/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon,
  PhotoCamera as PhotoIcon,
  Cancel as RejectIcon,
  CheckCircle as CompleteIcon,
  Schedule as PendingIcon,
  PlayArrow as InProgressIcon,
  MoreVert as MoreVertIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';

interface Task {
  id: string;
  door_id: string;
  location: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'rejected' | 'cancelled';
  assigned_to: string;
  completed_at: string | null;
  notes: string;
  category: string;
  created_at: string;
  inspection_location?: string | null;
  inspector_name?: string | null;
  inspection_date?: string | null;
  inspection_id?: string | null;
  photos: any[];
  rejections: any[];
}

interface RemediationReport {
  generatedAt: string;
  summary: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    rejectedTasks: number;
    cancelledTasks: number;
    completionRate: number;
  };
  priorityBreakdown: {
    critical: { total: number; completed: number; pending: number; inProgress: number; rejected: number };
    high: { total: number; completed: number; pending: number; inProgress: number; rejected: number };
    medium: { total: number; completed: number; pending: number; inProgress: number; rejected: number };
    low: { total: number; completed: number; pending: number; inProgress: number; rejected: number };
  };
  categoryStats: Array<{
    category: string;
    total: number;
    completed: number;
    completionRate: number;
  }>;
  locationStats: Array<{
    location: string;
    total: number;
    completed: number;
    completionRate: number;
  }>;
  recentActivity: {
    completions: number;
    photos: number;
    rejections: number;
  };
  tasks: Task[];
}

const RemediationReports: React.FC = () => {
  const [report, setReport] = useState<RemediationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    location: 'all',
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [pdfExporting, setPdfExporting] = useState(false);

  // Fetch remediation report
  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.REMEDIATION_REPORTS);
      if (!response.ok) {
        throw new Error('Failed to fetch remediation report');
      }
      const data = await response.json();
      if (data.success) {
        setReport(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch remediation report');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const getPriorityChip = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Chip label="Critical" color="error" size="small" />;
      case 'high':
        return <Chip label="High" color="warning" size="small" />;
      case 'medium':
        return <Chip label="Medium" color="info" size="small" />;
      default:
        return <Chip label="Low" color="default" size="small" />;
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'completed':
        return <Chip label="Completed" color="success" size="small" />;
      case 'in-progress':
        return <Chip label="In Progress" color="warning" size="small" />;
      case 'rejected':
        return <Chip label="Rejected" color="error" size="small" />;
      case 'cancelled':
        return <Chip label="Cancelled" color="error" size="small" />;
      default:
        return <Chip label="Pending" color="default" size="small" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CompleteIcon color="success" />;
      case 'in-progress':
        return <InProgressIcon color="warning" />;
      case 'rejected':
        return <RejectIcon color="error" />;
      case 'cancelled':
        return <RejectIcon color="error" />;
      default:
        return <PendingIcon color="action" />;
    }
  };

  const filteredTasks = report?.tasks.filter(task => {
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (filters.category !== 'all' && task.category !== filters.category) return false;
    if (filters.location !== 'all' && task.location !== filters.location) return false;
    return true;
  }) || [];

  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const exportAsJSON = () => {
    if (!report) return;
    
    const reportData = {
      ...report,
      filteredTasks,
      filters,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `remediation-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    handleExportMenuClose();
  };

  const exportAsCSV = () => {
    if (!report) return;
    
    // Create CSV content
    const csvRows = [];
    
    // Add summary statistics
    csvRows.push(['Remediation Report Summary']);
    csvRows.push(['Generated At', report.generatedAt]);
    csvRows.push(['']);
    csvRows.push(['Total Tasks', report.summary.totalTasks]);
    csvRows.push(['Completed Tasks', report.summary.completedTasks]);
    csvRows.push(['Pending Tasks', report.summary.pendingTasks]);
    csvRows.push(['In Progress Tasks', report.summary.inProgressTasks]);
    csvRows.push(['Rejected Tasks', report.summary.rejectedTasks]);
    csvRows.push(['Cancelled Tasks', report.summary.cancelledTasks]);
    csvRows.push(['Completion Rate', `${report.summary.completionRate}%`]);
    csvRows.push(['']);
    
    // Add priority breakdown
    csvRows.push(['Priority Breakdown']);
    csvRows.push(['Priority', 'Total', 'Completed', 'Pending', 'In Progress', 'Rejected']);
    const priorityEntries = Object.entries(report.priorityBreakdown);
    for (let i = 0; i < priorityEntries.length; i++) {
      const [priority, stats] = priorityEntries[i];
      csvRows.push([priority, stats.total, stats.completed, stats.pending, stats.inProgress, stats.rejected]);
    }
    csvRows.push(['']);
    
    // Add category stats
    csvRows.push(['Category Performance']);
    csvRows.push(['Category', 'Total', 'Completed', 'Completion Rate (%)']);
    for (let i = 0; i < report.categoryStats.length; i++) {
      const stat = report.categoryStats[i];
      csvRows.push([stat.category, stat.total, stat.completed, stat.completionRate]);
    }
    csvRows.push(['']);
    
    // Add location stats
    csvRows.push(['Location Performance']);
    csvRows.push(['Location', 'Total', 'Completed', 'Completion Rate (%)']);
    for (let i = 0; i < report.locationStats.length; i++) {
      const stat = report.locationStats[i];
      csvRows.push([stat.location, stat.total, stat.completed, stat.completionRate]);
    }
    csvRows.push(['']);
    
    // Add task details
    csvRows.push(['Task Details']);
    csvRows.push(['Door ID', 'Location', 'Title', 'Priority', 'Status', 'Assigned To', 'Category', 'Created Date', 'Completed Date']);
    for (let i = 0; i < filteredTasks.length; i++) {
      const task = filteredTasks[i];
      csvRows.push([
        task.door_id,
        task.location,
        task.title,
        task.priority,
        task.status,
        task.assigned_to,
        task.category,
        new Date(task.created_at).toLocaleDateString(),
        task.completed_at ? new Date(task.completed_at).toLocaleDateString() : ''
      ]);
    }
    
    const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `remediation-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    handleExportMenuClose();
  };

  const exportAsFormattedReport = () => {
    if (!report) return;
    
    // Create a formatted text report
    let reportContent = `FIRE DOOR REMEDIATION REPORT
Generated: ${new Date(report.generatedAt).toLocaleString()}
==================================================

SUMMARY STATISTICS
------------------
Total Tasks: ${report.summary.totalTasks}
Completed Tasks: ${report.summary.completedTasks}
Pending Tasks: ${report.summary.pendingTasks}
In Progress Tasks: ${report.summary.inProgressTasks}
Rejected Tasks: ${report.summary.rejectedTasks}
Cancelled Tasks: ${report.summary.cancelledTasks}
Overall Completion Rate: ${report.summary.completionRate}%

PRIORITY BREAKDOWN
------------------
`;
    
    const priorityEntries = Object.entries(report.priorityBreakdown);
    for (let i = 0; i < priorityEntries.length; i++) {
      const [priority, stats] = priorityEntries[i];
      reportContent += `${priority.toUpperCase()}: ${stats.total} total, ${stats.completed} completed, ${stats.pending} pending, ${stats.inProgress} in progress, ${stats.rejected} rejected\n`;
    }
    
    reportContent += `\nCATEGORY PERFORMANCE
-------------------\n`;
    for (let i = 0; i < report.categoryStats.length; i++) {
      const stat = report.categoryStats[i];
      reportContent += `${stat.category}: ${stat.total} total, ${stat.completed} completed (${stat.completionRate}%)\n`;
    }
    
    reportContent += `\nLOCATION PERFORMANCE
--------------------\n`;
    for (let i = 0; i < report.locationStats.length; i++) {
      const stat = report.locationStats[i];
      reportContent += `${stat.location}: ${stat.total} total, ${stat.completed} completed (${stat.completionRate}%)\n`;
    }
    
    reportContent += `\nRECENT ACTIVITY (Last 30 Days)
---------------------------\n`;
    reportContent += `Completions: ${report.recentActivity.completions}\n`;
    reportContent += `Photos Uploaded: ${report.recentActivity.photos}\n`;
    reportContent += `Rejections: ${report.recentActivity.rejections}\n`;
    
    reportContent += `\nTASK DETAILS
------------\n`;
    for (let i = 0; i < filteredTasks.length; i++) {
      const task = filteredTasks[i];
      reportContent += `${i + 1}. ${task.title}\n`;
      reportContent += `   Door ID: ${task.door_id}\n`;
      reportContent += `   Location: ${task.location}\n`;
      reportContent += `   Priority: ${task.priority}\n`;
      reportContent += `   Status: ${task.status}\n`;
      reportContent += `   Assigned To: ${task.assigned_to}\n`;
      reportContent += `   Category: ${task.category}\n`;
      reportContent += `   Created: ${new Date(task.created_at).toLocaleDateString()}\n`;
      if (task.completed_at) {
        reportContent += `   Completed: ${new Date(task.completed_at).toLocaleDateString()}\n`;
      }
      if (task.photos && task.photos.length > 0) {
        reportContent += `   Photos: ${task.photos.length}\n`;
      }
      if (task.rejections && task.rejections.length > 0) {
        reportContent += `   Rejections: ${task.rejections.length}\n`;
      }
      reportContent += '\n';
    }
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `remediation-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    handleExportMenuClose();
  };

  const exportAsPDF = async () => {
    if (!report) return;
    
    try {
      setPdfExporting(true);
      const doc = new jsPDF();
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (2 * margin);

      // Helper function to safely update yPosition
      const updateYPosition = (increment: number) => {
        yPosition += increment;
        return yPosition;
      };

      // Helper function to check and handle page breaks
      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
      };

      // Helper function to add text with word wrapping
      const addText = (text: string, x: number, y: number, fontSize: number = 11, fontStyle: string = 'normal', maxLineWidth?: number): number => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        const textWidth = maxLineWidth || (pageWidth - x - margin);
        const lines = doc.splitTextToSize(text || '', textWidth);
        doc.text(lines, x, y);
        return lines.length * (fontSize * 0.4); // Return height used
      };

      // Helper function to center text
      const addCenteredText = (text: string, y: number, fontSize: number = 11, fontStyle: string = 'normal') => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        const textWidth = doc.getTextWidth(text);
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, y);
      };

      // Helper function to compress/resize image using canvas to reduce size
      const compressImage = (base64: string, maxWidth: number, maxHeight: number, quality: number = 0.7): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            try {
              // Calculate new dimensions
              let width = img.width;
              let height = img.height;
              
              if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = width * ratio;
                height = height * ratio;
              }
              
              // Create canvas and resize/compress
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              
              if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
              }
              
              ctx.drawImage(img, 0, 0, width, height);
              
              // Convert to JPEG with compression (JPEG is smaller than PNG)
              const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
              resolve(compressedBase64);
            } catch (err) {
              reject(err);
            }
          };
          
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = base64;
        });
      };

      // Helper function to process and embed a single photo
      const processPhoto = async (photo: any, currentYPos: number): Promise<number> => {
        try {
          const response = await fetch(photo.photo_url);
          if (response.ok) {
            const blob = await response.blob();
            
            // Read blob as base64
            const originalBase64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onerror = () => reject(new Error('Failed to read image'));
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            
            try {
              // Compress image to reduce size and prevent RangeError
              // Target: max 600px width/height, 60% quality to significantly reduce file size
              // This prevents the "Invalid string length" error when processing many large images
              const compressedBase64 = await compressImage(originalBase64, 600, 600, 0.6);
              
              // Now process the compressed image
              return new Promise<number>((resolve, reject) => {
                const img = new Image();
                
                img.onload = () => {
                  try {
                    let imgWidth = img.width;
                    let imgHeight = img.height;
                    
                    // Calculate image dimensions to fit in PDF (convert pixels to mm)
                    const maxWidth = 160; // mm
                    const maxHeight = 80; // mm
                    
                    // Convert pixel dimensions to mm (assuming 96 DPI)
                    const pxToMm = 0.264583;
                    imgWidth = imgWidth * pxToMm;
                    imgHeight = imgHeight * pxToMm;
                    
                    // Scale down if too large
                    if (imgWidth > maxWidth) {
                      const ratio = maxWidth / imgWidth;
                      imgWidth = maxWidth;
                      imgHeight = imgHeight * ratio;
                    }
                    
                    if (imgHeight > maxHeight) {
                      const ratio = maxHeight / imgHeight;
                      imgHeight = maxHeight;
                      imgWidth = imgWidth * ratio;
                    }
                    
                    // Check if we need a new page for the image
                    if (currentYPos + imgHeight > pageHeight - 20) {
                      doc.addPage();
                      currentYPos = 20;
                    }
                    
                    // Use JPEG format (smaller than PNG)
                    // Add image to PDF using compressed base64
                    doc.addImage(compressedBase64, 'JPEG', margin + 5, currentYPos, imgWidth, imgHeight);
                    resolve(currentYPos + imgHeight + 5);
                  } catch (imgError) {
                    console.error('Error adding image to PDF:', imgError);
                    // Check if it's the RangeError we're trying to fix
                    if (imgError instanceof RangeError) {
                      console.warn('Image too large, skipping photo embedding');
                      doc.text('Photo too large to embed', margin + 5, currentYPos + 10);
                      resolve(currentYPos + 20);
                    } else {
                      doc.rect(margin + 5, currentYPos, 50, 30);
                      doc.text('Photo Error', margin + 10, currentYPos + 15);
                      resolve(currentYPos + 35);
                    }
                  }
                };
                
                img.onerror = () => {
                  doc.rect(margin + 5, currentYPos, 50, 30);
                  doc.text('Photo Error', margin + 10, currentYPos + 15);
                  resolve(currentYPos + 35);
                };
                
                img.src = compressedBase64;
              });
            } catch (err) {
              console.error('Error processing image:', err);
              if (err instanceof RangeError) {
                console.warn('Image processing failed due to size, skipping photo');
                doc.text('Photo too large to process', margin + 5, currentYPos + 10);
                return currentYPos + 20;
              } else {
                doc.rect(margin + 5, currentYPos, 50, 30);
                doc.text('Photo Error', margin + 10, currentYPos + 15);
                return currentYPos + 35;
              }
            }
          } else {
            // Fallback to placeholder if image fetch fails
            doc.rect(margin + 5, currentYPos, 50, 30);
            doc.text('Photo Unavailable', margin + 10, currentYPos + 15);
            return currentYPos + 35;
          }
        } catch (imageError) {
          console.error('Error processing photo:', imageError);
          // Check for RangeError
          if (imageError instanceof RangeError) {
            console.warn('Photo processing failed due to size limit');
            doc.text('Photo too large', margin + 5, currentYPos + 10);
            return currentYPos + 20;
          }
          // Fallback to placeholder if image processing fails
          doc.rect(margin + 5, currentYPos, 50, 30);
          doc.text('Photo Error', margin + 10, currentYPos + 15);
          return currentYPos + 35;
        }
      };



      // Title (centered)
      addCenteredText('FIRE DOOR REMEDIATION REPORT', yPosition, 16, 'bold');
      yPosition = updateYPosition(15);
      
      // Date (centered)
      addCenteredText(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, yPosition, 10);
      yPosition = updateYPosition(20);

      // Summary Statistics
      const summaryHeight = addText('SUMMARY STATISTICS', margin, yPosition, 12, 'bold');
      yPosition = updateYPosition(summaryHeight + 10);
      
      const totalTasksHeight = addText(`Total Tasks: ${report.summary.totalTasks}`, margin, yPosition);
      yPosition = updateYPosition(totalTasksHeight + 6);
      const completedHeight = addText(`Completed Tasks: ${report.summary.completedTasks}`, margin, yPosition);
      yPosition = updateYPosition(completedHeight + 6);
      const pendingHeight = addText(`Pending Tasks: ${report.summary.pendingTasks}`, margin, yPosition);
      yPosition = updateYPosition(pendingHeight + 6);
      const inProgressHeight = addText(`In Progress Tasks: ${report.summary.inProgressTasks}`, margin, yPosition);
      yPosition = updateYPosition(inProgressHeight + 6);
      const rejectedHeight = addText(`Rejected Tasks: ${report.summary.rejectedTasks}`, margin, yPosition);
      yPosition = updateYPosition(rejectedHeight + 6);
      const cancelledHeight = addText(`Cancelled Tasks: ${report.summary.cancelledTasks}`, margin, yPosition);
      yPosition = updateYPosition(cancelledHeight + 6);
      const rateHeight = addText(`Overall Completion Rate: ${report.summary.completionRate}%`, margin, yPosition);
      yPosition = updateYPosition(rateHeight + 15);

      // Priority Breakdown
      const priorityTitleHeight = addText('PRIORITY BREAKDOWN', margin, yPosition, 12, 'bold');
      yPosition = updateYPosition(priorityTitleHeight + 10);
      
      const priorityData = [
        ['Priority', 'Total', 'Completed', 'Pending', 'In Progress', 'Rejected'],
        ['Critical', report.priorityBreakdown.critical.total, report.priorityBreakdown.critical.completed, report.priorityBreakdown.critical.pending, report.priorityBreakdown.critical.inProgress, report.priorityBreakdown.critical.rejected],
        ['High', report.priorityBreakdown.high.total, report.priorityBreakdown.high.completed, report.priorityBreakdown.high.pending, report.priorityBreakdown.high.inProgress, report.priorityBreakdown.high.rejected],
        ['Medium', report.priorityBreakdown.medium.total, report.priorityBreakdown.medium.completed, report.priorityBreakdown.medium.pending, report.priorityBreakdown.medium.inProgress, report.priorityBreakdown.medium.rejected],
        ['Low', report.priorityBreakdown.low.total, report.priorityBreakdown.low.completed, report.priorityBreakdown.low.pending, report.priorityBreakdown.low.inProgress, report.priorityBreakdown.low.rejected]
      ];

      autoTable(doc, {
        head: [priorityData[0]],
        body: priorityData.slice(1),
        startY: yPosition,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 8 },
        margin: { left: margin, right: margin }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;

      // Category Performance
      const categoryTitleHeight = addText('CATEGORY PERFORMANCE', margin, yPosition, 12, 'bold');
      yPosition = updateYPosition(categoryTitleHeight + 10);
      
      const categoryData = [
        ['Category', 'Total', 'Completed', 'Rate %'],
        ...report.categoryStats.map(cat => [cat.category || 'N/A', cat.total, cat.completed, cat.completionRate])
      ];

      autoTable(doc, {
        head: [categoryData[0]],
        body: categoryData.slice(1),
        startY: yPosition,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 8 },
        margin: { left: margin, right: margin }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;

      // Location Performance
      const locationTitleHeight = addText('LOCATION PERFORMANCE', margin, yPosition, 12, 'bold');
      yPosition = updateYPosition(locationTitleHeight + 10);
      
      const locationData = [
        ['Location', 'Total', 'Completed', 'Rate %'],
        ...report.locationStats.map(loc => [loc.location || 'N/A', loc.total, loc.completed, loc.completionRate])
      ];

      autoTable(doc, {
        head: [locationData[0]],
        body: locationData.slice(1),
        startY: yPosition,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 8 },
        margin: { left: margin, right: margin }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;

      // Recent Activity
      const recentTitleHeight = addText('RECENT ACTIVITY (Last 30 Days)', margin, yPosition, 12, 'bold');
      yPosition = updateYPosition(recentTitleHeight + 10);
      
      const completionsHeight = addText(`Completions: ${report.recentActivity.completions}`, margin, yPosition);
      yPosition = updateYPosition(completionsHeight + 6);
      const photosHeight = addText(`Photos Uploaded: ${report.recentActivity.photos}`, margin, yPosition);
      yPosition = updateYPosition(photosHeight + 6);
      const rejectionsHeight = addText(`Rejections: ${report.recentActivity.rejections}`, margin, yPosition);
      yPosition = updateYPosition(rejectionsHeight + 15);

      // Task Details with Photos
      addText('TASK DETAILS WITH PHOTOS', margin, yPosition, 12, 'bold');
      yPosition = updateYPosition(15);

      for (let i = 0; i < report.tasks.length; i++) {
        const task = report.tasks[i];
        
        // Check if we need a new page for the task
        checkPageBreak(100);
        
        addText(`${i + 1}. ${task.title || 'Untitled Task'}`, margin, yPosition, 11, 'bold');
        yPosition = updateYPosition(8);
        
        addText(`Door ID: ${task.door_id || 'N/A'}`, margin, yPosition);
        yPosition = updateYPosition(6);
        addText(`Location: ${task.location || 'N/A'}`, margin, yPosition);
        yPosition = updateYPosition(6);
        addText(`Priority: ${task.priority || 'N/A'}`, margin, yPosition);
        yPosition = updateYPosition(6);
        addText(`Status: ${task.status || 'N/A'}`, margin, yPosition);
        yPosition = updateYPosition(6);
        addText(`Assigned To: ${task.assigned_to || 'Unassigned'}`, margin, yPosition);
        yPosition = updateYPosition(6);
        addText(`Category: ${task.category || 'N/A'}`, margin, yPosition);
        yPosition = updateYPosition(6);
        addText(`Created: ${new Date(task.created_at).toLocaleDateString()}`, margin, yPosition);
        yPosition = updateYPosition(6);
        
        if (task.completed_at) {
          addText(`Completed: ${new Date(task.completed_at).toLocaleDateString()}`, margin, yPosition);
          yPosition = updateYPosition(6);
        }
        
        yPosition = updateYPosition(3);
        const descHeight = addText(`Description: ${task.description || 'No description'}`, margin, yPosition, 10, 'normal', maxWidth);
        yPosition = updateYPosition(descHeight + 3);
        
        // Photos section
        if (task.photos && task.photos.length > 0) {
          addText(`Photos (${task.photos.length}):`, margin, yPosition, 10, 'bold');
          yPosition = updateYPosition(8);
          
          for (let j = 0; j < task.photos.length; j++) {
            const photo = task.photos[j];
            
            try {
              // Add photo information to PDF
              addText(`Photo ${j + 1}: ${photo.description || 'No description'}`, margin + 5, yPosition);
              yPosition = updateYPosition(6);
              addText(`Uploaded: ${new Date(photo.created_at).toLocaleDateString()}`, margin + 5, yPosition);
              yPosition = updateYPosition(6);
              addText(`By: ${photo.uploaded_by_name || 'Unknown'}`, margin + 5, yPosition);
              yPosition = updateYPosition(8);
              
              // Process and embed the photo using the helper function
              yPosition = await processPhoto(photo, yPosition);
              
            } catch (error) {
              console.error(`Error processing photo ${j + 1}:`, error);
              doc.setFontSize(9);
              doc.setFont('helvetica', 'normal');
              doc.text(`Photo ${j + 1}: Error processing`, margin + 5, yPosition);
              yPosition = updateYPosition(6);
            }
            
            // Check if we need a new page
            checkPageBreak(50);
          }
        }
        
        // Rejections section
        if (task.rejections && task.rejections.length > 0) {
          yPosition = updateYPosition(3);
          const rejectionsTitleHeight = addText(`Rejections (${task.rejections.length}):`, margin, yPosition, 11, 'bold');
          yPosition = updateYPosition(rejectionsTitleHeight + 8);
          
          for (let index = 0; index < task.rejections.length; index++) {
            const rejection = task.rejections[index];
            const rejHeight = addText(`Rejection ${index + 1}: ${rejection.rejection_reason || 'No reason provided'}`, margin + 5, yPosition, 10, 'normal', maxWidth - 5);
            yPosition = updateYPosition(rejHeight + 3);
            if (rejection.alternative_suggestion) {
              const sugHeight = addText(`Suggestion: ${rejection.alternative_suggestion}`, margin + 5, yPosition, 10, 'normal', maxWidth - 5);
              yPosition = updateYPosition(sugHeight + 3);
            }
            yPosition = updateYPosition(3);
          }
        }
        
        yPosition = updateYPosition(10); // Space between tasks
      }
     
      // Save the PDF - wrap in try-catch to handle RangeError
      try {
        doc.save(`remediation-report-${new Date().toISOString().split('T')[0]}.pdf`);
        handleExportMenuClose();
      } catch (saveError) {
        // Handle RangeError specifically for PDF save
        if (saveError instanceof RangeError) {
          console.error('PDF too large to save - exceeded string length limit');
          setError('PDF is too large to generate. Try filtering the report to fewer tasks or photos.');
          alert('The PDF is too large to generate. Please filter the report to include fewer items or photos.');
          handleExportMenuClose();
          return;
        } else {
          throw saveError; // Re-throw if it's a different error
        }
      }
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      
      // Handle RangeError specifically
      if (pdfError instanceof RangeError && (pdfError.message.includes('Invalid string length') || pdfError.message.includes('Maximum call stack'))) {
        setError('PDF is too large to generate. The report contains too many large images. Try filtering the report or reducing image sizes.');
        alert('PDF generation failed: The report is too large. Please filter the report to include fewer tasks or photos.');
      } else {
        setError(`Failed to generate PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
        alert(`Failed to generate PDF. Please check the console for details.`);
      }
    } finally {
      setPdfExporting(false);
    }
  };

  if (loading) {
    return <Typography>Loading remediation report...</Typography>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!report) {
    return <Alert severity="warning">No report data available</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4">Remediation Report</Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          endIcon={<MoreVertIcon />}
          onClick={handleExportMenuOpen}
          disabled={pdfExporting}
        >
          {pdfExporting ? 'Generating PDF...' : 'Export Report'}
        </Button>
        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={handleExportMenuClose}
        >
          <MenuItem onClick={exportAsPDF}>
            <PdfIcon sx={{ mr: 1 }} />
            Export as PDF (.pdf)
          </MenuItem>
          <MenuItem onClick={exportAsFormattedReport}>
            <DownloadIcon sx={{ mr: 1 }} />
            Export as Formatted Report (.txt)
          </MenuItem>
          <MenuItem onClick={exportAsCSV}>
            <DownloadIcon sx={{ mr: 1 }} />
            Export as CSV (.csv)
          </MenuItem>
          <MenuItem onClick={exportAsJSON}>
            <DownloadIcon sx={{ mr: 1 }} />
            Export as JSON (.json)
          </MenuItem>
        </Menu>
      </Box>

      {/* Summary Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {report.summary.totalTasks}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Tasks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {report.summary.completedTasks}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {report.summary.pendingTasks + report.summary.inProgressTasks}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">
                {report.summary.completionRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completion Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Overall Progress
          </Typography>
          <LinearProgress
            variant="determinate"
            value={report.summary.completionRate}
            sx={{ height: 10, borderRadius: 5, mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            {report.summary.completedTasks} of {report.summary.totalTasks} tasks completed
          </Typography>
        </CardContent>
      </Card>

      {/* Priority Breakdown */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Priority Breakdown
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {Object.entries(report.priorityBreakdown).map(([priority, stats]) => (
              <Grid item xs={12} sm={6} md={3} key={priority}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {getPriorityChip(priority)}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {stats.total}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="success.main">
                      Completed: {stats.completed}
                    </Typography>
                    <Typography variant="body2" color="warning.main">
                      Pending: {stats.pending}
                    </Typography>
                    <Typography variant="body2" color="info.main">
                      In Progress: {stats.inProgress}
                    </Typography>
                    {stats.rejected > 0 && (
                      <Typography variant="body2" color="error.main">
                        Rejected: {stats.rejected}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Category and Location Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <CategoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Category Performance
              </Typography>
              {report.categoryStats.map((stat) => (
                <Box key={stat.category} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{stat.category}</Typography>
                    <Typography variant="body2">{stat.completionRate}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={stat.completionRate}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {stat.completed} of {stat.total} completed
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Location Performance
              </Typography>
              {report.locationStats.map((stat) => (
                <Box key={stat.location} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{stat.location}</Typography>
                    <Typography variant="body2">{stat.completionRate}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={stat.completionRate}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {stat.completed} of {stat.total} completed
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  label="Priority"
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  label="Category"
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {report.categoryStats.map((stat) => (
                    <MenuItem key={stat.category} value={stat.category}>
                      {stat.category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Location</InputLabel>
                <Select
                  value={filters.location}
                  label="Location"
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                >
                  <MenuItem value="all">All Locations</MenuItem>
                  {report.locationStats.map((stat) => (
                    <MenuItem key={stat.location} value={stat.location}>
                      {stat.location}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Task Details ({filteredTasks.length} tasks)
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Door ID</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {task.door_id}
                        {!task.inspection_id && (
                          <Chip label="Ad-hoc" size="small" color="info" variant="outlined" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{task.location}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {task.title}
                      </Typography>
                    </TableCell>
                    <TableCell>{getPriorityChip(task.priority)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(task.status)}
                        {getStatusChip(task.status)}
                      </Box>
                    </TableCell>
                    <TableCell>{task.assigned_to}</TableCell>
                    <TableCell>{task.category}</TableCell>
                    <TableCell>
                      {new Date(task.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedTask(task);
                          setTaskDetailOpen(true);
                        }}
                      >
                        <AssessmentIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Task Detail Dialog */}
      <Dialog open={taskDetailOpen} onClose={() => setTaskDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Task Details</DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box>
              {!selectedTask.inspection_id && (
                <Chip label="Added by workmen (not on report)" color="info" size="small" sx={{ mb: 1 }} />
              )}
              <Typography variant="h6" gutterBottom>{selectedTask.title}</Typography>
              <Typography variant="body1" paragraph>{selectedTask.description}</Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Door ID: {selectedTask.door_id}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Location: {selectedTask.location}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Assigned to: {selectedTask.assigned_to}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Category: {selectedTask.category}
                  </Typography>
                </Grid>
              </Grid>
              
              <Box display="flex" gap={1} mb={2}>
                {getPriorityChip(selectedTask.priority)}
                {getStatusChip(selectedTask.status)}
              </Box>
              
              {selectedTask.completed_at && (
                <Typography variant="body2" color="success.main" gutterBottom>
                  Completed: {new Date(selectedTask.completed_at).toLocaleDateString()}
                </Typography>
              )}
              
              {selectedTask.notes && (
                <Typography variant="body2" paragraph>
                  <strong>Notes:</strong> {selectedTask.notes}
                </Typography>
              )}
              
              {selectedTask.photos && selectedTask.photos.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    <PhotoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Photos ({selectedTask.photos.length})
                  </Typography>
                  {selectedTask.photos.map((photo) => (
                    <Typography key={photo.id} variant="body2" color="textSecondary">
                      {photo.description} - {new Date(photo.created_at).toLocaleDateString()}
                    </Typography>
                  ))}
                </Box>
              )}
              
              {selectedTask.rejections && selectedTask.rejections.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    <RejectIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Rejections ({selectedTask.rejections.length})
                  </Typography>
                  {selectedTask.rejections.map((rejection) => (
                    <Box key={rejection.id} sx={{ mb: 1 }}>
                      <Typography variant="body2" color="error.main">
                        {rejection.rejection_reason}
                      </Typography>
                      {rejection.alternative_suggestion && (
                        <Typography variant="body2" color="textSecondary">
                          Suggestion: {rejection.alternative_suggestion}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RemediationReports; 