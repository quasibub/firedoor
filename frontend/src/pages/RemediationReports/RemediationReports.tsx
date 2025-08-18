import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  inspection_location: string;
  inspector_name: string;
  inspection_date: string;
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

  // Fetch remediation report
  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/remediation-reports');
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
    Object.entries(report.priorityBreakdown).forEach(([priority, stats]) => {
      csvRows.push([priority, stats.total, stats.completed, stats.pending, stats.inProgress, stats.rejected]);
    });
    csvRows.push(['']);
    
    // Add category stats
    csvRows.push(['Category Performance']);
    csvRows.push(['Category', 'Total', 'Completed', 'Completion Rate (%)']);
    report.categoryStats.forEach(stat => {
      csvRows.push([stat.category, stat.total, stat.completed, stat.completionRate]);
    });
    csvRows.push(['']);
    
    // Add location stats
    csvRows.push(['Location Performance']);
    csvRows.push(['Location', 'Total', 'Completed', 'Completion Rate (%)']);
    report.locationStats.forEach(stat => {
      csvRows.push([stat.location, stat.total, stat.completed, stat.completionRate]);
    });
    csvRows.push(['']);
    
    // Add task details
    csvRows.push(['Task Details']);
    csvRows.push(['Door ID', 'Location', 'Title', 'Priority', 'Status', 'Assigned To', 'Category', 'Created Date', 'Completed Date']);
    filteredTasks.forEach(task => {
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
    });
    
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
    
    Object.entries(report.priorityBreakdown).forEach(([priority, stats]) => {
      reportContent += `${priority.toUpperCase()}: ${stats.total} total, ${stats.completed} completed, ${stats.pending} pending, ${stats.inProgress} in progress, ${stats.rejected} rejected\n`;
    });
    
    reportContent += `\nCATEGORY PERFORMANCE
-------------------\n`;
    report.categoryStats.forEach(stat => {
      reportContent += `${stat.category}: ${stat.total} total, ${stat.completed} completed (${stat.completionRate}%)\n`;
    });
    
    reportContent += `\nLOCATION PERFORMANCE
--------------------\n`;
    report.locationStats.forEach(stat => {
      reportContent += `${stat.location}: ${stat.total} total, ${stat.completed} completed (${stat.completionRate}%)\n`;
    });
    
    reportContent += `\nRECENT ACTIVITY (Last 30 Days)
---------------------------\n`;
    reportContent += `Completions: ${report.recentActivity.completions}\n`;
    reportContent += `Photos Uploaded: ${report.recentActivity.photos}\n`;
    reportContent += `Rejections: ${report.recentActivity.rejections}\n`;
    
    reportContent += `\nTASK DETAILS
------------\n`;
    filteredTasks.forEach((task, index) => {
      reportContent += `${index + 1}. ${task.title}\n`;
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
    });
    
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
    
    const doc = new jsPDF();
    let yPosition = 20;

    // Helper function to safely update yPosition
    const updateYPosition = (increment: number) => {
      yPosition += increment;
      return yPosition;
    };

    // Helper function to check and handle page breaks
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > 250) {
        doc.addPage();
        yPosition = 20;
      }
    };

    // Helper function to add text safely
    const addText = (text: string, x: number, y: number, fontSize: number = 11, fontStyle: string = 'normal') => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      doc.text(text, x, y);
    };

    // Title
    addText('FIRE DOOR REMEDIATION REPORT', 105, yPosition, 16, 'bold');
    yPosition = updateYPosition(15);
    
    // Date
    addText(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, 105, yPosition, 10);
    yPosition = updateYPosition(20);

    // Summary Statistics
    addText('SUMMARY STATISTICS', 20, yPosition, 12, 'bold');
    yPosition = updateYPosition(10);
    
    addText(`Total Tasks: ${report.summary.totalTasks}`, 20, yPosition);
    yPosition = updateYPosition(6);
    addText(`Completed Tasks: ${report.summary.completedTasks}`, 20, yPosition);
    yPosition = updateYPosition(6);
    addText(`Pending Tasks: ${report.summary.pendingTasks}`, 20, yPosition);
    yPosition = updateYPosition(6);
    addText(`In Progress Tasks: ${report.summary.inProgressTasks}`, 20, yPosition);
    yPosition = updateYPosition(6);
    addText(`Rejected Tasks: ${report.summary.rejectedTasks}`, 20, yPosition);
    yPosition = updateYPosition(6);
    addText(`Cancelled Tasks: ${report.summary.cancelledTasks}`, 20, yPosition);
    yPosition = updateYPosition(6);
    addText(`Overall Completion Rate: ${report.summary.completionRate}%`, 20, yPosition);
    yPosition = updateYPosition(15);

    // Priority Breakdown
    addText('PRIORITY BREAKDOWN', 20, yPosition, 12, 'bold');
    yPosition = updateYPosition(10);
    
    const priorityData = [
      ['Priority', 'Total', 'Completed', 'Pending', 'In Progress', 'Rejected'],
      ['Critical', report.priorityBreakdown.critical.total, report.priorityBreakdown.critical.completed, report.priorityBreakdown.critical.pending, report.priorityBreakdown.critical.inProgress, report.priorityBreakdown.critical.rejected],
      ['High', report.priorityBreakdown.high.total, report.priorityBreakdown.high.completed, report.priorityBreakdown.high.pending, report.priorityBreakdown.high.inProgress, report.priorityBreakdown.high.rejected],
      ['Medium', report.priorityBreakdown.medium.total, report.priorityBreakdown.medium.completed, report.priorityBreakdown.medium.pending, report.priorityBreakdown.medium.inProgress, report.priorityBreakdown.medium.rejected],
      ['Low', report.priorityBreakdown.low.total, report.priorityBreakdown.low.completed, report.priorityBreakdown.low.pending, report.priorityBreakdown.low.inProgress, report.priorityBreakdown.low.rejected]
    ];

    doc.autoTable({
      head: [priorityData[0]],
      body: priorityData.slice(1),
      startY: yPosition,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8 }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Category Performance
    addText('CATEGORY PERFORMANCE', 20, yPosition, 12, 'bold');
    yPosition = updateYPosition(10);
    
    const categoryData = [
      ['Category', 'Total', 'Completed', 'Rate %'],
      ...report.categoryStats.map(cat => [cat.category, cat.total, cat.completed, cat.completionRate])
    ];

    doc.autoTable({
      head: [categoryData[0]],
      body: categoryData.slice(1),
      startY: yPosition,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8 }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Location Performance
    addText('LOCATION PERFORMANCE', 20, yPosition, 12, 'bold');
    yPosition = updateYPosition(10);
    
    const locationData = [
      ['Location', 'Total', 'Completed', 'Rate %'],
      ...report.locationStats.map(loc => [loc.location, loc.total, loc.completed, loc.completionRate])
    ];

    doc.autoTable({
      head: [locationData[0]],
      body: locationData.slice(1),
      startY: yPosition,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8 }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Recent Activity
    addText('RECENT ACTIVITY (Last 30 Days)', 20, yPosition, 12, 'bold');
    yPosition = updateYPosition(10);
    
    addText(`Completions: ${report.recentActivity.completions}`, 20, yPosition);
    yPosition = updateYPosition(6);
    addText(`Photos Uploaded: ${report.recentActivity.photos}`, 20, yPosition);
    yPosition = updateYPosition(6);
    addText(`Rejections: ${report.recentActivity.rejections}`, 20, yPosition);
    yPosition = updateYPosition(15);

    // Task Details with Photos
    addText('TASK DETAILS WITH PHOTOS', 20, yPosition, 12, 'bold');
    yPosition = updateYPosition(15);

    for (let i = 0; i < report.tasks.length; i++) {
      const task = report.tasks[i];
      
      // Check if we need a new page for the task
      checkPageBreak(100);
      
      addText(`${i + 1}. ${task.title}`, 20, yPosition, 11, 'bold');
      yPosition = updateYPosition(8);
      
      addText(`Door ID: ${task.door_id}`, 20, yPosition);
      yPosition = updateYPosition(6);
      addText(`Location: ${task.location}`, 20, yPosition);
      yPosition = updateYPosition(6);
      addText(`Priority: ${task.priority}`, 20, yPosition);
      yPosition = updateYPosition(6);
      addText(`Status: ${task.status}`, 20, yPosition);
      yPosition = updateYPosition(6);
      addText(`Assigned To: ${task.assigned_to}`, 20, yPosition);
      yPosition = updateYPosition(6);
      addText(`Category: ${task.category}`, 20, yPosition);
      yPosition = updateYPosition(6);
      addText(`Created: ${new Date(task.created_at).toLocaleDateString()}`, 20, yPosition);
      yPosition = updateYPosition(6);
      
      if (task.completed_at) {
        addText(`Completed: ${new Date(task.completed_at).toLocaleDateString()}`, 20, yPosition);
        yPosition = updateYPosition(6);
      }
      
      yPosition = updateYPosition(3);
      addText(`Description: ${task.description}`, 20, yPosition);
      yPosition = updateYPosition(8);
      
      yPosition = updateYPosition(3);
      
      // Photos section
      if (task.photos && task.photos.length > 0) {
        addText(`Photos (${task.photos.length}):`, 20, yPosition);
        yPosition = updateYPosition(8);
        
        for (let j = 0; j < task.photos.length; j++) {
          const photo = task.photos[j];
          
          try {
            // Try to get the photo data
            const photoResponse = await fetch(`http://localhost:5000/api/task-photos/${photo.id}`);
            if (photoResponse.ok) {
              const photoData = await photoResponse.json();
              const base64 = photoData.data.photo_data;
              
              // Create a new Image object for each photo
              const img = new Image();
              img.src = base64;
              
              await new Promise((resolve) => {
                const onLoad = () => {
                  // Calculate image dimensions to fit in PDF
                  const maxWidth = 160; // mm
                  const maxHeight = 80; // mm
                  
                  let imgWidth = img.width;
                  let imgHeight = img.height;
                  
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
                  checkPageBreak(imgHeight);
                  
                  // Add image to PDF
                  doc.addImage(base64, 'JPEG', 25, yPosition, imgWidth, imgHeight);
                  yPosition = updateYPosition(imgHeight + 5);
                  resolve(true);
                };
                
                const onError = () => {
                  // Fallback to placeholder if image fails to load
                  doc.rect(25, yPosition, 50, 30);
                  doc.text('Photo Placeholder', 30, yPosition + 15);
                  yPosition = updateYPosition(35);
                  resolve(true);
                };
                
                img.onload = onLoad;
                img.onerror = onError;
              });
              
            } else {
              // Fallback to placeholder
              doc.rect(25, yPosition, 50, 30);
              doc.text('Photo Placeholder', 30, yPosition + 15);
              yPosition = updateYPosition(35);
            }
            
          } catch (error) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Photo ${j + 1}: Error loading image`, 25, yPosition);
            yPosition = updateYPosition(6);
          }
          
          // Check if we need a new page
          checkPageBreak(50);
        }
      }
      
      // Rejections section
      if (task.rejections && task.rejections.length > 0) {
        yPosition = updateYPosition(3);
        addText(`Rejections (${task.rejections.length}):`, 20, yPosition, 11, 'bold');
        yPosition = updateYPosition(8);
        
        for (let index = 0; index < task.rejections.length; index++) {
          const rejection = task.rejections[index];
          addText(`Rejection ${index + 1}: ${rejection.rejection_reason}`, 25, yPosition);
          yPosition = updateYPosition(6);
          if (rejection.alternative_suggestion) {
            addText(`Suggestion: ${rejection.alternative_suggestion}`, 25, yPosition);
            yPosition = updateYPosition(6);
          }
          yPosition = updateYPosition(3);
        }
      }
      
      yPosition = updateYPosition(10); // Space between tasks
    }
   
   // Save the PDF
   doc.save(`remediation-report-${new Date().toISOString().split('T')[0]}.pdf`);
   handleExportMenuClose();
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Remediation Report</Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          endIcon={<MoreVertIcon />}
          onClick={handleExportMenuOpen}
        >
          Export Report
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
                    <TableCell>{task.door_id}</TableCell>
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