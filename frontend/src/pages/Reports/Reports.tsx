import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

interface Report {
  id: string;
  inspectionId: string;
  title: string;
  type: 'inspection' | 'summary' | 'compliance';
  status: 'draft' | 'completed';
  generatedBy: string;
  generatedAt: string;
  summary: {
    totalDoors: number;
    compliantDoors: number;
    nonCompliantDoors: number;
    criticalIssues: number;
    complianceRate: number;
  };
  findings: Array<{
    doorId: string;
    issue: string;
    severity: string;
    recommendation: string;
  }>;
  recommendations: string[];
  fileUrl: string | null;
}

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([
    {
      id: '1',
      inspectionId: '1',
      title: 'Main Building - Floor 1 Fire Door Inspection Report',
      type: 'inspection',
      status: 'completed',
      generatedBy: 'John Inspector',
      generatedAt: '2024-01-15T16:30:00Z',
      summary: {
        totalDoors: 12,
        compliantDoors: 10,
        nonCompliantDoors: 2,
        criticalIssues: 1,
        complianceRate: 83.3,
      },
      findings: [
        {
          doorId: 'FD-001',
          issue: 'Damaged door closer',
          severity: 'high',
          recommendation: 'Replace door closer immediately',
        },
        {
          doorId: 'FD-002',
          issue: 'Door frame misalignment',
          severity: 'medium',
          recommendation: 'Adjust door frame alignment',
        },
      ],
      recommendations: [
        'Replace damaged door closer on FD-001',
        'Fix door frame alignment on FD-002',
        'Schedule follow-up inspection in 30 days',
      ],
      fileUrl: '/reports/inspection-1.pdf',
    },
    {
      id: '2',
      inspectionId: '2',
      title: 'West Wing - Floor 2 Fire Door Inspection Report',
      type: 'inspection',
      status: 'draft',
      generatedBy: 'John Inspector',
      generatedAt: '2024-01-14T15:45:00Z',
      summary: {
        totalDoors: 8,
        compliantDoors: 3,
        nonCompliantDoors: 5,
        criticalIssues: 2,
        complianceRate: 37.5,
      },
      findings: [
        {
          doorId: 'FD-003',
          issue: 'Worn out fire door seals',
          severity: 'critical',
          recommendation: 'Replace fire door seals immediately',
        },
        {
          doorId: 'FD-004',
          issue: 'Missing door closer',
          severity: 'high',
          recommendation: 'Install door closer',
        },
      ],
      recommendations: [
        'Replace fire door seals on FD-003 (URGENT)',
        'Install missing door closer on FD-004',
        'Conduct comprehensive review of all fire doors',
      ],
      fileUrl: null,
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [formData, setFormData] = useState({
    inspectionId: '',
    type: 'inspection' as Report['type'],
    title: '',
  });

  const handleOpenDialog = () => {
    setFormData({
      inspectionId: '',
      type: 'inspection',
      title: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      inspectionId: '',
      type: 'inspection',
      title: '',
    });
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
  };

  const handleCloseViewDialog = () => {
    setSelectedReport(null);
  };

  const handleGenerateReport = () => {
    const newReport: Report = {
      id: (reports.length + 1).toString(),
      inspectionId: formData.inspectionId,
      title: formData.title || `Report for Inspection ${formData.inspectionId}`,
      type: formData.type,
      status: 'completed',
      generatedBy: 'John Inspector',
      generatedAt: new Date().toISOString(),
      summary: {
        totalDoors: 10,
        compliantDoors: 8,
        nonCompliantDoors: 2,
        criticalIssues: 1,
        complianceRate: 80.0,
      },
      findings: [
        {
          doorId: 'FD-001',
          issue: 'Sample issue',
          severity: 'medium',
          recommendation: 'Sample recommendation',
        },
      ],
      recommendations: [
        'Sample recommendation 1',
        'Sample recommendation 2',
      ],
      fileUrl: `/reports/report-${Date.now()}.pdf`,
    };

    setReports(prev => [...prev, newReport]);
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    setReports(prev => prev.filter(report => report.id !== id));
  };

  const getTypeChip = (type: string) => {
    switch (type) {
      case 'inspection':
        return <Chip label="Inspection" color="primary" size="small" />;
      case 'summary':
        return <Chip label="Summary" color="secondary" size="small" />;
      case 'compliance':
        return <Chip label="Compliance" color="info" size="small" />;
      default:
        return <Chip label={type} color="default" size="small" />;
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'completed':
        return <Chip label="Completed" color="success" size="small" />;
      case 'draft':
        return <Chip label="Draft" color="warning" size="small" />;
      default:
        return <Chip label={status} color="default" size="small" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Reports</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Generate Report
        </Button>
      </Box>

      <Grid container spacing={3}>
        {reports.map((report) => (
          <Grid item xs={12} md={6} lg={4} key={report.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="div" sx={{ flex: 1, mr: 1 }}>
                    {report.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {getTypeChip(report.type)}
                    {getStatusChip(report.status)}
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Generated by: {report.generatedBy}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Date: {new Date(report.generatedAt).toLocaleDateString()}
                </Typography>

                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Doors: {report.summary.totalDoors} total
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    Compliant: {report.summary.compliantDoors}
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    Non-compliant: {report.summary.nonCompliantDoors}
                  </Typography>
                  {report.summary.criticalIssues > 0 && (
                    <Typography variant="body2" color="error.main" fontWeight="bold">
                      Critical issues: {report.summary.criticalIssues}
                    </Typography>
                  )}
                  <Typography variant="body2" color="primary.main" fontWeight="bold">
                    Compliance rate: {report.summary.complianceRate}%
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleViewReport(report)}
                  >
                    <ViewIcon />
                  </IconButton>
                  {report.fileUrl && (
                    <IconButton size="small" color="primary">
                      <DownloadIcon />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(report.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Generate Report Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Generate New Report</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Inspection ID"
            value={formData.inspectionId}
            onChange={(e) => setFormData({ ...formData, inspectionId: e.target.value })}
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Report Type</InputLabel>
            <Select
              value={formData.type}
              label="Report Type"
              onChange={(e) => setFormData({ ...formData, type: e.target.value as Report['type'] })}
            >
              <MenuItem value="inspection">Inspection Report</MenuItem>
              <MenuItem value="summary">Summary Report</MenuItem>
              <MenuItem value="compliance">Compliance Report</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Report Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            margin="normal"
            placeholder="Leave empty for auto-generated title"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleGenerateReport} variant="contained">
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={!!selectedReport} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        {selectedReport && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon />
                {selectedReport.title}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Total Doors
                    </Typography>
                    <Typography variant="h6">
                      {selectedReport.summary.totalDoors}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Compliant
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {selectedReport.summary.compliantDoors}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Non-compliant
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {selectedReport.summary.nonCompliantDoors}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Compliance Rate
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      {selectedReport.summary.complianceRate}%
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Findings
                </Typography>
                <List>
                  {selectedReport.findings.map((finding, index) => (
                    <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {finding.doorId}
                        </Typography>
                        <Chip
                          label={finding.severity}
                          color={getSeverityColor(finding.severity) as any}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Issue: {finding.issue}
                      </Typography>
                      <Typography variant="body2">
                        Recommendation: {finding.recommendation}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="h6" gutterBottom>
                  Recommendations
                </Typography>
                <List>
                  {selectedReport.recommendations.map((recommendation, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={recommendation} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </DialogContent>
            <DialogActions>
              {selectedReport.fileUrl && (
                <Button startIcon={<DownloadIcon />} variant="outlined">
                  Download PDF
                </Button>
              )}
              <Button onClick={handleCloseViewDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Reports; 